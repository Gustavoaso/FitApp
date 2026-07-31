import * as express from 'express';
import { BillingService } from './billing.service';
export declare class StripeWebhookController {
    private readonly billingService;
    constructor(billingService: BillingService);
    handleWebhook(req: express.Request, res: express.Response): Promise<express.Response<any, Record<string, any>>>;
}
