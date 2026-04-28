import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { InvestmentLedgerController } from './investment-ledger.controller';
import { InvestmentLedgerService } from './investment-ledger.service';

@Module({
  imports: [PrismaModule],
  controllers: [InvestmentLedgerController],
  providers: [InvestmentLedgerService],
})
export class InvestmentLedgerModule {}

