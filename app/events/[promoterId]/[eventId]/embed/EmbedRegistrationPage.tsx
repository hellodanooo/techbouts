// app/events/[promoterId]/[eventId]/embed/EmbedRegistrationPage.tsx
'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import Register from '@/components/events/Register';
import { EventType, Bout, RosterFighter } from '@/utils/types';
import MatchesDisplay from '../matches/MatchesDisplay';
import { CardContent } from '@/components/ui/card';
import RosterTable from '../admin/RosterTable';

type Props = {
  eventId: string;
  promoterId: string;
  eventData: EventType | null;
  bouts?: Bout[];
  roster: RosterFighter[];

};

export default function EmbedRegistrationPage({
  eventId,
  promoterId,
  eventData,
  bouts,
  roster,
}: Props) {
  
  const [isLoaded, setIsLoaded] = useState(false);
  const [locale, setLocale] = useState('en');

  const router = useRouter();
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

  useEffect(() => {
    // Mark component as loaded
    setIsLoaded(true);

    setIsRegisterOpen(!eventData?.disableRegistration);


    // Set locale based on event country
    if (
      eventData?.country === 'MEX' ||
      eventData?.country?.toLowerCase() === 'mexico' ||
      eventData?.country?.toLowerCase() === 'mx'
    ) {
      setLocale('es');
    } else {
      setLocale('en');
    }

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

  // Initialize Stripe instances
  const stripeUSD = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '');
  const stripeMEX = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_MEX || '');
  const stripePBSC = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_PBSC || '');

  // Use the same logic as in PageContent to select the appropriate Stripe instance
  const stripeInstance = useMemo(() => {
    if (locale === 'es') {
      return stripeMEX;
    } else if (eventData?.sanctioning === 'PBSC') {
      return stripePBSC;
    } else {
      return stripeUSD;
    }
  }, [locale, stripeMEX, stripeUSD, stripePBSC, eventData?.sanctioning]);



 
  // Handle fighter click
  const handleFighterClick = (fighter: RosterFighter) => {
    if (fighter && fighter.fighter_id) {
      router.push(`/fighters/${fighter.fighter_id}`);
    }
  };


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

  return (
    <Elements stripe={stripeInstance}>
      <div className="p-4 max-w-2xl mx-auto">
        <h2 className="mb-4 text-xl font-semibold">
          {eventData.name} Registration
        </h2>
        
        {isLoaded && (




<div>


{isRegisterOpen && (
    <CardContent>
          <Register
            eventId={eventId}
            promoterId={eventData.promoterId}
            locale={locale}
            eventName={eventData.event_name ?? eventData.name ?? 'Event'}
            closeModal={() => null}
            registrationFee={eventData.registration_fee ?? 0}
            sanctioningLogoUrl={eventData.sanctioningLogoUrl}
            promotionLogoUrl={eventData.promotionLogoUrl}
            sanctioning={eventData.sanctioning}
            payLaterEnabled={eventData.payLaterEnabled ?? false}
            redirectUrl={eventData.redirect_url ?? ''}
          />
          </CardContent>
)}


   {eventData.display_roster && (

<RosterTable
          eventId={eventId}
          promoterId={promoterId}
          eventData={eventData}
          isAdmin={false}
          handleFighterClick={handleFighterClick}
          roster={roster || []} // Assuming roster is part of eventData
          bouts={bouts || []} // Pass bouts as expected
        />

)}


    
          <MatchesDisplay 
          bouts={bouts || []} 
          promoterId={promoterId} 
          eventId={eventId} 
          isAdmin={false} 
          eventData={eventData}
          handleFighterClick={handleFighterClick}
        />




</div>

      
      
      )}
      </div>
    </Elements>
  );
}