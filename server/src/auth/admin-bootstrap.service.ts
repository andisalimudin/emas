import { Injectable, OnModuleInit } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminBootstrapService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    const nodeEnv = typeof process.env.NODE_ENV === 'string' ? process.env.NODE_ENV.toLowerCase() : '';
    const isProd = nodeEnv === 'production';

    const email = (process.env.DEFAULT_ADMIN_EMAIL || 'admin@goldexclude.com').trim();
    const username = (process.env.DEFAULT_ADMIN_USERNAME || 'admin').trim();
    const name = (process.env.DEFAULT_ADMIN_NAME || 'Super Admin').trim();
    const forceReset =
      typeof process.env.DEFAULT_ADMIN_FORCE_RESET === 'string' &&
      (process.env.DEFAULT_ADMIN_FORCE_RESET.trim() === '1' ||
        process.env.DEFAULT_ADMIN_FORCE_RESET.trim().toLowerCase() === 'true');

    const existing = await this.prisma.user.findFirst({
      where: {
        OR: [{ role: 'ADMIN' }, { email }, { username }],
      },
    });

    if (existing) {
      if (forceReset) {
        const password =
          typeof process.env.DEFAULT_ADMIN_PASSWORD === 'string' && process.env.DEFAULT_ADMIN_PASSWORD.trim()
            ? process.env.DEFAULT_ADMIN_PASSWORD.trim()
            : '';

        if (!password) {
          throw new Error('DEFAULT_ADMIN_PASSWORD is required when DEFAULT_ADMIN_FORCE_RESET is enabled');
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await this.prisma.user.update({
          where: { id: existing.id },
          data: {
            email,
            username,
            name,
            password: hashedPassword,
            role: 'ADMIN',
          },
        });
        return;
      }

      if (!existing.username && username) {
        const taken = await this.prisma.user.findFirst({ where: { username } });
        if (!taken) {
          await this.prisma.user.update({
            where: { id: existing.id },
            data: { username },
          });
        }
      }
      return;
    }

    const password =
      typeof process.env.DEFAULT_ADMIN_PASSWORD === 'string' && process.env.DEFAULT_ADMIN_PASSWORD.trim()
        ? process.env.DEFAULT_ADMIN_PASSWORD.trim()
        : isProd
          ? ''
          : 'adminpassword123';

    if (isProd && !password) {
      throw new Error('DEFAULT_ADMIN_PASSWORD is required in production');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });
  }
}
