import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvestmentOffersService } from './investment-offers.service';

@Controller('investment-offers')
@UseGuards(AuthGuard('jwt'))
export class InvestmentOffersController {
  constructor(private readonly service: InvestmentOffersService) {}

  @Get('active')
  async active(@Req() req: any) {
    if (req?.user?.role !== 'PARTNER') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.listActiveForPartner();
  }

  @Get('my')
  async my(@Req() req: any) {
    if (req?.user?.role !== 'PARTNER') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.listMyCommitments(req.user.id);
  }

  @Post(':id/commit')
  async commit(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req?.user?.role !== 'PARTNER') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.commit(req.user.id, id, body?.grams);
  }

  @Get()
  async adminList(@Req() req: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.adminList();
  }

  @Get('commitments')
  async adminListCommitments(@Req() req: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.adminListCommitments();
  }

  @Patch('commitments/:id/approve')
  async adminApproveCommitment(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.adminApproveCommitment(id, req.user.id);
  }

  @Patch('commitments/:id/reject')
  async adminRejectCommitment(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.adminRejectCommitment(id, req.user.id, body?.adminNote);
  }

  @Post()
  async adminCreate(@Req() req: any, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.adminCreate(body, req.user.id);
  }

  @Patch(':id')
  async adminUpdate(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.adminUpdate(id, body, req.user.id);
  }
}
