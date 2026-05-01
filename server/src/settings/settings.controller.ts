import { Controller, ForbiddenException, Get, Body, Param, UseGuards, Put, Req } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('public')
  async findPublic() {
    const allow = new Set(['heroTitle', 'heroSubtitle', 'contactEmail', 'maintenanceMode']);
    const rows = await this.settingsService.findAll();
    return (rows || []).filter((r: any) => allow.has(String(r?.key || '')));
  }

  @UseGuards(AuthGuard('jwt'))
  @Get()
  async findAll(@Req() req: any) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.settingsService.findAll();
  }

  @UseGuards(AuthGuard('jwt'))
  @Get(':key')
  async findOne(@Req() req: any, @Param('key') key: string) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.settingsService.findByKey(key);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':key')
  async update(@Req() req: any, @Param('key') key: string, @Body() body: { value: string; description?: string }) {
    if (req?.user?.role !== 'ADMIN') {
      throw new ForbiddenException('Akses tidak dibenarkan');
    }
    return this.settingsService.update(key, body.value, body.description);
  }
}
