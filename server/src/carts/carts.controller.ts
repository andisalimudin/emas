import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { CartsService } from './carts.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('cart')
@UseGuards(AuthGuard('jwt'))
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}

  @Get()
  getCart(@Request() req) {
    return this.cartsService.getCart(req.user.id);
  }

  @Post()
  addToCart(@Request() req, @Body() body: { productId: string; quantity: number }) {
    return this.cartsService.addToCart(req.user.id, body.productId, body.quantity);
  }

  @Patch(':id')
  updateQuantity(@Request() req, @Param('id') id: string, @Body() body: { quantity: number }) {
    return this.cartsService.updateQuantity(req.user.id, id, body.quantity);
  }

  @Delete(':id')
  removeFromCart(@Request() req, @Param('id') id: string) {
    return this.cartsService.removeFromCart(req.user.id, id);
  }
}
