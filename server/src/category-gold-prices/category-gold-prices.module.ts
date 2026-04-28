import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { CategoryGoldPricesController } from './category-gold-prices.controller';
import { CategoryGoldPricesService } from './category-gold-prices.service';

@Module({
  imports: [PrismaModule],
  controllers: [CategoryGoldPricesController],
  providers: [CategoryGoldPricesService],
})
export class CategoryGoldPricesModule {}
