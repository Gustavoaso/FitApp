import { BillingService } from './billing.service';
export declare class BillingController {
    private readonly billingService;
    constructor(billingService: BillingService);
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
    createCheckout(userId: string, priceId: string): Promise<{
        url: string | null;
    }>;
    cancelSubscription(userId: string): Promise<{
        message: string;
    }>;
}
