import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class WalletService {
  constructor(private prisma: PrismaService) {}

  async getWallet(userId: string) {
    let wallet = await this.prisma.wallet.findUnique({
      where: { userId },
      include: { 
        transactions: {
          orderBy: { createdAt: 'desc' },
          take: 10
        }
      }
    });

    if (!wallet) {
      wallet = await this.prisma.wallet.create({
        data: { userId },
        include: { transactions: true }
      });
    }

    return wallet;
  }

  async topUp(userId: string, amount: number) {
    // Logic: 1 Token = RM2
    // User pays RM X, gets X/2 Tokens
    // For simplicity here, we assume 'amount' is the number of TOKENS to add
    // In a real scenario, this would be called after payment gateway success
    
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    const wallet = await this.getWallet(userId);

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { increment: amount } }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: amount,
          type: 'TOPUP',
          description: `Top-up ${amount} tokens`
        }
      });

      return updatedWallet;
    });
  }

  async deductTokens(userId: string, tokens: number, description: string) {
    const wallet = await this.getWallet(userId);

    if (wallet.balance < tokens) {
      throw new BadRequestException('Insufficient token balance');
    }

    return this.prisma.$transaction(async (tx) => {
      const updatedWallet = await tx.wallet.update({
        where: { id: wallet.id },
        data: { balance: { decrement: tokens } }
      });

      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -tokens,
          type: 'DEDUCT',
          description: description
        }
      });

      return updatedWallet;
    });
  }
}
