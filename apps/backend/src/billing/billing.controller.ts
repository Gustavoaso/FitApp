import { Controller, Get, Post, Body, UseGuards } from '@nestjs/common';
import { BillingService } from './billing.service';
import { AuthGuard } from '../common/guards/auth.guard';
import { UserId } from '../common/decorators/user.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Billing')
@UseGuards(AuthGuard)
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get('subscription')
  @ApiOperation({ summary: 'Status da assinatura do usuário' })
  getSubscriptionStatus(@UserId() userId: string) {
    return this.billingService.getSubscriptionStatus(userId);
  }

  @Post('create-checkout')
  @ApiOperation({ summary: 'Criar checkout Stripe' })
  createCheckout(@UserId() userId: string, @Body('priceId') priceId: string) {
    return this.billingService.createCheckoutSession(userId, priceId);
  }

  @Post('cancel-subscription')
  @ApiOperation({ summary: 'Cancelar assinatura Pro' })
  cancelSubscription(@UserId() userId: string) {
    return this.billingService.cancelSubscription(userId);
  }
}
