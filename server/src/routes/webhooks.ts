import { Router, Request, Response } from 'express';
import express from 'express';
import { prisma } from '../lib/prisma';
import stripe from '../services/stripe';
import Stripe from 'stripe';

const router = Router();

router.post('/webhook', express.raw({ type: 'application/json' }), async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string;

  let event: Stripe.Event;

  if (process.env.STRIPE_WEBHOOK_SECRET) {
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message);
      res.status(400).send('Webhook Error');
      return;
    }
  } else {
    event = JSON.parse(req.body.toString());
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const subscriptionId = session.subscription as string;
        const customerId = session.customer as string;

        const sub = await stripe.subscriptions.retrieve(subscriptionId);
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
        const sub = event.data.object as Stripe.Subscription;
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
        const sub = event.data.object as Stripe.Subscription;
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
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
});

export { router as webhookRouter };
