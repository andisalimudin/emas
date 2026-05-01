import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

type PrismaClientLike = PrismaService | Prisma.TransactionClient | any;

function asInt(value: any, fallback: number) {
  const n = Number.parseInt(String(value ?? ''), 10);
  return Number.isFinite(n) ? n : fallback;
}

@Injectable()
export class NotificationsService {
  constructor(
    private prisma: PrismaService,
    private telegramService: TelegramService
  ) {}

  private formatTelegramText(input: { title: string; message: string; type: string; userId?: string; targets?: string[] }) {
    const title = String(input?.title || '').trim();
    const message = String(input?.message || '').trim();
    const type = String(input?.type || '').trim().toUpperCase();
    const userId = input?.userId ? String(input.userId).trim() : '';
    const targets = Array.isArray(input?.targets) ? input.targets.filter((x) => typeof x === 'string' && x.trim()) : [];

    const now = new Date();
    const when = Number.isNaN(now.getTime()) ? '' : now.toLocaleString('ms-MY', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short', year: 'numeric' });

    const lines = [
      `[${type || 'SYSTEM'}] ${title}`,
      message,
      userId ? `User: ${userId}` : null,
      !userId && targets.length ? `Targets: ${targets.length}` : null,
      when ? `Time: ${when}` : null,
    ].filter(Boolean) as string[];

    return lines.join('\n');
  }

  private getModelOrThrow(modelName: string, client: PrismaClientLike = this.prisma) {
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

  async listForUser(userId: string, input?: { page?: any; limit?: any }) {
    const page = Math.max(1, asInt(input?.page, 1));
    const limit = Math.min(50, Math.max(1, asInt(input?.limit, 20)));
    const skip = (page - 1) * limit;

    try {
      const model = this.getModelOrThrow('notification');
      return model.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      });
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async unreadCount(userId: string) {
    try {
      const model = this.getModelOrThrow('notification');
      const count = await model.count({ where: { userId, isRead: false } });
      return { count };
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async markRead(userId: string, id: string) {
    try {
      const model = this.getModelOrThrow('notification');
      const res = await model.updateMany({
        where: { id, userId },
        data: { isRead: true },
      });
      if (!res?.count) {
        throw new NotFoundException('Notifikasi tidak ditemui');
      }
      return { ok: true };
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async markAllRead(userId: string) {
    try {
      const model = this.getModelOrThrow('notification');
      const res = await model.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
      });
      return { ok: true, updated: Number(res?.count || 0) };
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async createForUser(
    client: PrismaClientLike,
    userId: string,
    input: { title: string; message: string; type: string }
  ) {
    const title = typeof input?.title === 'string' ? input.title.trim() : '';
    const message = typeof input?.message === 'string' ? input.message.trim() : '';
    const type = typeof input?.type === 'string' && input.type.trim() ? input.type.trim().toUpperCase() : 'SYSTEM';

    if (!title || !message) {
      return null;
    }

    try {
      const model = this.getModelOrThrow('notification', client);
      const created = await model.create({
        data: {
          userId,
          title,
          message,
          type,
          isRead: false,
        },
      });
      if (client === this.prisma) {
        await this.telegramService.sendMessageSafe(
          this.formatTelegramText({ title, message, type, userId })
        );
      }
      return created;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async createForUsers(
    client: PrismaClientLike,
    userIds: string[],
    input: { title: string; message: string; type: string }
  ) {
    const ids = Array.isArray(userIds) ? userIds.filter((x) => typeof x === 'string' && x.trim()) : [];
    if (!ids.length) return { ok: true, created: 0 };

    const title = typeof input?.title === 'string' ? input.title.trim() : '';
    const message = typeof input?.message === 'string' ? input.message.trim() : '';
    const type = typeof input?.type === 'string' && input.type.trim() ? input.type.trim().toUpperCase() : 'SYSTEM';

    if (!title || !message) {
      return { ok: true, created: 0 };
    }

    try {
      const model = this.getModelOrThrow('notification', client);
      const res = await model.createMany({
        data: ids.map((userId) => ({
          userId,
          title,
          message,
          type,
          isRead: false,
        })),
      });
      if (client === this.prisma) {
        await this.telegramService.sendMessageSafe(
          this.formatTelegramText({ title, message, type, targets: ids })
        );
      }
      return { ok: true, created: Number(res?.count || 0) };
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async createForRole(
    client: PrismaClientLike,
    role: string,
    input: { title: string; message: string; type: string }
  ) {
    const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
    if (!normalizedRole) return { ok: true, created: 0 };

    try {
      const userModel = this.getModelOrThrow('user', client);
      const users = await userModel.findMany({
        where: { role: normalizedRole },
        select: { id: true },
      });
      return this.createForUsers(
        client,
        (users || []).map((u: any) => String(u.id)),
        input
      );
    } catch (err) {
      this.handlePrismaError(err);
    }
  }
}
