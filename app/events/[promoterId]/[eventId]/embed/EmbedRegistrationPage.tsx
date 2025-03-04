// app/events/[eventId]/embed/EmbedRegistrationPage.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Register from '@/app/events/[promoterId]/[eventId]/Register';
import { EventType } from '@/utils/types';

type Props = {
  eventId: string;
  eventData: EventType | null;
};

export default function EmbedRegistrationPage({
  eventId,
  eventData
}: Props) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Mark component as loaded
    setIsLoaded(true);

    // Function to adjust iframe height based on content
    const adjustHeight = () => {
      if (window.self !== window.top) { // Check if we're in an iframe
        const newHeight = document.body.scrollHeight;
        
        
        // Notify parent window about height change
        window.parent.postMessage({
          type: 'REGISTRATION_IFRAME_HEIGHT',
          height: newHeight,
          eventId: eventId
        }, '*');
      }
    };

    // Adjust height initially and whenever content changes
    adjustHeight();
    
    // Set up a periodic check for height changes
    const heightInterval = setInterval(adjustHeight, 500);
    
    // Notify parent that iframe is ready
    if (window.self !== window.top) {
      window.parent.postMessage({
        type: 'REGISTRATION_IFRAME_READY',
        eventId: eventId,
        eventName: eventData?.name || 'Event'
      }, '*');
    }

    return () => {
      clearInterval(heightInterval);
    };
  }, [eventId, eventData]);

  if (!eventData) {
    return (
      <div className="p-4 text-center">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded w-3/4 mx-auto mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto"></div>
        </div>
        <p className="mt-4">Loading event information...</p>
      </div>
    );
  }

  // Initialize Stripe based on country
  const locale = eventData.country?.toLowerCase() === 'mexico' ||
                 eventData.country?.toLowerCase() === 'mx' || 
                 eventData.country === 'MEX' ? 'es' : 'en';
  
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
        

        {isLoaded && (
          <Register
            eventId={eventId}
            promoterId={eventData.promoterId}
            locale={locale}
            eventName={eventData.event_name ?? eventData.name ?? 'Event'}
            closeModal={() => null}
            registrationFee={eventData.registration_fee ?? 0}
            sanctioningLogoUrl={eventData.sanctioningLogoUrl}
            promotionLogoUrl={eventData.promotionLogoUrl}

     
          />
        )}
      </div>
    </Elements>
  );
}