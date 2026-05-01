import { Module } from '@nestjs/common';
import { ProductSubmissionsService } from './product-submissions.service';
import { ProductSubmissionsController } from './product-submissions.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [ProductSubmissionsController],
  providers: [ProductSubmissionsService],
})
export class ProductSubmissionsModule {}
