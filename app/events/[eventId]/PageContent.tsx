// app/events/[eventId]/PageContent.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { EventType } from '@/utils/types';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Register from './Register';
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
  const [registerOpen, setRegisterOpen] = useState(false);
  const [locale, setLocale] = useState('en');

  const stripeUSD = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY || '');
  const stripeMEX = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY_MEX || '');

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

  const stripeInstance = useMemo(() => {
    return locale === 'es' ? stripeMEX : stripeUSD;
  }, [locale, stripeMEX, stripeUSD]);

  const isAuthorizedPromoter = useMemo(() => {
    if (isAdmin) return true;
    if (!user?.email) return false;
    return user.email === eventData.promoterEmail || user.email === eventData.email;
  }, [user?.email, eventData.promoterEmail, eventData.email, isAdmin]);

  const handleImageError = () => setImageError(true);

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
                  {eventData.weighin_start_time && eventData.weighin_end_time && (
                    <p><strong>Weigh-in:</strong> {formatTime(eventData.weighin_start_time)} - {formatTime(eventData.weighin_end_time)}</p>
                  )}
                  {eventData.rules_meeting_time && (
                    <p><strong>Rules Meeting:</strong> {formatTime(eventData.rules_meeting_time)}</p>
                  )}
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
                <CardContent className="space-y-4">
                  {/* Buttons Section */}
                  <div className="flex flex-wrap gap-4">
                    {/* Registration Button - Always show if registration_fee exists */}
                    {eventData.registration_fee !== undefined && !eventData.disableRegistration && (
                      <button
                        onClick={() => setRegisterOpen(true)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                      >
                        Register (${eventData.registration_fee})
                      </button>
                    )}

                    {/* Tickets Button - Show if ticket_enabled */}
                    {eventData.ticket_enabled && (
                      eventData.ticket_system_option === 'thirdParty' && eventData.ticket_link ? (
                        <a
                          href={eventData.ticket_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Buy Tickets {eventData.ticket_price ? `($${eventData.ticket_price})` : ''}
                        </a>
                      ) : (
                        <button
                          onClick={() => setRegisterOpen(true)}
                          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
                        >
                          Buy Tickets {eventData.ticket_price ? `($${eventData.ticket_price})` : ''}
                        </button>
                      )
                    )}

                    {/* Coach Registration Button - Show if coachRegEnabled */}
                    {eventData.coachRegEnabled && (
                      <button
                        onClick={() => setRegisterOpen(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 transition-colors"
                      >
                        Coach Registration (${eventData.coachRegPrice})
                      </button>
                    )}

                    {/* Photo Package Button - Show if photoPackageEnabled */}
                    {eventData.photoPackageEnabled && (
                      <button
                        onClick={() => setRegisterOpen(true)}
                        className="px-4 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 transition-colors"
                      >
                        Photo Package (${eventData.photoPackagePrice})
                      </button>
                    )}
                  </div>

                  {/* Register Modal */}
                  {registerOpen && (
                    <Register
                      eventId={eventId}
                      locale={locale}
                      eventName={eventData.event_name}
                      closeModal={() => setRegisterOpen(false)}
                      registrationFee={eventData.registration_fee}
                    />
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