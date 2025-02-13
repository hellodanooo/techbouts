// app/promoters/[promoterId]/[eventId]/PageContent.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { EventType, Promoter } from '../../../../utils/types';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';


interface TournamentDashboardProps {
  eventId: string;
  promoterId: string;
  promoterEmail: string;
  eventData: EventType;
  promoter: Promoter;
}

export default function PageContentEvent({
  promoterId,
  eventData,
  promoter,
  eventId,
}: TournamentDashboardProps) {
  const [imageError, setImageError] = useState(false);
  const { user, isAdmin, isPromoter, isNewUser } = useAuth();

  // Check if the user's email matches the promoter's email
  const isAuthorizedPromoter = useMemo(() => {
    if (isAdmin) return true; // Admin can always edit
    return user?.email && promoter?.email && user.email === promoter.email;
  }, [user?.email, promoter?.email, isAdmin]);

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
              href={`/promoters/${promoterId}/${eventId}/edit`}
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
                {eventData.registration_enabled && (
                  <div className="flex justify-between items-center">
                    <span>Registration Fee</span>
                    <Badge variant="secondary">${eventData.registration_fee}</Badge>
                  </div>
                )}
                
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
  );
}