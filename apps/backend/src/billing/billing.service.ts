import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';

@Injectable()
export class BillingService {
  private stripe: Stripe;

  constructor(private readonly prisma: PrismaService) {
    this.stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
      apiVersion: '2024-12-18.acacia' as any,
    });
  }

  async getSubscriptionStatus(userId: string) {
    let sub = await this.prisma.subscription.findFirst({
      where: { user_id: userId },
    });
    if (!sub) {
      sub = await this.prisma.subscription.create({
        data: {
          user_id: userId,
          plan_type: 'free',
          status: 'active',
        },
      });
    }
    return sub;
  }

  async createCheckoutSession(userId: string, priceId: string) {
    const user = await this.prisma.userProfile.findUnique({
      where: { user_id: userId },
    });
    const session = await this.stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.APP_URL}/subscription/success`,
      cancel_url: `${process.env.APP_URL}/subscription/cancel`,
      client_reference_id: userId,
      customer_email: user?.email,
    });
    return { url: session.url };
  }

  async cancelSubscription(userId: string) {
    const sub = await this.prisma.subscription.findFirst({
      where: { user_id: userId },
    });
    if (!sub || !sub.stripe_subscription_id) {
      throw new BadRequestException(
        'Nenhuma assinatura ativa encontrada para cancelar.',
      );
    }
    const canceled = await this.stripe.subscriptions.cancel(
      sub.stripe_subscription_id,
    );
    await this.prisma.subscription.update({
      where: { id: sub.id },
      data: { status: canceled.status },
    });
    return { message: 'Assinatura cancelada com sucesso' };
  }

  async handleStripeWebhook(body: any, signature: string) {
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(
        body,
        signature,
        endpointSecret,
      );
    } catch (err: unknown) {
      if (err instanceof Error) {
        throw new BadRequestException(`Webhook Error: ${err.message}`);
      }
      throw new BadRequestException(`Webhook Error: ${String(err)}`);
    }

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      if (session.client_reference_id) {
        const userId = session.client_reference_id;
        const existingSub = await this.prisma.subscription.findFirst({
          where: { user_id: userId },
        });
        if (existingSub) {
          await this.prisma.subscription.update({
            where: { id: existingSub.id },
            data: {
              stripe_customer_id: session.customer as string,
              stripe_subscription_id: session.subscription as string,
              status: 'active',
              plan_type: 'pro',
            },
          });
        }
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const subscription = event.data.object;
      const dbSub = await this.prisma.subscription.findFirst({
        where: { stripe_subscription_id: subscription.id },
      });
      if (dbSub) {
        await this.prisma.subscription.update({
          where: { id: dbSub.id },
          data: { status: 'canceled', plan_type: 'free' },
        });
      }
    }
  }
}
