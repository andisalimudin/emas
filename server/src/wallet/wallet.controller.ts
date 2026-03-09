import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('wallet')
@UseGuards(AuthGuard('jwt'))
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @Get()
  getWallet(@Request() req) {
    return this.walletService.getWallet(req.user.id);
  }

  // Temporary endpoint to simulate top-up (for testing)
  // In production, this would be a webhook from payment gateway
  @Post('topup')
  topUp(@Request() req, @Body() body: { tokens: number }) {
    return this.walletService.topUp(req.user.id, body.tokens);
  }

  @Post('deduct')
  deduct(@Request() req, @Body() body: { tokens: number; description: string }) {
    return this.walletService.deductTokens(req.user.id, body.tokens, body.description);
  }
}
