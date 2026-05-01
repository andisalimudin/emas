import { Controller, Get, Patch, Param, Query, Req, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NotificationsService } from './notifications.service';

@Controller('notifications')
@UseGuards(AuthGuard('jwt'))
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  list(@Req() req: any, @Query('page') page?: string, @Query('limit') limit?: string) {
    const userId = req?.user?.id || req?.user?.userId || req?.user?.sub;
    return this.notificationsService.listForUser(String(userId), { page, limit });
  }

  @Get('unread-count')
  unreadCount(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.userId || req?.user?.sub;
    return this.notificationsService.unreadCount(String(userId));
  }

  @Patch('read-all')
  readAll(@Req() req: any) {
    const userId = req?.user?.id || req?.user?.userId || req?.user?.sub;
    return this.notificationsService.markAllRead(String(userId));
  }

  @Patch(':id/read')
  readOne(@Req() req: any, @Param('id') id: string) {
    const userId = req?.user?.id || req?.user?.userId || req?.user?.sub;
    return this.notificationsService.markRead(String(userId), id);
  }
}

