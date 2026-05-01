import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class OrdersService {
  private readonly TOKEN_VALUE_RM = 2;

  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService
  ) {}

  private normalizeCategoryKey(input: any) {
    return typeof input === 'string' ? input.trim().toLowerCase() : '';
  }

  private async buildCategoryPriceMap(client: any, products: any[]) {
    const keys = Array.from(
      new Set(
        (products || [])
          .map((p: any) => this.normalizeCategoryKey(p?.category))
          .filter((v: string) => v.length > 0)
      )
    );

    if (keys.length === 0) return new Map<string, number>();
    const model = (client as any).categoryGoldPrice;
    if (!model) return new Map<string, number>();

    try {
      const prices = await model.findMany({
        where: { key: { in: keys } },
        select: { key: true, pricePerGram: true },
      });
      const map = new Map<string, number>();
      for (const p of prices || []) {
        const k = typeof p?.key === 'string' ? p.key : '';
        const v = Number(p?.pricePerGram || 0);
        if (k && Number.isFinite(v) && v > 0) map.set(k, v);
      }
      return map;
    } catch {
      return new Map<string, number>();
    }
  }

  private computeEffectiveUnitPrice(product: any, priceByKey: Map<string, number>) {
    const key = this.normalizeCategoryKey(product?.category);
    const pricePerGram = priceByKey.get(key);
    const weight = Number(product?.weight);
    if (typeof pricePerGram === 'number' && Number.isFinite(pricePerGram) && pricePerGram > 0) {
      if (Number.isFinite(weight) && weight > 0) {
        return weight * pricePerGram;
      }
    }
    const fallback = Number(product?.price || 0);
    return Number.isFinite(fallback) ? fallback : 0;
  }

  async listMyOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        items: { include: { product: true } },
        payment: true,
        shippingAddress: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAllOrders(status?: string) {
    return this.prisma.order.findMany({
      where: status ? { status } : undefined,
      include: {
        items: { include: { product: true } },
        payment: true,
        shippingAddress: true,
        user: { select: { id: true, name: true, email: true, username: true, role: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getOrderById(orderId: string, requesterUserId: string, requesterRole?: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        items: { include: { product: true } },
        payment: true,
        shippingAddress: true,
        user: { select: { id: true, name: true, email: true, username: true, role: true } },
      },
    });

    if (!order) throw new NotFoundException('Pesanan tidak dijumpai');
    if (requesterRole !== 'ADMIN' && order.userId !== requesterUserId) {
      throw new BadRequestException('Akses tidak dibenarkan');
    }
    return order;
  }

  async checkoutFromCart(userId: string, shippingAddress?: any) {
    const created = await this.prisma.$transaction(async (tx) => {
      const cart = await tx.cart.findUnique({
        where: { userId },
        include: { items: { include: { product: true } } },
      });

      const items = cart?.items || [];
      if (!cart || items.length === 0) {
        throw new BadRequestException('Troli kosong');
      }

      const products = items.map((it: any) => it?.product).filter(Boolean);
      const priceByKey = await this.buildCategoryPriceMap(tx, products);

      for (const it of items) {
        const product = it?.product;
        const qty = Number(it?.quantity || 0);
        if (!product) throw new BadRequestException('Produk tidak sah');
        if (!Number.isFinite(qty) || qty <= 0) throw new BadRequestException('Kuantiti tidak sah');
        const stock = Number(product?.stock || 0);
        if (!Number.isFinite(stock) || stock < qty) {
          throw new BadRequestException(`Stok tidak mencukupi untuk ${product?.name || 'produk'}`);
        }
      }

      const orderItems = items.map((it: any) => {
        const product = it.product;
        const qty = Number(it.quantity || 0);
        const unitPrice = this.computeEffectiveUnitPrice(product, priceByKey);
        return {
          productId: product.id,
          quantity: qty,
          priceAtOrder: unitPrice,
        };
      });

      const totalAmount = orderItems.reduce((sum, it) => sum + Number(it.priceAtOrder || 0) * Number(it.quantity || 0), 0);

      let shippingAddressId: string | undefined;
      const hasAddress =
        shippingAddress &&
        typeof shippingAddress === 'object' &&
        String(shippingAddress?.recipient || '').trim() &&
        String(shippingAddress?.phone || '').trim() &&
        String(shippingAddress?.street || '').trim() &&
        String(shippingAddress?.city || '').trim() &&
        String(shippingAddress?.state || '').trim() &&
        String(shippingAddress?.zipCode || '').trim();

      if (hasAddress) {
        const address = await tx.address.create({
          data: {
            userId,
            label: String(shippingAddress?.label || 'Alamat Penghantaran'),
            recipient: String(shippingAddress?.recipient || ''),
            phone: String(shippingAddress?.phone || ''),
            street: String(shippingAddress?.street || ''),
            city: String(shippingAddress?.city || ''),
            state: String(shippingAddress?.state || ''),
            zipCode: String(shippingAddress?.zipCode || ''),
            country: String(shippingAddress?.country || 'Malaysia'),
            isDefault: Boolean(shippingAddress?.isDefault || false),
          },
          select: { id: true },
        });
        shippingAddressId = address.id;
      }

      for (const it of items) {
        await tx.product.update({
          where: { id: it.productId },
          data: { stock: { decrement: Number(it.quantity || 0) } },
        });
      }

      const order = await tx.order.create({
        data: {
          userId,
          totalAmount,
          shippingAddressId,
          items: { create: orderItems },
        },
        include: {
          items: { include: { product: true } },
          payment: true,
          shippingAddress: true,
        },
      });

      await tx.cartItem.deleteMany({ where: { cartId: cart.id } });
      return order;
    });

    await this.notificationsService.createForUser(this.prisma, userId, {
      title: 'Pesanan Dibuat',
      message: `Pesanan baharu telah dibuat (ID: ${created.id}). Sila buat pembayaran untuk meneruskan.`,
      type: 'ORDER',
      actorUserId: userId,
    });
    await this.notificationsService.createForRole(this.prisma, 'ADMIN', {
      title: 'Pesanan Baharu',
      message: `Pesanan baharu telah dibuat (ID: ${created.id}).`,
      type: 'ORDER',
      actorUserId: userId,
    });

    return created;
  }

  async payWithEwallet(orderId: string, userId: string) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });
      if (!order) throw new NotFoundException('Pesanan tidak dijumpai');
      if (order.userId !== userId) throw new BadRequestException('Akses tidak dibenarkan');
      if ((order.status || '').toUpperCase() === 'PAID') throw new BadRequestException('Pesanan sudah dibayar');

      const wallet = await tx.wallet.findUnique({ where: { userId } });
      const requiredTokens = Math.ceil(Number(order.totalAmount || 0) / this.TOKEN_VALUE_RM);
      if (!wallet || Number(wallet.balance || 0) < requiredTokens) {
        throw new BadRequestException('Baki token tidak mencukupi');
      }

      await tx.wallet.update({
        where: { userId },
        data: { balance: { decrement: requiredTokens } },
      });
      await tx.walletTransaction.create({
        data: {
          walletId: wallet.id,
          amount: -requiredTokens,
          type: 'DEDUCT_PURCHASE',
          description: `Bayaran pesanan ${order.id}`,
        },
      });

      const now = new Date();
      if (order.payment) {
        const currentStatus = String(order.payment.status || '').toUpperCase();
        if (currentStatus === 'APPROVED') throw new BadRequestException('Pesanan sudah dibayar');
        if (currentStatus === 'PENDING') throw new BadRequestException('Pembayaran sedang diproses');

        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            amount: Number(order.totalAmount || 0),
            method: 'EWALLET',
            status: 'APPROVED',
            reference: null,
            proofUrl: null,
            bankName: null,
            paymentDate: now,
            verifiedBy: 'SYSTEM',
            verifiedAt: now,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            userId,
            amount: Number(order.totalAmount || 0),
            method: 'EWALLET',
            status: 'APPROVED',
            paymentDate: now,
            verifiedBy: 'SYSTEM',
            verifiedAt: now,
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: 'PAID', paymentMethod: 'EWALLET', proofUrl: null },
        include: {
          items: { include: { product: true } },
          payment: true,
          shippingAddress: true,
        },
      });
    });

    await this.notificationsService.createForUser(this.prisma, userId, {
      title: 'Pembayaran Berjaya',
      message: `Pembayaran e-wallet berjaya untuk pesanan (ID: ${updated.id}).`,
      type: 'PAYMENT',
      actorUserId: userId,
    });
    await this.notificationsService.createForRole(this.prisma, 'ADMIN', {
      title: 'Pembayaran E-Wallet',
      message: `Pembayaran e-wallet berjaya untuk pesanan (ID: ${updated.id}).`,
      type: 'PAYMENT',
      actorUserId: userId,
    });

    return updated;
  }

  async submitTransferPayment(
    orderId: string,
    userId: string,
    input: { bankName?: string; reference?: string; proofUrl?: string; paymentDate?: string }
  ) {
    const proofUrl = String(input?.proofUrl || '').trim();
    if (!proofUrl) throw new BadRequestException('Slip bayaran diperlukan');

    const updated = await this.prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
        include: { payment: true },
      });
      if (!order) throw new NotFoundException('Pesanan tidak dijumpai');
      if (order.userId !== userId) throw new BadRequestException('Akses tidak dibenarkan');
      if ((order.status || '').toUpperCase() === 'PAID') throw new BadRequestException('Pesanan sudah dibayar');

      const now = new Date();
      const paymentDate = input?.paymentDate ? new Date(input.paymentDate) : now;

      if (order.payment) {
        const currentStatus = String(order.payment.status || '').toUpperCase();
        if (currentStatus === 'APPROVED') throw new BadRequestException('Pesanan sudah dibayar');

        await tx.payment.update({
          where: { id: order.payment.id },
          data: {
            amount: Number(order.totalAmount || 0),
            method: 'MANUAL_TRANSFER',
            status: 'PENDING',
            reference: input?.reference ? String(input.reference) : null,
            proofUrl,
            bankName: input?.bankName ? String(input.bankName) : null,
            paymentDate,
            verifiedBy: null,
            verifiedAt: null,
          },
        });
      } else {
        await tx.payment.create({
          data: {
            orderId: order.id,
            userId,
            amount: Number(order.totalAmount || 0),
            method: 'MANUAL_TRANSFER',
            status: 'PENDING',
            reference: input?.reference ? String(input.reference) : undefined,
            proofUrl,
            bankName: input?.bankName ? String(input.bankName) : undefined,
            paymentDate,
          },
        });
      }

      return tx.order.update({
        where: { id: order.id },
        data: { status: 'PAYMENT_SUBMITTED', paymentMethod: 'MANUAL_TRANSFER', proofUrl },
        include: {
          items: { include: { product: true } },
          payment: true,
          shippingAddress: true,
        },
      });
    });

    await this.notificationsService.createForUser(this.prisma, userId, {
      title: 'Bukti Pembayaran Dihantar',
      message: `Bukti pembayaran telah dihantar untuk semakan (Pesanan ID: ${updated.id}).`,
      type: 'PAYMENT',
      actorUserId: userId,
    });
    await this.notificationsService.createForRole(this.prisma, 'ADMIN', {
      title: 'Semakan Pembayaran',
      message: `Bukti pembayaran baharu untuk semakan (Pesanan ID: ${updated.id}).`,
      type: 'PAYMENT',
      actorUserId: userId,
    });

    return updated;
  }
}

