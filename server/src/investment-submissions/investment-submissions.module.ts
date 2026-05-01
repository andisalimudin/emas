import { Module } from '@nestjs/common';
import { InvestmentSubmissionsController } from './investment-submissions.controller';
import { InvestmentSubmissionsService } from './investment-submissions.service';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [InvestmentSubmissionsController],
  providers: [InvestmentSubmissionsService],
})
export class InvestmentSubmissionsModule {}
