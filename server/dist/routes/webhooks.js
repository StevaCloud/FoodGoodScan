"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.webhookRouter = void 0;
const express_1 = require("express");
const express_2 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const stripe_1 = __importDefault(require("../services/stripe"));
const router = (0, express_1.Router)();
exports.webhookRouter = router;
const prisma = new client_1.PrismaClient();
router.post('/webhook', express_2.default.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;
    if (process.env.STRIPE_WEBHOOK_SECRET) {
        try {
            event = stripe_1.default.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
        }
        catch (err) {
            console.error('Webhook signature verification failed:', err.message);
            res.status(400).send('Webhook Error');
            return;
        }
    }
    else {
        event = JSON.parse(req.body.toString());
    }
    try {
        switch (event.type) {
            case 'checkout.session.completed': {
                const session = event.data.object;
                const subscriptionId = session.subscription;
                const customerId = session.customer;
                const sub = await stripe_1.default.subscriptions.retrieve(subscriptionId);
                const userId = sub.metadata.userId;
                const plan = sub.metadata.plan || 'PREMIUM';
                const groceryAddon = sub.metadata.groceryAddon === 'true';
                if (userId) {
                    await prisma.subscription.update({
                        where: { userId },
                        data: {
                            stripeCustomerId: customerId,
                            stripeSubId: subscriptionId,
                            plan,
                            groceryAddon,
                            expiresAt: new Date(sub.current_period_end * 1000),
                        },
                    });
                    console.log(`Subscription activated for user ${userId}: ${plan}, grocery: ${groceryAddon}`);
                }
                break;
            }
            case 'customer.subscription.updated': {
                const sub = event.data.object;
                const dbSub = await prisma.subscription.findFirst({
                    where: { stripeSubId: sub.id },
                });
                if (dbSub) {
                    await prisma.subscription.update({
                        where: { id: dbSub.id },
                        data: {
                            expiresAt: new Date(sub.current_period_end * 1000),
                            plan: sub.status === 'active' ? dbSub.plan : 'FREE',
                        },
                    });
                    console.log(`Subscription updated for ${dbSub.userId}: status=${sub.status}`);
                }
                break;
            }
            case 'customer.subscription.deleted': {
                const sub = event.data.object;
                const dbSub = await prisma.subscription.findFirst({
                    where: { stripeSubId: sub.id },
                });
                if (dbSub) {
                    await prisma.subscription.update({
                        where: { id: dbSub.id },
                        data: {
                            plan: 'FREE',
                            groceryAddon: false,
                            stripeSubId: null,
                        },
                    });
                    console.log(`Subscription canceled for ${dbSub.userId}`);
                }
                break;
            }
        }
    }
    catch (err) {
        console.error('Webhook handler error:', err);
    }
    res.json({ received: true });
});
