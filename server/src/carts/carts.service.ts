import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CartsService {
  constructor(private prisma: PrismaService) {}

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

    return cart;
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
