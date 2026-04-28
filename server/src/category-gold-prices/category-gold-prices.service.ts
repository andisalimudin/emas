import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

function normalizeCategoryKey(input: any) {
  return typeof input === 'string' ? input.trim().toLowerCase() : '';
}

@Injectable()
export class CategoryGoldPricesService {
  constructor(private prisma: PrismaService) {}

  private validateCategory(category: any) {
    const key = normalizeCategoryKey(category);
    const name = typeof category === 'string' ? category.trim() : '';
    if (!key || !name) {
      throw new BadRequestException('Kategori tidak sah');
    }
    return { key, name };
  }

  private validatePrice(pricePerGram: any) {
    const price = Number(pricePerGram);
    if (!Number.isFinite(price) || price < 0) {
      throw new BadRequestException('Harga 1g tidak sah');
    }
    return price;
  }

  async listPublic() {
    const model = (this.prisma as any).categoryGoldPrice;
    if (!model) {
      return { lastUpdatedAt: null, items: [] };
    }

    const items = await model.findMany({
      orderBy: { category: 'asc' },
      select: { category: true, pricePerGram: true, updatedAt: true, createdAt: true },
    });

    const lastUpdatedAt = (items || []).reduce((latest: any, it: any) => {
      const candidate = it?.updatedAt || it?.createdAt || null;
      if (!candidate) return latest;
      if (!latest) return candidate;
      return new Date(candidate) > new Date(latest) ? candidate : latest;
    }, null);

    return {
      lastUpdatedAt,
      items: (items || [])
        .filter((it: any) => Number(it.pricePerGram || 0) > 0)
        .map((it: any) => ({
          category: it.category,
          pricePerGram: Number(it.pricePerGram || 0),
        })),
    };
  }

  async listWithDiscoveredCategories() {
    const existing = await (this.prisma as any).categoryGoldPrice.findMany({
      orderBy: { category: 'asc' },
    });

    const rows = await this.prisma.product.findMany({
      select: { category: true },
    });

    const discovered = Array.from(
      new Set(
        (rows || [])
          .map((r: any) => (typeof r?.category === 'string' ? r.category.trim() : ''))
          .filter((v: string) => v.length > 0)
      )
    ).sort((a, b) => a.localeCompare(b));

    const byKey = new Map<string, any>();
    for (const it of existing || []) {
      if (it?.key) byKey.set(it.key, it);
    }

    const merged = discovered.map((name) => {
      const key = normalizeCategoryKey(name);
      const found = byKey.get(key);
      return {
        key,
        category: name,
        pricePerGram: Number(found?.pricePerGram || 0),
        updatedAt: found?.updatedAt || null,
      };
    });

    const extra = (existing || [])
      .filter((it: any) => !discovered.some((n) => normalizeCategoryKey(n) === it.key))
      .map((it: any) => ({
        key: it.key,
        category: it.category,
        pricePerGram: Number(it.pricePerGram || 0),
        updatedAt: it.updatedAt || null,
      }));

    return [...merged, ...extra].sort((a, b) => String(a.category).localeCompare(String(b.category)));
  }

  async createNew(category: any, pricePerGram: any, adminId?: string) {
    const model = (this.prisma as any).categoryGoldPrice;
    if (!model) {
      throw new BadRequestException('Prisma client belum dikemaskini. Sila jalankan prisma generate di server.');
    }
    const { key, name } = this.validateCategory(category);
    const price = this.validatePrice(pricePerGram);

    const existing = await model.findUnique({ where: { key } });
    if (existing) {
      throw new BadRequestException('Kategori sudah wujud');
    }

    return model.create({
      data: { key, category: name, pricePerGram: price, createdBy: adminId || null },
    });
  }

  async updateByKey(existingKey: string, category: any, pricePerGram: any, adminId?: string) {
    const model = (this.prisma as any).categoryGoldPrice;
    if (!model) {
      throw new BadRequestException('Prisma client belum dikemaskini. Sila jalankan prisma generate di server.');
    }
    const key = typeof existingKey === 'string' ? existingKey.trim().toLowerCase() : '';
    if (!key) {
      throw new BadRequestException('Kategori tidak sah');
    }

    const found = await model.findUnique({ where: { key } });
    if (!found) {
      throw new BadRequestException('Kategori tidak ditemui');
    }

    const nextCategory = typeof category === 'undefined' ? found.category : category;
    const { key: nextKey, name: nextName } = this.validateCategory(nextCategory);
    const nextPrice =
      typeof pricePerGram === 'undefined' ? Number(found.pricePerGram || 0) : this.validatePrice(pricePerGram);

    if (nextKey === key) {
      return model.update({
        where: { key },
        data: { category: nextName, pricePerGram: nextPrice, createdBy: adminId || null },
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const txModel = (tx as any).categoryGoldPrice;
      if (!txModel) {
        throw new BadRequestException('Prisma client belum dikemaskini. Sila jalankan prisma generate di server.');
      }

      const existingNext = await txModel.findUnique({ where: { key: nextKey } });
      if (existingNext) {
        throw new BadRequestException('Nama kategori baharu sudah wujud');
      }

      const created = await txModel.create({
        data: { key: nextKey, category: nextName, pricePerGram: nextPrice, createdBy: adminId || null },
      });

      const products = await tx.product.findMany({
        select: { id: true, category: true },
      });
      const productIds = (products || [])
        .filter((p: any) => normalizeCategoryKey(p?.category) === key)
        .map((p: any) => p.id);

      if (productIds.length > 0) {
        await tx.product.updateMany({
          where: { id: { in: productIds } },
          data: { category: nextName },
        });
      }

      if ((tx as any).productSubmission) {
        const subs = await (tx as any).productSubmission.findMany({
          select: { id: true, category: true },
        });
        const subIds = (subs || [])
          .filter((s: any) => normalizeCategoryKey(s?.category) === key)
          .map((s: any) => s.id);

        if (subIds.length > 0) {
          await (tx as any).productSubmission.updateMany({
            where: { id: { in: subIds } },
            data: { category: nextName },
          });
        }
      }

      await txModel.delete({ where: { key } });
      return created;
    });
  }

  async upsertPrice(category: any, pricePerGram: any, adminId?: string) {
    const { key, name } = this.validateCategory(category);
    const price = this.validatePrice(pricePerGram);

    return (this.prisma as any).categoryGoldPrice.upsert({
      where: { key },
      update: { category: name, pricePerGram: price, createdBy: adminId || null },
      create: { key, category: name, pricePerGram: price, createdBy: adminId || null },
    });
  }
}
