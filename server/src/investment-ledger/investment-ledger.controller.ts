import { Body, Controller, ForbiddenException, Get, Param, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvestmentLedgerService } from './investment-ledger.service';

@Controller('investment-ledger')
@UseGuards(AuthGuard('jwt'))
export class InvestmentLedgerController {
  constructor(private readonly service: InvestmentLedgerService) {}

  @Get('partners')
  async partners(@Req() req: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.listPartners();
  }

  @Get(':partnerId')
  async entries(@Req() req: any, @Param('partnerId') partnerId: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.listEntries(partnerId);
  }

  @Post(':partnerId/restore')
  async restore(@Req() req: any, @Param('partnerId') partnerId: string, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.restoreDeposit(partnerId, body?.amount, body?.note, req.user.id);
  }

  @Post(':partnerId/payout')
  async payout(@Req() req: any, @Param('partnerId') partnerId: string, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.payoutOfferTransaction(partnerId, body?.entryId, body?.note, req.user.id);
  }
}
