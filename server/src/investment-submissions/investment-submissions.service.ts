import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class InvestmentSubmissionsService {
  constructor(private prisma: PrismaService) {}

  private getModelOrThrow() {
    const model = (this.prisma as any).investmentSubmission;
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

  async createForPartner(partnerId: string, data: any) {
    const transferAmount = Number(data.transferAmount);

    if (!Number.isFinite(transferAmount) || transferAmount <= 0) {
      throw new BadRequestException('Jumlah transfer tidak sah');
    }

    const capitalAmountRaw = Number(data.capitalAmount);
    const capitalAmount = Number.isFinite(capitalAmountRaw) && capitalAmountRaw > 0 ? capitalAmountRaw : transferAmount;

    const payload = {
      partner: { connect: { id: partnerId } },
      capitalAmount,
      transferAmount,
      reference: data.reference || null,
      bankName: data.bankName || null,
      proofUrl: data.proofUrl || null,
      paymentDate: data.paymentDate ? new Date(data.paymentDate) : new Date(),
      status: 'PENDING',
    };

    try {
      const model = this.getModelOrThrow();
      return model.create({
        data: payload,
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async listMine(partnerId: string) {
    try {
      const model = this.getModelOrThrow();
      return model.findMany({
        where: { partnerId },
        orderBy: { createdAt: 'desc' },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async listAll(status?: string) {
    try {
      const model = this.getModelOrThrow();
      return model.findMany({
        where: status ? { status } : undefined,
        orderBy: { createdAt: 'desc' },
        include: {
          partner: {
            select: { id: true, email: true, name: true, role: true },
          },
        },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async approve(id: string, adminId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (!(tx as any).investmentSubmission) {
          throw new BadRequestException('Prisma client belum dikemaskini. Sila jalankan prisma generate di server.');
        }
        if (!(tx as any).investmentLedgerEntry) {
          throw new BadRequestException('Prisma client belum dikemaskini. Sila jalankan prisma generate di server.');
        }

        const submission = await (tx as any).investmentSubmission.findUnique({
          where: { id },
        });

        if (!submission) {
          throw new NotFoundException('Submission tidak ditemui');
        }

        if (submission.status !== 'PENDING') {
          throw new BadRequestException('Submission telah diproses');
        }

        const updated = await (tx as any).investmentSubmission.update({
          where: { id },
          data: {
            status: 'APPROVED',
            approvedBy: adminId,
            approvedAt: new Date(),
          },
          include: {
            partner: { select: { id: true, email: true, name: true, role: true } },
          },
        });

        await (tx as any).wallet.upsert({
          where: { userId: submission.partnerId },
          update: {
            investmentTotal: { increment: Number(submission.transferAmount || 0) },
          investmentBalance: { increment: Number(submission.transferAmount || 0) },
          },
          create: {
            user: { connect: { id: submission.partnerId } },
            balance: 0,
            investmentTotal: Number(submission.transferAmount || 0),
          investmentBalance: Number(submission.transferAmount || 0),
          },
        });

        await (tx as any).investmentLedgerEntry.create({
          data: {
            partner: { connect: { id: submission.partnerId } },
            type: 'DEPOSIT_APPROVED',
            amount: Number(submission.transferAmount || 0),
            grams: 0,
            margin: 0,
            referenceId: submission.id,
            createdBy: adminId,
          },
        });

        return updated;
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async reject(id: string, adminId: string, adminNote?: string) {
    try {
      this.getModelOrThrow();
      const submission = await (this.prisma as any).investmentSubmission.findUnique({
        where: { id },
      });

      if (!submission) {
        throw new NotFoundException('Submission tidak ditemui');
      }

      if (submission.status !== 'PENDING') {
        throw new BadRequestException('Submission telah diproses');
      }

      return (this.prisma as any).investmentSubmission.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedBy: adminId,
          approvedAt: new Date(),
          adminNote: adminNote || null,
        },
        include: {
          partner: { select: { id: true, email: true, name: true, role: true } },
        },
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }
}
