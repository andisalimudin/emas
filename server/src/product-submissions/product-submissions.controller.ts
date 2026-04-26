import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ProductSubmissionsService } from './product-submissions.service';

@Controller('product-submissions')
@UseGuards(AuthGuard('jwt'))
export class ProductSubmissionsController {
  constructor(private readonly service: ProductSubmissionsService) {}

  @Post()
  async create(@Req() req: any, @Body() data: any) {
    if (req?.user?.role !== 'VENDOR') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.createForVendor(req.user.id, data);
  }

  @Get('my')
  async my(@Req() req: any) {
    if (req?.user?.role !== 'VENDOR') {
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

