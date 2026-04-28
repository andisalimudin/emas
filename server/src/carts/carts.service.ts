import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartsService {
  constructor(private prisma: PrismaService) {}

  private normalizeCategoryKey(input: any) {
    return typeof input === 'string' ? input.trim().toLowerCase() : '';
  }

  private async applyCategoryPricingToCart(cart: any) {
    const items = cart?.items || [];
    const keys = Array.from(
      new Set(
        items
          .map((it: any) => this.normalizeCategoryKey(it?.product?.category))
          .filter((v: string) => v.length > 0)
      )
    );

    let prices: any[] = [];
    if (keys.length > 0) {
      const model = (this.prisma as any).categoryGoldPrice;
      if (!model) return cart;
      try {
        prices = await model.findMany({
          where: { key: { in: keys } },
          select: { key: true, pricePerGram: true },
        });
      } catch {
        return cart;
      }
    }

    const byKey = new Map<string, number>();
    for (const p of prices || []) {
      if (p?.key) byKey.set(p.key, Number(p.pricePerGram || 0));
    }

    const newItems = items.map((it: any) => {
      const product = it?.product;
      if (!product) return it;
      const key = this.normalizeCategoryKey(product?.category);
      const pricePerGram = byKey.get(key);
      if (typeof pricePerGram === 'number' && Number.isFinite(pricePerGram) && pricePerGram > 0) {
        const weight = Number(product?.weight);
        if (Number.isFinite(weight) && weight > 0) {
          return { ...it, product: { ...product, price: weight * pricePerGram } };
        }
      }
      return it;
    });

    return { ...cart, items: newItems };
  }

  async getCart(userId: string) {
    let cart = await this.prisma.cart.findUnique({
      where: { userId },
      include: { 
        items: {
          include: { product: true }
        } 
      },
    });

    if (!cart) {
      cart = await this.prisma.cart.create({
        data: { userId },
        include: { 
          items: {
            include: { product: true }
          } 
        },
      });
    }

    return this.applyCategoryPricingToCart(cart as any);
  }

  async addToCart(userId: string, productId: string, quantity: number) {
    console.log(`Adding to cart: userId=${userId}, productId=${productId}, quantity=${quantity}`);
    
    if (!productId) {
      throw new Error("ProductId is required");
    }

    try {
      // Check if product exists
      const product = await this.prisma.product.findUnique({
        where: { id: productId },
      });

      if (!product) {
        throw new NotFoundException(`Product with ID ${productId} not found`);
      }

      const cart = await this.getCart(userId);
      console.log('Cart found/created:', cart.id);

      const existingItem = cart.items.find((item) => item.productId === productId);

      if (existingItem) {
        return await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: { quantity: existingItem.quantity + quantity },
        });
      } else {
        return await this.prisma.cartItem.create({
          data: {
            cartId: cart.id,
            productId,
            quantity,
          },
        });
      }
    } catch (error) {
      console.error('Error in addToCart:', error);
      throw error;
    }
  }

  async updateQuantity(userId: string, cartItemId: string, quantity: number) {
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === cartItemId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    if (quantity <= 0) {
      return this.removeFromCart(userId, cartItemId);
    }

    return this.prisma.cartItem.update({
      where: { id: cartItemId },
      data: { quantity },
    });
  }

  async removeFromCart(userId: string, cartItemId: string) {
    // Verify item belongs to user's cart
    const cart = await this.getCart(userId);
    const item = cart.items.find((i) => i.id === cartItemId);

    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    return this.prisma.cartItem.delete({
      where: { id: cartItemId },
    });
  }

  async clearCart(userId: string) {
    const cart = await this.getCart(userId);
    return this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
