// app/api/stripe/route.ts
import Stripe from "stripe";
import { NextResponse } from 'next/server';

const stripeUSD = new Stripe(process.env.STRIPE_SECRET_KEY!, {});
const stripeMXN = new Stripe(process.env.STRIPE_SECRET_KEY_MEX!, {});
const stripePBSC = new Stripe(process.env.STRIPE_SECRET_KEY_PBSC!, {});

export async function OPTIONS(request: Request) {
  // Get origin directly from request headers
  const origin = request.headers.get('origin') || '*';
  
  // Allow any origin to embed the form
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Access-Control-Allow-Credentials': 'true',
    },
  });
}

export async function POST(request: Request) {
  // Get origin directly from request headers
  const origin = request.headers.get('origin') || '*';

  try {
    const body = await request.json();
    const { token, eventId, amount, currency, idempotencyKey, pmt_id, locale, sanctioning } = body;
    
console.log('token', token);
console.log('eventId', eventId);
console.log('amount', amount);
console.log('currency', currency);
console.log('idempotencyKey', idempotencyKey);
console.log('pmt_id', pmt_id);
console.log('locale', locale);


let stripeInstance;
if (locale === 'es') {
  stripeInstance = stripeMXN;
} else if (sanctioning === 'PBSC') {
  stripeInstance = stripePBSC;
} else {
  stripeInstance = stripeUSD;
}

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

    // Return success response with CORS headers
    return NextResponse.json(
      { 
        success: true, 
        paymentIntentId: paymentIntent.id 
      }, 
      {
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );

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
        { 
          status: error.statusCode || 400,
          headers: {
            'Access-Control-Allow-Origin': origin,
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization',
            'Access-Control-Allow-Credentials': 'true',
          }
        }
      );
    }

    // Handle unexpected errors
    console.error('Unexpected error during payment processing:', error);
    return NextResponse.json(
      { 
        success: false, 
        message: 'An unexpected error occurred during payment processing'
      },
      { 
        status: 500,
        headers: {
          'Access-Control-Allow-Origin': origin,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, Authorization',
          'Access-Control-Allow-Credentials': 'true',
        }
      }
    );
  }
}