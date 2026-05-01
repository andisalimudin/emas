import { BadRequestException, Body, Controller, ForbiddenException, Post, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { TelegramService } from './telegram.service';

@Controller('telegram')
@UseGuards(AuthGuard('jwt'))
export class TelegramController {
  constructor(private readonly telegramService: TelegramService) {}

  @Post('test')
  async test(@Req() req: any, @Body() body: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    const text = typeof body?.text === 'string' ? body.text : '';
    try {
      return await this.telegramService.sendMessage(text || 'Ujian notifikasi Telegram');
    } catch (err: any) {
      throw new BadRequestException(err?.message || 'Gagal hantar Telegram');
    }
  }
}
