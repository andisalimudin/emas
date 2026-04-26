import { Module } from '@nestjs/common';
import { ProductSubmissionsService } from './product-submissions.service';
import { ProductSubmissionsController } from './product-submissions.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProductSubmissionsController],
  providers: [ProductSubmissionsService],
})
export class ProductSubmissionsModule {}

