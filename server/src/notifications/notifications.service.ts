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

  private async getUserSummary(userId: string) {
    const id = typeof userId === 'string' ? userId.trim() : '';
    if (!id) return null;
    try {
      return await this.prisma.user.findUnique({
        where: { id },
        select: { id: true, name: true, username: true, role: true, email: true },
      });
    } catch {
      return null;
    }
  }

  private formatMoneyMYR(amount: any) {
    const n = Number(amount);
    if (!Number.isFinite(n)) return null;
    return `RM ${n.toLocaleString('ms-MY', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  }

  private formatWhenMY(date: Date) {
    const d = date instanceof Date ? date : new Date(date as any);
    if (!d || Number.isNaN(d.getTime())) return null;
    return d.toLocaleString('ms-MY', {
      timeZone: 'Asia/Kuala_Lumpur',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  private extractAmountMYR(texts: string[]) {
    const text = (texts || []).filter(Boolean).join(' ');
    const m = text.match(/rm\s*([0-9]+(?:\.[0-9]{1,2})?)/i);
    if (!m) return null;
    const n = Number(m[1]);
    return Number.isFinite(n) ? n : null;
  }

  private extractReferenceId(texts: string[]) {
    const text = (texts || []).filter(Boolean).join(' ');
    const m = text.match(/\b(?:pesanan\s*id|order\s*id|id)\s*:\s*([a-z0-9-]{6,})/i);
    return m?.[1] ? String(m[1]).trim() : null;
  }

  private formatTelegramText(input: {
    title: string;
    message: string;
    type: string;
    actor?: { id?: string; name?: string; username?: string | null; role?: string; email?: string | null } | null;
    recipient?: { id?: string; name?: string; username?: string | null; role?: string; email?: string | null } | null;
    targets?: string[];
    targetUsernames?: string[];
    referenceId?: string | null;
    amountMYR?: number | null;
    createdAt?: Date | null;
  }) {
    const title = String(input?.title || '').trim();
    const message = String(input?.message || '').trim();
    const type = String(input?.type || '').trim().toUpperCase();
    const actorName = String(input?.actor?.name || '').trim();
    const actorUsername = String(input?.actor?.username || '').trim();
    const actorRole = String(input?.actor?.role || '').trim();
    const targets = Array.isArray(input?.targets) ? input.targets.filter((x) => typeof x === 'string' && x.trim()) : [];
    const recipientName = String(input?.recipient?.name || '').trim();
    const recipientUsername = String(input?.recipient?.username || '').trim();
    const recipientRole = String(input?.recipient?.role || '').trim();
    const targetUsernames = Array.isArray(input?.targetUsernames)
      ? input.targetUsernames.filter((x) => typeof x === 'string' && x.trim())
      : [];

    const when = this.formatWhenMY(input?.createdAt instanceof Date ? input.createdAt : new Date());
    const ref = (typeof input?.referenceId === 'string' && input.referenceId.trim()
      ? input.referenceId.trim()
      : this.extractReferenceId([title, message])) as string | null;
    const amount =
      typeof input?.amountMYR === 'number' && Number.isFinite(input.amountMYR) && input.amountMYR > 0
        ? input.amountMYR
        : this.extractAmountMYR([title, message]);
    const amountText = amount ? this.formatMoneyMYR(amount) : null;
    const actorRoleUpper = actorRole.toUpperCase();
    const actorLabel = actorRoleUpper === 'ADMIN' ? 'Admin' : 'User';

    const lines = [
      `[${type || 'SYSTEM'}] ${title}`,
      ref ? `Transaksi: ${ref}` : null,
      recipientRole.toUpperCase() === 'ADMIN'
        ? 'Penerima: ADMIN'
        : recipientName
          ? `Penerima: ${recipientName}${recipientUsername ? ` (@${recipientUsername})` : ''}${recipientRole ? ` (${recipientRole})` : ''}`
          : recipientUsername
            ? `Penerima: @${recipientUsername}${recipientRole ? ` (${recipientRole})` : ''}`
            : null,
      actorName
        ? `${actorLabel}: ${actorName}${actorUsername ? ` (@${actorUsername})` : ''}${actorRole ? ` (${actorRole})` : ''}`
        : actorUsername
          ? `${actorLabel}: @${actorUsername}${actorRole ? ` (${actorRole})` : ''}`
          : null,
      `Description: ${message}`,
      amountText ? `Amaun: ${amountText}` : null,
      targets.length ? `Targets: ${targets.length}` : null,
      targetUsernames.length ? `Usernames: ${targetUsernames.slice(0, 5).join(', ')}${targetUsernames.length > 5 ? ', ...' : ''}` : null,
      when ? `Masa: ${when}` : null,
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
    input: { title: string; message: string; type: string; actorUserId?: string; referenceId?: string; amountMYR?: number; telegramMode?: string; telegramRecipientRole?: string }
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
        const telegramMode = typeof input?.telegramMode === 'string' ? input.telegramMode.trim().toUpperCase() : '';
        const actorId = typeof input?.actorUserId === 'string' && input.actorUserId.trim() ? input.actorUserId.trim() : userId;
        const actor = await this.getUserSummary(actorId);
        const recipient = await this.getUserSummary(userId);
        const shouldSendDefault =
          String(actor?.role || '').toUpperCase() === 'ADMIN' && String(recipient?.role || '').toUpperCase() !== 'ADMIN';
        const shouldSend = telegramMode === 'ALWAYS' ? true : shouldSendDefault;
        if (shouldSend) {
          await this.telegramService.sendMessageSafe(
            this.formatTelegramText({
              title,
              message,
              type,
              actor,
              recipient: recipient || (telegramMode === 'ALWAYS' && input?.telegramRecipientRole ? { role: input.telegramRecipientRole } : null),
              referenceId: input?.referenceId || null,
              amountMYR: typeof input?.amountMYR === 'number' ? input.amountMYR : null,
              createdAt: created?.createdAt ? new Date(created.createdAt) : new Date(),
            })
          );
        }
      }
      return created;
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async createForUsers(
    client: PrismaClientLike,
    userIds: string[],
    input: { title: string; message: string; type: string; actorUserId?: string; referenceId?: string; amountMYR?: number; telegramMode?: string; telegramRecipientRole?: string }
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
        const telegramMode = typeof input?.telegramMode === 'string' ? input.telegramMode.trim().toUpperCase() : '';
        const actorId = typeof input?.actorUserId === 'string' && input.actorUserId.trim() ? input.actorUserId.trim() : '';
        const actor = actorId ? await this.getUserSummary(actorId) : null;
        const shouldSendActor = String(actor?.role || '').toUpperCase() === 'ADMIN';
        if (telegramMode === 'ALWAYS') {
          const usernames = await this.prisma.user.findMany({
            where: { id: { in: ids.slice(0, 20) } },
            select: { username: true },
          });
          const targetUsernames = (usernames || [])
            .map((u: any) => (typeof u?.username === 'string' ? u.username.trim() : ''))
            .filter((x: string) => x.length > 0);
          await this.telegramService.sendMessageSafe(
            this.formatTelegramText({
              title,
              message,
              type,
              actor,
              recipient: input?.telegramRecipientRole ? { role: input.telegramRecipientRole } : null,
              targets: ids,
              targetUsernames,
              referenceId: input?.referenceId || null,
              amountMYR: typeof input?.amountMYR === 'number' ? input.amountMYR : null,
              createdAt: new Date(),
            })
          );
        } else if (shouldSendActor) {
          const samples = await this.prisma.user.findMany({
            where: { id: { in: ids.slice(0, 20) } },
            select: { username: true, role: true },
          });
          const usernames = (samples || [])
            .filter((u: any) => String(u?.role || '').toUpperCase() !== 'ADMIN')
            .map((u: any) => (typeof u?.username === 'string' ? u.username.trim() : ''))
            .filter((x: string) => x.length > 0);
          const hasNonAdminTargets = (samples || []).some((u: any) => String(u?.role || '').toUpperCase() !== 'ADMIN');
          if (hasNonAdminTargets) {
            await this.telegramService.sendMessageSafe(
              this.formatTelegramText({
                title,
                message,
                type,
                actor,
                targets: ids,
                targetUsernames: usernames,
                referenceId: input?.referenceId || null,
                amountMYR: typeof input?.amountMYR === 'number' ? input.amountMYR : null,
                createdAt: new Date(),
              })
            );
          }
        }
      }
      return { ok: true, created: Number(res?.count || 0) };
    } catch (err) {
      this.handlePrismaError(err);
    }
  }

  async createForRole(
    client: PrismaClientLike,
    role: string,
    input: { title: string; message: string; type: string; actorUserId?: string; referenceId?: string; amountMYR?: number; telegramMode?: string; telegramRecipientRole?: string }
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
        { ...input, telegramRecipientRole: input?.telegramRecipientRole || normalizedRole }
      );
    } catch (err) {
      this.handlePrismaError(err);
    }
  }
}
