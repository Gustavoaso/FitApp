"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_1 = __importDefault(require("stripe"));
let BillingService = class BillingService {
    prisma;
    stripe;
    constructor(prisma) {
        this.prisma = prisma;
        this.stripe = new stripe_1.default(process.env.STRIPE_SECRET_KEY || 'sk_test_dummy', {
            apiVersion: '2024-12-18.acacia',
        });
    }
    async getSubscriptionStatus(userId) {
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
    async createCheckoutSession(userId, priceId) {
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
    async cancelSubscription(userId) {
        const sub = await this.prisma.subscription.findFirst({
            where: { user_id: userId },
        });
        if (!sub || !sub.stripe_subscription_id) {
            throw new common_1.BadRequestException('Nenhuma assinatura ativa encontrada para cancelar.');
        }
        const canceled = await this.stripe.subscriptions.cancel(sub.stripe_subscription_id);
        await this.prisma.subscription.update({
            where: { id: sub.id },
            data: { status: canceled.status },
        });
        return { message: 'Assinatura cancelada com sucesso' };
    }
    async handleStripeWebhook(body, signature) {
        const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || 'whsec_dummy';
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(body, signature, endpointSecret);
        }
        catch (err) {
            if (err instanceof Error) {
                throw new common_1.BadRequestException(`Webhook Error: ${err.message}`);
            }
            throw new common_1.BadRequestException(`Webhook Error: ${String(err)}`);
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
                            stripe_customer_id: session.customer,
                            stripe_subscription_id: session.subscription,
                            status: 'active',
                            plan_type: 'pro',
                        },
                    });
                }
            }
        }
        else if (event.type === 'customer.subscription.deleted') {
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
};
exports.BillingService = BillingService;
exports.BillingService = BillingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], BillingService);
//# sourceMappingURL=billing.service.js.map