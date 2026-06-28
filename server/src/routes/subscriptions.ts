import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import stripe from '../services/stripe';

const router = Router();
const prisma = new PrismaClient();

const PRICES: Record<string, string> = {
  premium: process.env.STRIPE_PRICE_PREMIUM || '',
  premium_grocery: process.env.STRIPE_PRICE_PREMIUM_GROCERY || '',
};

router.get('/status', authenticateToken, async (req: AuthRequest, res: Response) => {
  const sub = await prisma.subscription.findUnique({
    where: { userId: req.userId },
  });

  const isExpired = sub?.expiresAt && sub.expiresAt < new Date();
  const effectivePlan = isExpired && !sub?.stripeSubId ? 'FREE' : (sub?.plan || 'FREE');

  res.json({
    plan: effectivePlan,
    groceryAddon: isExpired && !sub?.stripeSubId ? false : (sub?.groceryAddon || false),
    expiresAt: sub?.expiresAt,
    hasStripe: !!sub?.stripeSubId,
    prices: {
      premium: '$3.99/mois',
      premiumGrocery: '$5.99/mois',
    },
  });
});

router.post('/create-checkout-session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { priceKey } = req.body;
    const priceId = PRICES[priceKey];

    if (!priceId) {
      res.status(400).json({ error: 'Plan invalide' });
      return;
    }

    const user = await prisma.user.findUnique({
      where: { id: req.userId },
      include: { subscription: true },
    });

    if (!user) {
      res.status(404).json({ error: 'Utilisateur non trouvé' });
      return;
    }

    let customerId = user.subscription?.stripeCustomerId;

    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name || undefined,
        metadata: { userId: user.id },
      });
      customerId = customer.id;

      await prisma.subscription.upsert({
        where: { userId: user.id },
        create: { userId: user.id, stripeCustomerId: customerId },
        update: { stripeCustomerId: customerId },
      });
    }

    const plan = priceKey === 'premium_grocery' ? 'PREMIUM' : 'PREMIUM';
    const groceryAddon = priceKey === 'premium_grocery' ? 'true' : 'false';

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${process.env.CLIENT_URL}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.CLIENT_URL}/subscription-cancel`,
      subscription_data: {
        metadata: { userId: user.id, plan, groceryAddon },
      },
      allow_promotion_codes: true,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Checkout session error:', error.message);
    res.status(500).json({ error: 'Erreur lors de la création de la session de paiement' });
  }
});

router.post('/create-portal-session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.userId },
    });

    if (!sub?.stripeCustomerId) {
      res.status(400).json({ error: 'Aucun abonnement Stripe trouvé' });
      return;
    }

    const session = await stripe.billingPortal.sessions.create({
      customer: sub.stripeCustomerId,
      return_url: `${process.env.CLIENT_URL}`,
    });

    res.json({ url: session.url });
  } catch (error: any) {
    console.error('Portal session error:', error.message);
    res.status(500).json({ error: 'Erreur' });
  }
});

router.post('/verify-session', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) { res.status(400).json({ error: 'sessionId requis' }); return; }

    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription'],
    });

    if (session.payment_status !== 'paid' && session.status !== 'complete') {
      res.status(400).json({ error: 'Paiement non complété' });
      return;
    }

    const sub = session.subscription as any;
    const userId = req.userId!;
    const plan = sub?.metadata?.plan || 'PREMIUM';
    const groceryAddon = sub?.metadata?.groceryAddon === 'true';
    const customerId = session.customer as string;
    const stripeSubId = sub?.id;
    const expiresAt = sub?.current_period_end ? new Date(sub.current_period_end * 1000) : null;

    await prisma.subscription.upsert({
      where: { userId },
      create: {
        userId,
        plan,
        groceryAddon,
        stripeCustomerId: customerId,
        stripeSubId,
        expiresAt,
      },
      update: {
        plan,
        groceryAddon,
        stripeCustomerId: customerId,
        stripeSubId,
        expiresAt,
      },
    });

    console.log(`Subscription verified for user ${userId}: ${plan}, grocery: ${groceryAddon}`);
    res.json({ ok: true, plan, groceryAddon });
  } catch (error: any) {
    console.error('verify-session error:', error.message);
    res.status(500).json({ error: 'Erreur de vérification' });
  }
});

router.post('/cancel', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const sub = await prisma.subscription.findUnique({
      where: { userId: req.userId },
    });

    if (sub?.stripeSubId) {
      await stripe.subscriptions.cancel(sub.stripeSubId);
    } else {
      await prisma.subscription.update({
        where: { userId: req.userId! },
        data: { plan: 'FREE', groceryAddon: false },
      });
    }

    res.json({ ok: true, message: 'Abonnement annulé' });
  } catch (error: any) {
    console.error('Cancel error:', error.message);
    res.status(500).json({ error: 'Erreur lors de l\'annulation' });
  }
});

export { router as subscriptionRouter };
