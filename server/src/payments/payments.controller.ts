import { BadRequestException, Controller, Get, Param, Patch, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PaymentsService } from './payments.service';

@Controller('payments')
@UseGuards(AuthGuard('jwt'))
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  private getUserId(req: any) {
    return req?.user?.userId || req?.user?.id || req?.user?.sub;
  }

  @Get()
  async list(@Req() req: any, @Query('status') status?: string, @Query('method') method?: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new BadRequestException('Akses tidak dibenarkan');
    }
    return this.paymentsService.listPayments({ status, method });
  }

  @Patch(':id/approve')
  async approve(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new BadRequestException('Akses tidak dibenarkan');
    }
    const adminId = this.getUserId(req);
    return this.paymentsService.approvePayment(id, adminId);
  }

  @Patch(':id/reject')
  async reject(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new BadRequestException('Akses tidak dibenarkan');
    }
    const adminId = this.getUserId(req);
    return this.paymentsService.rejectPayment(id, adminId);
  }
}

