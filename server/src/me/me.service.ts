import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

function normalizeOptionalString(v: any) {
  if (v === null) return null;
  if (v === undefined) return undefined;
  const s = typeof v === 'string' ? v.trim() : '';
  return s === '' ? null : s;
}

@Injectable()
export class MeService {
  constructor(private readonly prisma: PrismaService) {}

  async getMe(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        name: true,
        phone: true,
        role: true,
        status: true,
        isLocked: true,
        avatarUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user) throw new NotFoundException('Pengguna tidak ditemui');
    return user;
  }

  async updateMe(userId: string, body: any) {
    const data: any = {};

    if (body?.name !== undefined) data.name = normalizeOptionalString(body.name) || '';
    if (body?.phone !== undefined) data.phone = normalizeOptionalString(body.phone);
    if (body?.username !== undefined) data.username = normalizeOptionalString(body.username);
    if (body?.avatarUrl !== undefined) data.avatarUrl = normalizeOptionalString(body.avatarUrl);

    if (data.name !== undefined && !String(data.name).trim()) {
      throw new BadRequestException('Nama diperlukan');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          email: true,
          username: true,
          name: true,
          phone: true,
          role: true,
          status: true,
          isLocked: true,
          avatarUrl: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      return user;
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('Username telah digunakan');
      }
      throw e;
    }
  }

  async changePassword(userId: string, body: any) {
    const currentPassword = typeof body?.currentPassword === 'string' ? body.currentPassword : '';
    const newPassword = typeof body?.newPassword === 'string' ? body.newPassword : '';

    if (!currentPassword || !newPassword) {
      throw new BadRequestException('Sila isi kata laluan semasa dan kata laluan baharu');
    }
    if (newPassword.length < 8) {
      throw new BadRequestException('Kata laluan baharu mesti sekurang-kurangnya 8 aksara');
    }
    if (currentPassword === newPassword) {
      throw new BadRequestException('Kata laluan baharu mesti berbeza');
    }

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, password: true },
    });
    if (!user) throw new NotFoundException('Pengguna tidak ditemui');

    const ok = await bcrypt.compare(currentPassword, user.password);
    if (!ok) {
      throw new BadRequestException('Kata laluan semasa tidak betul');
    }

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashed },
    });

    return { ok: true };
  }
}

