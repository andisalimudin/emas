import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

function normalizeKey(input: any) {
  return typeof input === 'string' ? input.trim().toLowerCase() : '';
}

function roundGrams(value: number) {
  return Math.round(value * 10000) / 10000;
}

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function maskMiddle(input: any) {
  const s = typeof input === 'string' ? input.trim() : '';
  if (!s) return '-';
  if (s.length === 1) return `${s}*`;
  if (s.length === 2) return `${s[0]}*`;
  return `${s[0]}${'*'.repeat(s.length - 2)}${s[s.length - 1]}`;
}

function maskEmail(input: any) {
  const s = typeof input === 'string' ? input.trim() : '';
  if (!s) return '-';
  const at = s.indexOf('@');
  if (at <= 0 || at === s.length - 1) {
    return maskMiddle(s);
  }
  const username = s.slice(0, at);
  const domain = s.slice(at + 1);
  return `${maskMiddle(username)}@${maskMiddle(domain)}`;
}

@Injectable()
export class InvestmentOffersService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  private getModelOrThrow(modelName: string, client: any = this.prisma) {
    const model = client?.[modelName];
    if (!model) {
      throw new BadRequestException('Prisma client belum dikemaskini. Sila jalankan prisma generate di server.');
    }
    return model;
  }

  private handlePrismaError(err: unknown): never {
    const code = (err as any)?.code;
    if (code === 'P2021' || code === 'P2022') {
      throw new BadRequestException('Database belum dikemaskini. Sila jalankan prisma migrate deploy dan prisma generate di server.');
    }

    if ((err as any)?.name === 'PrismaClientValidationError') {
      throw new BadRequestException('Data tidak sah. Sila semak input dan cuba lagi.');
    }

    if (err instanceof Prisma.PrismaClientKnownRequestError) {
      throw new BadRequestException('Permintaan tidak dapat diproses. Sila cuba lagi.');
    }

    throw err;
  }

  private async getBasePricePerGram(client: any = this.prisma) {
    const key = normalizeKey('B&I');
    if (!key) return 0;
    const model = this.getModelOrThrow('categoryGoldPrice', client);
    try {
      const row = await model.findUnique({ where: { key } });
      return Number(row?.pricePerGram || 0);
    } catch {
      return 0;
    }
  }

  async listActiveForPartner() {
    try {
      const offerModel = this.getModelOrThrow('investmentOffer');
      const offers = await offerModel.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
      });

      const basePricePerGram = await this.getBasePricePerGram();
      const filteredOffers = (offers || []).filter((o: any) => Number(o.gramsRemaining || 0) > 0);
      const offerIds = filteredOffers.map((o: any) => String(o.id)).filter(Boolean);

      let investorsByOfferId = new Map<string, any[]>();
      if (offerIds.length > 0) {
        const commitmentModel = this.getModelOrThrow('investmentCommitment');
        const rows = await commitmentModel.findMany({
          where: {
            offerId: { in: offerIds },
            status: { in: ['PENDING', 'APPROVED'] },
          },
          select: {
            offerId: true,
            grams: true,
            partnerId: true,
            partner: { select: { name: true, email: true } },
          },
          orderBy: { createdAt: 'desc' },
        });

        const tmp = new Map<string, Map<string, { name: string; email: string; grams: number }>>();
        for (const r of rows || []) {
          const oid = String((r as any).offerId || '');
          const pid = String((r as any).partnerId || '');
          if (!oid || !pid) continue;
          const grams = roundGrams(Number((r as any).grams || 0));
          if (!Number.isFinite(grams) || grams <= 0) continue;

          let byPartner = tmp.get(oid);
          if (!byPartner) {
            byPartner = new Map();
            tmp.set(oid, byPartner);
          }

          const prev = byPartner.get(pid);
          const name = String((r as any)?.partner?.name || '');
          const email = String((r as any)?.partner?.email || '');
          byPartner.set(pid, {
            name: name || prev?.name || '',
            email: email || prev?.email || '',
            grams: roundGrams((prev?.grams || 0) + grams),
          });
        }

        investorsByOfferId = new Map(
          Array.from(tmp.entries()).map(([oid, byPartner]) => [
            oid,
            Array.from(byPartner.values())
              .sort((a, b) => (b.grams || 0) - (a.grams || 0))
              .map((x) => ({
                name: maskMiddle(x.name),
                email: maskEmail(x.email),
                grams: roundGrams(Number(x.grams || 0)),
              })),
          ])
        );
      }

      return filteredOffers.map((o: any) => ({
        ...o,
        baseCategory: 'B&I',
        basePricePerGram,
        costPerGram: basePricePerGram,
        investors: investorsByOfferId.get(String(o.id)) || [],
      }));
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async listMyCommitments(partnerId: string) {
    try {
      const commitmentModel = this.getModelOrThrow('investmentCommitment');
      return commitmentModel.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
        include: {
          offer: true,
        },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async commit(partnerId: string, offerId: string, gramsInput: any) {
    const grams = roundGrams(Number(gramsInput));
    if (!Number.isFinite(grams) || grams <= 0) {
      throw new BadRequestException('Jumlah gram tidak sah');
    }

    try {
      this.getModelOrThrow('investmentOffer');
      this.getModelOrThrow('investmentCommitment');

      const res = await this.prisma.$transaction(async (tx) => {
        this.getModelOrThrow('investmentOffer', tx as any);
        this.getModelOrThrow('investmentCommitment', tx as any);
        this.getModelOrThrow('categoryGoldPrice', tx as any);

        const offer = await (tx as any).investmentOffer.findUnique({ where: { id: offerId } });
        if (!offer) {
          throw new NotFoundException('Offer tidak ditemui');
        }
        if (offer.status !== 'ACTIVE') {
          throw new BadRequestException('Offer tidak aktif');
        }

        const basePricePerGram = await this.getBasePricePerGram(tx as any);
        const marginPerGram = Number(offer.marginPerGram || 0);
        if (!Number.isFinite(basePricePerGram) || basePricePerGram <= 0) {
          throw new BadRequestException('Harga semasa tidak tersedia untuk offer ini');
        }

        const amt = roundMoney(grams * basePricePerGram);
        if (!Number.isFinite(amt) || amt <= 0) {
          throw new BadRequestException('Jumlah gram terlalu kecil');
        }

        const wallet = await tx.wallet.upsert({
          where: { userId: partnerId },
          update: {},
          create: { userId: partnerId, balance: 0, investmentTotal: 0, investmentBalance: 0 },
        });

        const available = Number(wallet?.investmentBalance || 0);
        const pendingAgg = await (tx as any).investmentCommitment.aggregate({
          where: { partnerId, status: 'PENDING' },
          _sum: { amount: true },
        });
        const pendingTotal = Number(pendingAgg?._sum?.amount || 0);
        const effectiveAvailable = roundMoney(available - pendingTotal);

        if (effectiveAvailable < amt) {
          throw new BadRequestException('Baki pelaburan tidak mencukupi');
        }

        const remaining = Number(offer.gramsRemaining || 0);
        if (grams > remaining) {
          throw new BadRequestException('Offer tidak mencukupi gram');
        }

        const commitment = await (tx as any).investmentCommitment.create({
          data: {
            offer: { connect: { id: offerId } },
            partner: { connect: { id: partnerId } },
            amount: amt,
            grams,
            basePricePerGram,
            marginPerGram,
            status: 'PENDING',
          },
          include: { offer: true },
        });

        const updatedOffer = await (tx as any).investmentOffer.findUnique({ where: { id: offerId } });

        return { commitment, offer: updatedOffer };
      });
      await this.notificationsService.createForUser(this.prisma as any, partnerId, {
        title: 'Komitmen Pelaburan Dihantar',
        message: `Komitmen pelaburan anda telah dihantar dan sedang menunggu kelulusan admin.`,
        type: 'INVESTMENT',
        actorUserId: partnerId,
      });
      await this.notificationsService.createForRole(this.prisma as any, 'ADMIN', {
        title: 'Komitmen Pelaburan Baru',
        message: `Ada komitmen pelaburan baru untuk disemak.`,
        type: 'INVESTMENT',
        actorUserId: partnerId,
      });
      return res;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async adminListCommitments() {
    try {
      const commitmentModel = this.getModelOrThrow('investmentCommitment');
      return commitmentModel.findMany({
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        include: {
          offer: true,
          partner: { select: { id: true, email: true, name: true, role: true } },
        },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async adminApproveCommitment(commitmentId: string, adminId: string) {
    try {
      this.getModelOrThrow('investmentCommitment');
      let partnerId = '';
      let grams = 0;
      let amt = 0;

      const res = await this.prisma.$transaction(async (tx) => {
        this.getModelOrThrow('investmentCommitment', tx as any);
        this.getModelOrThrow('investmentLedgerEntry', tx as any);

        const found = await (tx as any).investmentCommitment.findUnique({
          where: { id: commitmentId },
          include: { offer: true, partner: { select: { id: true, email: true, name: true, role: true } } },
        });

        if (!found) {
          throw new NotFoundException('Rekod pelaburan tidak ditemui');
        }

        if (String(found.status || '').toUpperCase() !== 'PENDING') {
          throw new BadRequestException('Rekod pelaburan telah diproses');
        }

        grams = roundGrams(Number(found.grams || 0));
        if (!Number.isFinite(grams) || grams <= 0) {
          throw new BadRequestException('Jumlah gram tidak sah');
        }

        const marginAmount = roundMoney(grams * Number(found.marginPerGram || 0));

        const offerUpdate = await (tx as any).investmentOffer.updateMany({
          where: { id: found.offerId, status: 'ACTIVE', gramsRemaining: { gte: grams } },
          data: { gramsRemaining: { decrement: grams } },
        });

        if (offerUpdate.count !== 1) {
          throw new BadRequestException('Offer tidak mencukupi gram');
        }

        amt = roundMoney(Number(found.amount || 0));
        if (!Number.isFinite(amt) || amt <= 0) {
          throw new BadRequestException('Amaun pelaburan tidak sah');
        }
        const delta = roundMoney(marginAmount - amt);

        await tx.wallet.upsert({
          where: { userId: found.partnerId },
          update: {},
          create: { userId: found.partnerId, balance: 0, investmentTotal: 0, investmentBalance: 0, investmentGramsTotal: 0 },
        });

        const wallet = await tx.wallet.findUnique({ where: { userId: found.partnerId } });
        const currentBalance = Number(wallet?.investmentBalance || 0);
        if (currentBalance < amt) {
          throw new BadRequestException('Baki pelaburan tidak mencukupi');
        }

        const nextInvestmentTotal = Math.max(0, roundMoney(Number(wallet?.investmentTotal || 0) - amt + marginAmount));

        await tx.wallet.update({
          where: { userId: found.partnerId },
          data: {
            investmentBalance: roundMoney(currentBalance + delta),
            investmentGramsTotal: { increment: grams },
            investmentTotal: nextInvestmentTotal,
          },
        });

        const updated = await (tx as any).investmentCommitment.update({
          where: { id: commitmentId },
          data: {
            status: 'APPROVED',
            approvedBy: adminId,
            approvedAt: new Date(),
          },
          include: { offer: true, partner: { select: { id: true, email: true, name: true, role: true } } },
        });

        await (tx as any).investmentLedgerEntry.create({
          data: {
            partner: { connect: { id: found.partnerId } },
            type: 'OFFER_APPROVED',
            amount: amt,
            grams,
            margin: marginAmount,
            referenceId: commitmentId,
            createdBy: adminId,
          },
        });
        partnerId = String(found.partnerId || '');

        return { commitment: updated, marginAmount };
      });
      if (partnerId) {
        await this.notificationsService.createForUser(this.prisma as any, partnerId, {
          title: 'Komitmen Pelaburan Diluluskan',
          message: `Komitmen pelaburan anda telah diluluskan. Gram: ${grams}, Amaun: RM${amt.toFixed(2)}.`,
          type: 'INVESTMENT',
          actorUserId: adminId,
          referenceId: commitmentId,
          amountMYR: amt,
        });
      }
      return res;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async adminRejectCommitment(commitmentId: string, adminId: string, adminNote?: any) {
    try {
      this.getModelOrThrow('investmentCommitment');
      this.getModelOrThrow('investmentOffer');
      let partnerId = '';
      let note = null as string | null;

      const res = await this.prisma.$transaction(async (tx) => {
        this.getModelOrThrow('investmentCommitment', tx as any);
        this.getModelOrThrow('investmentOffer', tx as any);

        const found = await (tx as any).investmentCommitment.findUnique({
          where: { id: commitmentId },
          include: { offer: true, partner: { select: { id: true, email: true, name: true, role: true } } },
        });

        if (!found) {
          throw new NotFoundException('Rekod pelaburan tidak ditemui');
        }

        if (String(found.status || '').toUpperCase() !== 'PENDING') {
          throw new BadRequestException('Rekod pelaburan telah diproses');
        }

        note = typeof adminNote === 'string' && adminNote.trim() ? adminNote.trim() : null;

        const updated = await (tx as any).investmentCommitment.update({
          where: { id: commitmentId },
          data: {
            status: 'REJECTED',
            approvedBy: adminId,
            approvedAt: new Date(),
            adminNote: note,
          },
          include: { offer: true, partner: { select: { id: true, email: true, name: true, role: true } } },
        });
        partnerId = String(found.partnerId || '');

        return { commitment: updated };
      });
      if (partnerId) {
        await this.notificationsService.createForUser(this.prisma as any, partnerId, {
          title: 'Komitmen Pelaburan Ditolak',
          message: `Komitmen pelaburan anda telah ditolak.${note ? ` Nota admin: ${note}` : ''}`.trim(),
          type: 'INVESTMENT',
          actorUserId: adminId,
          referenceId: commitmentId,
        });
      }
      return res;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async adminList() {
    try {
      const offerModel = this.getModelOrThrow('investmentOffer');
      return offerModel.findMany({
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async adminCreate(body: any, adminId: string) {
    const gramsTotal = Number(body?.gramsTotal);
    const marginPerGram = Number(body?.marginPerGram);
    const baseCategory = 'B&I';
    const status = typeof body?.status === 'string' && body.status.trim() ? body.status.trim().toUpperCase() : 'ACTIVE';
    const title = typeof body?.title === 'string' && body.title.trim() ? body.title.trim() : null;

    if (!Number.isFinite(gramsTotal) || gramsTotal <= 0) {
      throw new BadRequestException('Jumlah gram tidak sah');
    }
    if (!Number.isFinite(marginPerGram) || marginPerGram < 0) {
      throw new BadRequestException('Margin keuntungan tidak sah');
    }
    if (status !== 'ACTIVE' && status !== 'INACTIVE') {
      throw new BadRequestException('Status tidak sah');
    }

    try {
      const offerModel = this.getModelOrThrow('investmentOffer');
      const created = await offerModel.create({
        data: {
          title,
          baseCategory,
          gramsTotal,
          gramsRemaining: gramsTotal,
          marginPerGram,
          status,
          createdBy: adminId,
        },
      });
      await this.notificationsService.createForRole(this.prisma as any, 'PARTNER', {
        title: 'Offer Pelaburan Baru',
        message: `Offer pelaburan baru telah ditambah. Sila semak di E-Wallet.`,
        type: 'INVESTMENT',
        actorUserId: adminId,
      });
      return created;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async adminUpdate(id: string, body: any, adminId: string) {
    try {
      const offerModel = this.getModelOrThrow('investmentOffer');
      const found = await offerModel.findUnique({ where: { id } });
      if (!found) {
        throw new NotFoundException('Offer tidak ditemui');
      }

      const patch: any = {};

      patch.baseCategory = 'B&I';

      if (typeof body?.title !== 'undefined') {
        patch.title = typeof body.title === 'string' && body.title.trim() ? body.title.trim() : null;
      }

      if (typeof body?.marginPerGram !== 'undefined') {
        const marginPerGram = Number(body.marginPerGram);
        if (!Number.isFinite(marginPerGram) || marginPerGram < 0) {
          throw new BadRequestException('Margin keuntungan tidak sah');
        }
        patch.marginPerGram = marginPerGram;
      }

      if (typeof body?.status !== 'undefined') {
        const status = typeof body.status === 'string' ? body.status.trim().toUpperCase() : '';
        if (status !== 'ACTIVE' && status !== 'INACTIVE') {
          throw new BadRequestException('Status tidak sah');
        }
        patch.status = status;
      }

      return offerModel.update({
        where: { id },
        data: patch,
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }
}
