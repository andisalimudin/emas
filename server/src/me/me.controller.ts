import { BadRequestException, Body, Controller, ForbiddenException, Get, Req, Patch, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { MeService } from './me.service';

@Controller('me')
export class MeController {
  constructor(private readonly meService: MeService) {}

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async getMe(@Req() req: any) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    if (!userId) throw new ForbiddenException('Akses tidak dibenarkan');
    return this.meService.getMe(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch()
  async updateMe(@Req() req: any, @Body() body: any) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    if (!userId) throw new ForbiddenException('Akses tidak dibenarkan');
    if (body?.email) {
      throw new BadRequestException('Email tidak boleh diubah');
    }
    return this.meService.updateMe(userId, body);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch('password')
  async changePassword(@Req() req: any, @Body() body: any) {
    const userId = req?.user?.userId || req?.user?.id || req?.user?.sub;
    if (!userId) throw new ForbiddenException('Akses tidak dibenarkan');
    return this.meService.changePassword(userId, body);
  }
}
