import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  private normalizeImageUrls(input: any) {
    const urls = Array.isArray(input) ? input : [];
    return urls
      .map((u) => (typeof u === 'string' ? u.trim() : ''))
      .filter((u) => u.length > 0)
      .slice(0, 5);
  }

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

  async create(body: any) {
    const imageUrls = this.normalizeImageUrls(body?.imageUrls);
    const data: any = { ...(body || {}) };
    delete data.imageUrls;
    delete data.categoryRel;
    delete data.images;

    const hasCategoryId = Object.prototype.hasOwnProperty.call(body || {}, 'categoryId');
    const rawCategoryId = hasCategoryId
      ? typeof body?.categoryId === 'string'
        ? body.categoryId.trim()
        : ''
      : null;

    if (Array.isArray(body?.imageUrls) && body.imageUrls.length > 5) {
      throw new BadRequestException('Maksimum 5 gambar untuk setiap produk');
    }

    if (imageUrls.length > 0 && !data.imageUrl) {
      data.imageUrl = imageUrls[0];
    }

    return this.prisma.$transaction(async (tx) => {
      if (hasCategoryId) {
        if (!rawCategoryId) {
          data.categoryId = null;
        } else {
          const found = await tx.category.findUnique({ where: { id: rawCategoryId } });
          if (!found) {
            throw new BadRequestException('Kategori tidak ditemui');
          }
          data.categoryId = rawCategoryId;
        }
      }

      const created = await tx.product.create({ data });

      if (imageUrls.length > 0) {
        const model = (tx as any).productImage;
        if (model) {
          await model.createMany({
            data: imageUrls.map((url, idx) => ({
              productId: created.id,
              url,
              sortOrder: idx,
            })),
          });
        }
      }

      return tx.product.findUnique({
        where: { id: created.id },
        include: { images: { orderBy: { sortOrder: 'asc' } }, categoryRel: true },
      });
    });
  }

  async findAll() {
    const items = await this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
      include: { images: { orderBy: { sortOrder: 'asc' } }, categoryRel: true },
    });
    return this.applyCategoryPricing(items as any);
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } }, categoryRel: true },
    });
    const [priced] = await this.applyCategoryPricing(product ? [product] : []);
    return priced || null;
  }

  async update(id: string, body: any) {
    const hasImageUrls = Object.prototype.hasOwnProperty.call(body || {}, 'imageUrls');
    const imageUrls = hasImageUrls ? this.normalizeImageUrls(body?.imageUrls) : null;

    const data: any = { ...(body || {}) };
    delete data.imageUrls;
    delete data.categoryRel;
    delete data.images;

    const hasCategoryId = Object.prototype.hasOwnProperty.call(body || {}, 'categoryId');
    const rawCategoryId = hasCategoryId
      ? typeof body?.categoryId === 'string'
        ? body.categoryId.trim()
        : ''
      : null;

    if (Array.isArray(body?.imageUrls) && body.imageUrls.length > 5) {
      throw new BadRequestException('Maksimum 5 gambar untuk setiap produk');
    }

    if (hasImageUrls && imageUrls) {
      data.imageUrl = imageUrls.length > 0 ? imageUrls[0] : null;
    }

    return this.prisma.$transaction(async (tx) => {
      if (hasCategoryId) {
        if (!rawCategoryId) {
          data.categoryId = null;
        } else {
          const found = await tx.category.findUnique({ where: { id: rawCategoryId } });
          if (!found) {
            throw new BadRequestException('Kategori tidak ditemui');
          }
          data.categoryId = rawCategoryId;
        }
      }

      const updated = await tx.product.update({
        where: { id },
        data,
      });

      if (hasImageUrls) {
        const model = (tx as any).productImage;
        if (model) {
          await model.deleteMany({ where: { productId: id } });
          if ((imageUrls || []).length > 0) {
            await model.createMany({
              data: (imageUrls || []).map((url, idx) => ({
                productId: id,
                url,
                sortOrder: idx,
              })),
            });
          }
        }
      }

      return tx.product.findUnique({
        where: { id: updated.id },
        include: { images: { orderBy: { sortOrder: 'asc' } }, categoryRel: true },
      });
    });
  }

  async remove(id: string) {
    return this.prisma.product.delete({
      where: { id },
    });
  }
}
