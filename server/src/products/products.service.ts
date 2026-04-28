import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private normalizeCategoryKey(input: any) {
    return typeof input === 'string' ? input.trim().toLowerCase() : '';
  }

  private async applyCategoryPricing(products: any[]) {
    const keys = Array.from(
      new Set(
        (products || [])
          .map((p) => this.normalizeCategoryKey(p?.category))
          .filter((v) => v.length > 0)
      )
    );

    let prices: any[] = [];
    if (keys.length > 0) {
      const model = (this.prisma as any).categoryGoldPrice;
      if (!model) return products || [];
      try {
        prices = await model.findMany({
          where: { key: { in: keys } },
          select: { key: true, pricePerGram: true },
        });
      } catch {
        return products || [];
      }
    }

    const byKey = new Map<string, number>();
    for (const p of prices || []) {
      if (p?.key) byKey.set(p.key, Number(p.pricePerGram || 0));
    }

    return (products || []).map((product) => {
      const key = this.normalizeCategoryKey(product?.category);
      const pricePerGram = byKey.get(key);
      if (typeof pricePerGram === 'number' && Number.isFinite(pricePerGram) && pricePerGram > 0) {
        const weight = Number(product?.weight);
        if (Number.isFinite(weight) && weight > 0) {
          return { ...product, price: weight * pricePerGram };
        }
      }
      return product;
    });
  }

  async create(data: Prisma.ProductCreateInput) {
    return this.prisma.product.create({
      data,
    });
  }

  async findAll() {
    const items = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return this.applyCategoryPricing(items as any);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
    });
    const [priced] = await this.applyCategoryPricing(product ? [product] : []);
    return priced || null;
  }

  async update(id: string, data: Prisma.ProductUpdateInput) {
    return this.prisma.product.update({
      where: { id },
      data,
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
