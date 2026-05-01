import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { SettingsModule } from './settings/settings.module';
import { CartsModule } from './carts/carts.module';
import { WalletModule } from './wallet/wallet.module';
import { ProductSubmissionsModule } from './product-submissions/product-submissions.module';
import { InvestmentSubmissionsModule } from './investment-submissions/investment-submissions.module';
import { CategoryGoldPricesModule } from './category-gold-prices/category-gold-prices.module';
import { InvestmentOffersModule } from './investment-offers/investment-offers.module';
import { InvestmentLedgerModule } from './investment-ledger/investment-ledger.module';
import { UploadsModule } from './uploads/uploads.module';
import { AdminDashboardModule } from './admin-dashboard/admin-dashboard.module';
import { MeModule } from './me/me.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    ProductSubmissionsModule,
    InvestmentSubmissionsModule,
    CategoryGoldPricesModule,
    InvestmentOffersModule,
    InvestmentLedgerModule,
    UploadsModule,
    AdminDashboardModule,
    MeModule,
    SettingsModule,
    CartsModule,
    WalletModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
