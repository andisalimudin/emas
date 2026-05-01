import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, User } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email },
    });
  }

  async findByEmailOrUsername(identifier: string): Promise<User | null> {
    const value = typeof identifier === 'string' ? identifier.trim() : '';
    if (!value) return null;

    return this.prisma.user.findFirst({
      where: {
        OR: [{ email: value }, { username: value }],
      },
    });
  }

  async findById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
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
  }

  async findAll() {
    return this.prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
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
  }

  async update(id: string, data: Prisma.UserUpdateInput) {
    const sanitizedData: any = { ...data };
    delete sanitizedData.password;
    if (sanitizedData.role) {
      const role = typeof sanitizedData.role === 'string' ? sanitizedData.role.trim().toUpperCase() : '';
      if (role === 'ADMIN' || role === 'SUPER_ADMIN' || role === 'FINANCE' || role === 'AGENT_MANAGER' || role === 'VIEWER') {
        sanitizedData.role = 'ADMIN';
      } else if (role === 'PARTNER' || role === 'FUNDER') {
        sanitizedData.role = 'PARTNER';
      } else if (role === 'VENDOR' || role === 'AGENT') {
        sanitizedData.role = 'VENDOR';
      } else {
        sanitizedData.role = 'CUSTOMER';
      }
    }

    try {
      return await this.prisma.user.update({
        where: { id },
        data: sanitizedData,
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
    } catch (e: any) {
      if (e?.code === 'P2002') {
        throw new BadRequestException('Email atau username telah digunakan');
      }
      throw e;
    }
  }

  async remove(id: string) {
    return this.prisma.user.delete({
      where: { id },
    });
  }
}
