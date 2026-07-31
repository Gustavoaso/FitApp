import { Controller, Post, Req, Res, HttpStatus } from '@nestjs/common';
import * as express from 'express';
import { BillingService } from './billing.service';

@Controller('billing/webhook')
export class StripeWebhookController {
  constructor(private readonly billingService: BillingService) {}

  @Post()
  async handleWebhook(
    @Req() req: express.Request,
    @Res() res: express.Response,
  ) {
    const signature = req.headers['stripe-signature'];

    try {
      await this.billingService.handleStripeWebhook(
        req.body,
        signature as string,
      );
      return res.status(HttpStatus.OK).send();
    } catch (err: unknown) {
      if (err instanceof Error) {
        return res
          .status(HttpStatus.BAD_REQUEST)
          .send(`Webhook Error: ${err.message}`);
      }
      return res
        .status(HttpStatus.BAD_REQUEST)
        .send(`Webhook Error: ${String(err)}`);
    }
  }
}
