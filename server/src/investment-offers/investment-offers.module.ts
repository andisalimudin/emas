import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvestmentOffersController } from './investment-offers.controller';
import { InvestmentOffersService } from './investment-offers.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvestmentOffersController],
  providers: [InvestmentOffersService],
})
export class InvestmentOffersModule {}
