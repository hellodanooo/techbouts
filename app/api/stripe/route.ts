// app/api/stripe/route.ts
import Stripe from "stripe";
import { NextResponse } from 'next/server';

const stripeUSD = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
const stripeMXN = new Stripe(process.env.STRIPE_SECRET_KEY_MEX!, {});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, eventId, amount, currency, idempotencyKey, pmt_id, locale } = body;
    
    const stripeInstance = locale === 'es' ? stripeMXN : stripeUSD;
    const amountInSmallestUnit = Math.round(amount * 100);

    // Create a payment method first
    const paymentMethod = await stripeInstance.paymentMethods.create({
      type: 'card',
      card: {
        token: token,
      },
    });

    // Create payment intent with the payment method
    const paymentIntent = await stripeInstance.paymentIntents.create({
      amount: amountInSmallestUnit,
      currency: currency.toLowerCase(),
      description: `${eventId} registration ${pmt_id}`,
      payment_method: paymentMethod.id,
      confirm: true,
      automatic_payment_methods: {
        enabled: true,
        allow_redirects: 'never'
      }
    }, {
      idempotencyKey: idempotencyKey,
    });

    return NextResponse.json({ 
      success: true, 
      paymentIntentId: paymentIntent.id 
    });

  } catch (error) {
    if (error instanceof Stripe.errors.StripeError) {
      console.error('Stripe payment intent error:', error.message);
      return NextResponse.json(
        { 
          success: false, 
          message: error.message,
          type: error.type,
          code: error.code 
        },
        { status: error.statusCode || 400 }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error during payment processing:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An unexpected error occurred during payment processing'
      },
      { status: 500 }
    );
  }
}