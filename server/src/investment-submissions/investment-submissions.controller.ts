import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { InvestmentSubmissionsService } from './investment-submissions.service';

@Controller('investment-submissions')
@UseGuards(AuthGuard('jwt'))
export class InvestmentSubmissionsController {
  constructor(private readonly service: InvestmentSubmissionsService) {}

  @Post()
  async create(@Req() req: any, @Body() data: any) {
    if (req?.user?.role !== 'PARTNER') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.createForPartner(req.user.id, data);
  }

  @Get('my')
  async my(@Req() req: any) {
    if (req?.user?.role !== 'PARTNER') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.listMine(req.user.id);
  }

  @Get()
  async list(@Req() req: any, @Query('status') status?: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.listAll(status);
  }

  @Patch(':id/approve')
  async approve(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.approve(id, req.user.id);
  }

  @Patch(':id/reject')
  async reject(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.reject(id, req.user.id, body?.adminNote);
  }
}
