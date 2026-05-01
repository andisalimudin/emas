import { BadRequestException, Body, Controller, Get, Param, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { OrdersService } from './orders.service';

@Controller('orders')
@UseGuards(AuthGuard('jwt'))
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  private getUserId(req: any) {
    return req?.user?.userId || req?.user?.id || req?.user?.sub;
  }

  @Get('my')
  async myOrders(@Req() req: any) {
    const userId = this.getUserId(req);
    return this.ordersService.listMyOrders(userId);
  }

  @Get()
  async listAll(@Req() req: any, @Query('status') status?: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new BadRequestException('Akses tidak dibenarkan');
    }
    return this.ordersService.listAllOrders(status);
  }

  @Get(':id')
  async getOrder(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    const role = req?.user?.role;
    return this.ordersService.getOrderById(id, userId, role);
  }

  @Post('checkout')
  async checkout(@Req() req: any, @Body() body: any) {
    const userId = this.getUserId(req);
    return this.ordersService.checkoutFromCart(userId, body?.shippingAddress);
  }

  @Post(':id/pay/ewallet')
  async payWithEwallet(@Req() req: any, @Param('id') id: string) {
    const userId = this.getUserId(req);
    return this.ordersService.payWithEwallet(id, userId);
  }

  @Post(':id/pay/transfer')
  async payWithTransfer(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    const userId = this.getUserId(req);
    return this.ordersService.submitTransferPayment(id, userId, {
      bankName: body?.bankName,
      reference: body?.reference,
      proofUrl: body?.proofUrl,
      paymentDate: body?.paymentDate,
    });
  }
}

