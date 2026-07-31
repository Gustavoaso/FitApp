import { PrismaService } from '../prisma/prisma.service';
export declare class BillingService {
    private readonly prisma;
    private stripe;
    constructor(prisma: PrismaService);
    getSubscriptionStatus(userId: string): Promise<{
        id: string;
        user_id: string;
        createdAt: Date;
        updatedAt: Date;
        stripe_customer_id: string | null;
        stripe_subscription_id: string | null;
        status: string;
        plan_type: string;
        current_period_end: Date | null;
    }>;
    createCheckoutSession(userId: string, priceId: string): Promise<{
        url: string | null;
    }>;
    cancelSubscription(userId: string): Promise<{
        message: string;
    }>;
    handleStripeWebhook(body: any, signature: string): Promise<void>;
}
