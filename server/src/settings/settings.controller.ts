import { Controller, Get, Post, Body, Param, UseGuards, Put } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get(':key')
  findOne(@Param('key') key: string) {
    return this.settingsService.findByKey(key);
  }

  @UseGuards(AuthGuard('jwt'))
  @Put(':key')
  update(@Param('key') key: string, @Body() body: { value: string; description?: string }) {
    return this.settingsService.update(key, body.value, body.description);
  }
}
