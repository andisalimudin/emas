import { Module } from '@nestjs/common';
import { InvestmentSubmissionsController } from './investment-submissions.controller';
import { InvestmentSubmissionsService } from './investment-submissions.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [InvestmentSubmissionsController],
  providers: [InvestmentSubmissionsService],
})
export class InvestmentSubmissionsModule {}
