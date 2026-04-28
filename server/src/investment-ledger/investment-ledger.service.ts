import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function roundMoney(value: number) {
  return Math.round(value * 100) / 100;
}

function roundGrams(value: number) {
  return Math.round(value * 10000) / 10000;
}

@Injectable()
export class InvestmentLedgerService {
  constructor(private prisma: PrismaService) {}

  private getModelOrThrow(modelName: string, client: any = this.prisma) {
    const model = client?.[modelName];
    if (!model) {
      throw new BadRequestException('Prisma client belum dikemaskini. Sila jalankan prisma generate di server.');
    }
    return model;
  }

  async listPartners() {
    return this.prisma.user.findMany({
      where: { role: 'PARTNER' },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        createdAt: true,
        wallet: {
          select: {
            investmentTotal: true,
            investmentBalance: true,
            investmentGramsTotal: true,
          },
        },
      },
    });
  }

  async listEntries(partnerId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: {
        id: true,
        role: true,
        email: true,
        name: true,
        wallet: {
          select: {
            investmentTotal: true,
            investmentBalance: true,
            investmentGramsTotal: true,
          },
        },
      },
    });
    if (!user) {
      throw new NotFoundException('Partner tidak ditemui');
    }

    const ledgerModel = this.getModelOrThrow('investmentLedgerEntry');
    const items = await ledgerModel.findMany({
      where: { partnerId },
      orderBy: { createdAt: 'desc' },
    });

    return { partner: user, items };
  }

  async restoreDeposit(partnerId: string, amount: any, note: any, adminId: string) {
    const amt = roundMoney(Number(amount));
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new BadRequestException('Amaun tidak sah');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, role: true },
    });
    if (!user || user.role !== 'PARTNER') {
      throw new NotFoundException('Partner tidak ditemui');
    }

    const cleanNote = typeof note === 'string' && note.trim() ? note.trim() : null;

    return this.prisma.$transaction(async (tx) => {
      this.getModelOrThrow('investmentLedgerEntry', tx as any);

      const wallet = await tx.wallet.upsert({
        where: { userId: partnerId },
        update: {},
        create: { userId: partnerId, balance: 0, investmentTotal: 0, investmentBalance: 0, investmentGramsTotal: 0 },
      });

      const nextTotal = roundMoney(Number(wallet.investmentTotal || 0) + amt);

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { investmentTotal: nextTotal },
      });

      const entry = await (tx as any).investmentLedgerEntry.create({
        data: {
          partner: { connect: { id: partnerId } },
          type: 'RESTORE_DEPOSIT',
          amount: amt,
          grams: 0,
          margin: 0,
          note: cleanNote,
          createdBy: adminId,
        },
      });

      return { wallet: updatedWallet, entry };
    });
  }

  async payoutOfferTransaction(partnerId: string, entryId: any, note: any, adminId: string) {
    const cleanEntryId = typeof entryId === 'string' && entryId.trim() ? entryId.trim() : null;
    if (!cleanEntryId) {
      throw new BadRequestException('Entry ID tidak sah');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: partnerId },
      select: { id: true, role: true },
    });
    if (!user || user.role !== 'PARTNER') {
      throw new NotFoundException('Partner tidak ditemui');
    }

    const ledgerModel = this.getModelOrThrow('investmentLedgerEntry');
    const original = await ledgerModel.findFirst({
      where: { id: cleanEntryId, partnerId, type: 'OFFER_APPROVED' },
    });
    if (!original) {
      throw new NotFoundException('Transaksi offer tidak ditemui');
    }

    const alreadyPaid = await ledgerModel.findFirst({
      where: { partnerId, type: 'OFFER_PAYOUT', referenceId: cleanEntryId },
      select: { id: true },
    });
    if (alreadyPaid) {
      throw new BadRequestException('Transaksi ini telah dibuat payout');
    }

    const amt = roundMoney(Number(original.amount || 0));
    const grams = roundGrams(Number(original.grams || 0));
    if (!Number.isFinite(amt) || amt <= 0) {
      throw new BadRequestException('Amaun transaksi tidak sah');
    }
    if (!Number.isFinite(grams) || grams <= 0) {
      throw new BadRequestException('Gram transaksi tidak sah');
    }

    const cleanNote = typeof note === 'string' && note.trim() ? note.trim() : null;

    return this.prisma.$transaction(async (tx) => {
      this.getModelOrThrow('investmentLedgerEntry', tx as any);

      const wallet = await tx.wallet.upsert({
        where: { userId: partnerId },
        update: {},
        create: { userId: partnerId, balance: 0, investmentTotal: 0, investmentBalance: 0, investmentGramsTotal: 0 },
      });

      const nextTotal = roundMoney(Number(wallet.investmentTotal || 0) + amt);
      const nextGrams = Math.max(0, roundGrams(Number(wallet.investmentGramsTotal || 0) - grams));

      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { investmentTotal: nextTotal, investmentGramsTotal: nextGrams },
      });

      const entry = await (tx as any).investmentLedgerEntry.create({
        data: {
          partner: { connect: { id: partnerId } },
          type: 'OFFER_PAYOUT',
          amount: amt,
          grams,
          margin: 0,
          referenceId: cleanEntryId,
          note: cleanNote,
          createdBy: adminId,
        },
      });

      return { wallet: updatedWallet, entry };
    });
  }
}
