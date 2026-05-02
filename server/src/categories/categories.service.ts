import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

function slugify(input: any) {
  const raw = typeof input === 'string' ? input.trim().toLowerCase() : '';
  const slug = raw
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
  return slug;
}

function isUniqueConstraintError(err: any) {
  return err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';
}

@Injectable()
export class CategoriesService {
  constructor(private prisma: PrismaService) {}

  async list() {
    return this.prisma.category.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async create(body: any) {
    const name = typeof body?.name === 'string' ? body.name.trim() : '';
    const description = typeof body?.description === 'string' ? body.description.trim() : null;
    if (!name) {
      throw new BadRequestException('Nama kategori diperlukan');
    }

    const slug = slugify(name);
    if (!slug) {
      throw new BadRequestException('Nama kategori tidak sah');
    }

    try {
      return await this.prisma.category.create({
        data: {
          name,
          slug,
          description,
        },
      });
    } catch (err: any) {
      if (isUniqueConstraintError(err)) {
        throw new BadRequestException('Kategori sudah wujud');
      }
      throw err;
    }
  }

  async update(id: string, body: any) {
    const categoryId = typeof id === 'string' ? id.trim() : '';
    if (!categoryId) {
      throw new BadRequestException('Kategori tidak sah');
    }

    const existing = await this.prisma.category.findUnique({ where: { id: categoryId } });
    if (!existing) {
      throw new BadRequestException('Kategori tidak ditemui');
    }

    const hasName = Object.prototype.hasOwnProperty.call(body || {}, 'name');
    const hasDescription = Object.prototype.hasOwnProperty.call(body || {}, 'description');

    const name = hasName ? (typeof body?.name === 'string' ? body.name.trim() : '') : existing.name;
    const description = hasDescription ? (typeof body?.description === 'string' ? body.description.trim() : null) : existing.description;

    if (!name) {
      throw new BadRequestException('Nama kategori diperlukan');
    }

    const slug = slugify(name);
    if (!slug) {
      throw new BadRequestException('Nama kategori tidak sah');
    }

    try {
      return await this.prisma.category.update({
        where: { id: categoryId },
        data: {
          name,
          slug,
          description,
        },
      });
    } catch (err: any) {
      if (isUniqueConstraintError(err)) {
        throw new BadRequestException('Kategori sudah wujud');
      }
      throw err;
    }
  }

  async remove(id: string) {
    const categoryId = typeof id === 'string' ? id.trim() : '';
    if (!categoryId) {
      throw new BadRequestException('Kategori tidak sah');
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.product.updateMany({
        where: { categoryId },
        data: { categoryId: null },
      });

      return tx.category.delete({
        where: { id: categoryId },
      });
    });
  }
}

