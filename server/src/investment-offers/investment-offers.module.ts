import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { InvestmentOffersController } from './investment-offers.controller';
import { InvestmentOffersService } from './investment-offers.service';

@Module({
  imports: [PrismaModule, NotificationsModule],
  controllers: [InvestmentOffersController],
  providers: [InvestmentOffersService],
})
export class InvestmentOffersModule {}
