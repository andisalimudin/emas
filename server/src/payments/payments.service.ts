import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  async listPayments(filter?: { status?: string; method?: string }) {
    const where: any = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.method) where.method = filter.method;

    return this.prisma.payment.findMany({
      where: Object.keys(where).length ? where : undefined,
      include: {
        user: { select: { id: true, name: true, email: true, username: true, role: true } },
        order: {
          include: {
            items: { include: { product: true } },
            shippingAddress: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async approvePayment(paymentId: string, adminId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: { include: { items: true } },
        },
      });
      if (!payment) throw new NotFoundException('Pembayaran tidak dijumpai');
      if (String(payment.status || '').toUpperCase() !== 'PENDING') {
        throw new BadRequestException('Pembayaran tidak dalam status PENDING');
      }

      const now = new Date();
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'APPROVED',
          verifiedBy: adminId,
          verifiedAt: now,
          paymentDate: payment.paymentDate || now,
        },
      });

      return tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAID' },
        include: {
          items: { include: { product: true } },
          payment: true,
          shippingAddress: true,
          user: { select: { id: true, name: true, email: true, username: true, role: true } },
        },
      });
    });

    await this.notificationsService.createForUser(this.prisma, updated.userId, {
      title: 'Pembayaran Disahkan',
      message: `Pembayaran anda telah disahkan (Pesanan ID: ${updated.id}).`,
      type: 'PAYMENT',
      actorUserId: adminId,
    });
    await this.notificationsService.createForRole(this.prisma, 'ADMIN', {
      title: 'Pembayaran Disahkan',
      message: `Pembayaran disahkan untuk pesanan (ID: ${updated.id}).`,
      type: 'PAYMENT',
      actorUserId: adminId,
    });

    return updated;
  }

  async rejectPayment(paymentId: string, adminId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const payment = await tx.payment.findUnique({
        where: { id: paymentId },
        include: {
          order: { include: { items: true } },
        },
      });
      if (!payment) throw new NotFoundException('Pembayaran tidak dijumpai');
      if (String(payment.status || '').toUpperCase() !== 'PENDING') {
        throw new BadRequestException('Pembayaran tidak dalam status PENDING');
      }

      const now = new Date();
      await tx.payment.update({
        where: { id: payment.id },
        data: {
          status: 'REJECTED',
          verifiedBy: adminId,
          verifiedAt: now,
        },
      });

      const orderItems = payment.order?.items || [];
      for (const it of orderItems) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { increment: Number(it.quantity || 0) } },
        });
      }

      return tx.order.update({
        where: { id: payment.orderId },
        data: { status: 'PAYMENT_REJECTED' },
        include: {
          items: { include: { product: true } },
          payment: true,
          shippingAddress: true,
          user: { select: { id: true, name: true, email: true, username: true, role: true } },
        },
      });
    });

    await this.notificationsService.createForUser(this.prisma, updated.userId, {
      title: 'Pembayaran Ditolak',
      message: `Pembayaran anda ditolak (Pesanan ID: ${updated.id}). Sila buat pembayaran semula.`,
      type: 'PAYMENT',
      actorUserId: adminId,
    });
    await this.notificationsService.createForRole(this.prisma, 'ADMIN', {
      title: 'Pembayaran Ditolak',
      message: `Pembayaran ditolak untuk pesanan (ID: ${updated.id}).`,
      type: 'PAYMENT',
      actorUserId: adminId,
    });

    return updated;
  }
}

