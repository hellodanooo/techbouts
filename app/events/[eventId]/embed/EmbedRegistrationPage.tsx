'use client';

import React from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Register from '@/app/events/[eventId]/Register';
import { EventType } from '@/utils/types';

type Props = {
  eventId: string;
  eventData: EventType | null;
};

export default function EmbedRegistrationPage({
  eventId,
  eventData
}: Props) {
  if (!eventData) {
    return <div>Event not found</div>;
  }

  // Initialize Stripe based on country
  const locale = eventData.country?.toLowerCase() === 'mexico' ? 'es' : 'en';
  const stripeKey = locale === 'es' 
    ? process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_MEX 
    : process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY;
  const stripePromise = loadStripe(stripeKey || '');

  return (
    <Elements stripe={stripePromise}>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="mb-4 text-xl font-semibold">
          {eventData.name} Registration
        </h2>
        <Register
          eventId={eventId}
          locale={locale}
          eventName={eventData.event_name ?? eventData.name ?? 'Event'}
          closeModal={() => null}
          registrationFee={eventData.registration_fee ?? 0}
        />
      </div>
    </Elements>
  );
}