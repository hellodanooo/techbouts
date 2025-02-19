// app/events/[eventId]/PageContent.tsx

'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { EventType } from '@/utils/types';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Register from './Register'
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';


interface TournamentDashboardProps {
  eventId: string;
  promoterId: string;
  promoterEmail: string;
  eventData: EventType;
}

export default function PageContentEvent({
  eventData,
  eventId,
}: TournamentDashboardProps) {
  const [imageError, setImageError] = useState(false);
  const { user, isAdmin, isPromoter, isNewUser } = useAuth();

const promoterEmail = eventData.promoterEmail;

const [registerOpen, setRegisterOpen] = useState(false);

const [locale, setLocale] = useState('en');

  const stripeUSD = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '');
  const stripeMEX = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_MEX || '');

  // Use useEffect to update locale based on country
  useEffect(() => {
    if (
      eventData.country === 'MEX' || 
      eventData.country.toLowerCase() === 'mexico' || 
      eventData.country.toLowerCase() === 'mx'
    ) {
      setLocale('es');
    } else {
      setLocale('en');
    }
  }, [eventData.country]);

  // Update stripeInstance to use locale from state
  const stripeInstance = useMemo(() => {
    if (locale === 'es') {
      console.log('MEXICO Stripe');
      return stripeMEX;
    } else {
      console.log('US Stripe');
      return stripeUSD;
    }
  }, [locale, stripeMEX, stripeUSD]);


  const isAuthorizedPromoter = useMemo(() => {
    if (isAdmin) return true; // Admin can always edit
    if (!user?.email || !promoterEmail) {
      console.log('Missing email information');
      return false;
    }
    return user.email === promoterEmail;
  }, [user?.email, promoterEmail, isAdmin]);


  const handleImageError = () => {
    setImageError(true);
  };

  const formatTime = (time: string) => {
    if (!time) return '';
    try {
      return format(new Date(`2000-01-01T${time}`), 'h:mm a');
    } catch {
      return time;
    }
  };






  return (
    <Elements stripe={stripeInstance}>
    <div className="p-5">
      <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isPromoter={isPromoter}
        isNewUser={isNewUser}
      />
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header Section */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">{eventData.name}</h1>
          
          {isAuthorizedPromoter && (
            <Link
              href={`/events/${eventId}/edit`}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              Edit Event
            </Link>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Event Flyer Section */}
          <div className="mb-8">
            {eventData.flyer && !imageError ? (
              <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
                <Image
                  src={eventData.flyer}
                  alt={`${eventData.name} flyer`}
                  fill
                  className="object-contain"
                  onError={handleImageError}
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  priority
                />
              </div>
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
                <p className="text-gray-500">No flyer available</p>
              </div>
            )}
          </div>

          {/* Event Details */}
          <div className="space-y-6">
            {/* Main Details Card */}
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Badge variant="secondary">{eventData.competition_type}</Badge>
                  {eventData.sanctioning && (
                    <Badge variant="outline" className="ml-2">{eventData.sanctioning}</Badge>
                  )}
                </div>
                
                <div className="space-y-2">
                  <p><strong>Date:</strong> {format(new Date(eventData.date), 'MMMM d, yyyy')}</p>
                  <p><strong>Location:</strong> {eventData.venue_name}</p>
                  <p>{eventData.address}</p>
                  <p>{`${eventData.city}, ${eventData.state} ${eventData.zip || ''}`}</p>
                </div>
              </CardContent>
            </Card>

            {/* Schedule Card */}
            <Card>
              <CardHeader>
                <CardTitle>Schedule</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
              {eventData.doors_open && (
  <p><strong>Doors Open:</strong> {formatTime(eventData.doors_open)}</p>
)}

{/* Only render if both `weighin_start_time` and `weighin_end_time` exist */}
{eventData.weighin_start_time && eventData.weighin_end_time && (
  <p><strong>Weigh-in:</strong> {formatTime(eventData.weighin_start_time)} - {formatTime(eventData.weighin_end_time)}</p>
)}

{/* Only render if `rules_meeting_time` exists */}
{eventData.rules_meeting_time && (
  <p><strong>Rules Meeting:</strong> {formatTime(eventData.rules_meeting_time)}</p>
)}
{/* Only render if `bouts_start_time` exists */}
{eventData.bouts_start_time && (
  <p><strong>Bouts Start:</strong> {formatTime(eventData.bouts_start_time)}</p>
)}




               
              </CardContent>
            </Card>

            {/* Registration & Tickets Card */}
            <Card>
              <CardHeader>
                <CardTitle>Registration & Tickets</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">


               
                  <div className="flex justify-between items-center">

<button onClick={() => setRegisterOpen(true)} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">
  Register
</button>

{registerOpen && (
    <Register 
    eventId={eventId}
    locale="en"
    eventName={eventData.event_name}
    closeModal={() => {}}
    registrationFee={eventData.registration_fee}
    />
  )}

                  </div>


           
                
                {eventData.tickets_enabled && (
                  <>
                    <div className="flex justify-between items-center">
                      <span>{eventData.ticket_price_description || 'General Admission'}</span>
                      <Badge variant="secondary">${eventData.ticket_price}</Badge>
                    </div>
                    {eventData.ticket_price2 && (
                      <div className="flex justify-between items-center">
                        <span>{eventData.ticket_price2_description || 'VIP Admission'}</span>
                        <Badge variant="secondary">${eventData.ticket_price2}</Badge>
                      </div>
                    )}
                  </>
                )}

                {eventData.coach_enabled && (
                  <div className="flex justify-between items-center">
                    <span>Coach Pass</span>
                    <Badge variant="secondary">${eventData.coach_price}</Badge>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Info Card */}
            {eventData.event_details && (
              <Card>
                <CardHeader>
                  <CardTitle>Additional Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="whitespace-pre-wrap">{eventData.event_details}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
    </Elements>

  );
}