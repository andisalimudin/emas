import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class ProductSubmissionsService {
  constructor(
    private prisma: PrismaService,
    private notificationsService: NotificationsService
  ) {}

  async createForVendor(vendorId: string, data: any) {
    const payload = {
      vendor: { connect: { id: vendorId } },
      name: data.name,
      description: data.description || null,
      weight: Number(data.weight),
      purity: data.purity,
      imageUrl: data.imageUrl || null,
      category: data.category || null,
      stock: Number.isFinite(Number(data.stock)) ? Number(data.stock) : 0,
      price: Number.isFinite(Number(data.price)) ? Number(data.price) : 0,
      lockDuration: Number.isFinite(Number(data.lockDuration)) ? Number(data.lockDuration) : 15,
      hidePrice: !!data.hidePrice,
      status: 'PENDING',
    };

    const created = await (this.prisma as any).productSubmission.create({
      data: payload,
    });
    await this.notificationsService.createForUser(this.prisma as any, vendorId, {
      title: 'Produk Dihantar',
      message: `Produk anda telah dihantar untuk semakan admin.`,
      type: 'PRODUCT',
      actorUserId: vendorId,
    });
    await this.notificationsService.createForRole(this.prisma as any, 'ADMIN', {
      title: 'Semakan Produk Vendor',
      message: `Ada produk vendor baru untuk disemak.`,
      type: 'PRODUCT',
      actorUserId: vendorId,
    });
    return created;
  }

  async listMine(vendorId: string) {
    return (this.prisma as any).productSubmission.findMany({
      where: { vendorId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listAll(status?: string) {
    return (this.prisma as any).productSubmission.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        vendor: {
          select: { id: true, email: true, name: true, role: true },
        },
      },
    });
  }

  async approve(id: string, adminId: string) {
    const submission = await (this.prisma as any).productSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submission tidak ditemui');
    }

    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Submission telah diproses');
    }

    const product = await this.prisma.product.create({
      data: {
        name: submission.name,
        description: submission.description,
        weight: submission.weight,
        purity: submission.purity,
        imageUrl: submission.imageUrl,
        category: submission.category,
        stock: submission.stock,
        price: submission.price,
        lockDuration: submission.lockDuration,
        hidePrice: submission.hidePrice,
        isActive: true,
      },
    });

    const updated = await (this.prisma as any).productSubmission.update({
      where: { id },
      data: {
        status: 'APPROVED',
        approvedBy: adminId,
        approvedAt: new Date(),
        productId: product.id,
      },
      include: {
        vendor: { select: { id: true, email: true, name: true, role: true } },
      },
    });
    await this.notificationsService.createForUser(this.prisma as any, submission.vendorId, {
      title: 'Produk Diluluskan',
      message: `Produk anda telah diluluskan dan diterbitkan.`,
      type: 'PRODUCT',
      actorUserId: submission.vendorId,
    });
    return updated;
  }

  async reject(id: string, adminId: string, adminNote?: string) {
    const submission = await (this.prisma as any).productSubmission.findUnique({
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submission tidak ditemui');
    }

    if (submission.status !== 'PENDING') {
      throw new BadRequestException('Submission telah diproses');
    }

    const updated = await (this.prisma as any).productSubmission.update({
      where: { id },
      data: {
        status: 'REJECTED',
        approvedBy: adminId,
        approvedAt: new Date(),
        adminNote: adminNote || null,
      },
      include: {
        vendor: { select: { id: true, email: true, name: true, role: true } },
      },
    });
    await this.notificationsService.createForUser(this.prisma as any, submission.vendorId, {
      title: 'Produk Ditolak',
      message: `Produk anda telah ditolak.${adminNote ? ` Nota admin: ${String(adminNote).trim()}` : ''}`.trim(),
      type: 'PRODUCT',
      actorUserId: submission.vendorId,
    });
    return updated;
  }
}
