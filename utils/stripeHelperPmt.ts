// utils/stripeHelpers.ts
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
});

export const refundPayment = async (paymentIntentId: string): Promise<Stripe.Response<Stripe.Refund>> => {
  try {
    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    });
    return refund;
  } catch (error) {
    console.error('Refund error:', error);
    throw new Error('Refund processing failed');
  }
}
