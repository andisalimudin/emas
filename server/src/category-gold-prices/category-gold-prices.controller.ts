import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Put, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoryGoldPricesService } from './category-gold-prices.service';

@Controller('category-gold-prices')
export class CategoryGoldPricesController {
  constructor(private readonly service: CategoryGoldPricesService) {}

  @Get('public')
  async publicList() {
    return this.service.listPublic();
  }

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async list(@Req() req: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.listWithDiscoveredCategories();
  }

  @Put()
  @UseGuards(AuthGuard('jwt'))
  async upsert(@Req() req: any, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.upsertPrice(body?.category, body?.pricePerGram, req.user.id);
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Req() req: any, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.createNew(body?.category, body?.pricePerGram, req.user.id);
  }

  @Patch(':key')
  @UseGuards(AuthGuard('jwt'))
  async update(@Req() req: any, @Param('key') key: string, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.service.updateByKey(key, body?.category, body?.pricePerGram, req.user.id);
  }
}
