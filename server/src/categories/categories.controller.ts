import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  constructor(private readonly categoriesService: CategoriesService) {}

  @Get()
  async list() {
    return this.categoriesService.list();
  }

  @UseGuards(AuthGuard('jwt'))
  @Post()
  async create(@Req() req: any, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.categoriesService.create(body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.categoriesService.update(id, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.categoriesService.remove(id);
  }
}

