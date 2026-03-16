import { Body, Controller, Delete, ForbiddenException, Get, Param, Patch, Req, UseGuards } from '@nestjs/common';
import { UsersService } from './users.service';
import { AuthGuard } from '@nestjs/passport';
import { Prisma } from '@prisma/client';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.usersService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.usersService.findById(id);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':id')
  async update(@Req() req: any, @Param('id') id: string, @Body() data: Prisma.UserUpdateInput) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.usersService.update(id, data);
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':id')
  async remove(@Req() req: any, @Param('id') id: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.usersService.remove(id);
  }
}
