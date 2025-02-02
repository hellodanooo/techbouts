//app/promoters/[promoterId]/[sanctioning]/[eventId]/PageContent.tsx

'use client';

import { Event } from '../../../../../utils/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';


interface PageContentProps {
  event: Event;
  sanctioning: string;
}

export default function PageContent({ event, sanctioning }: PageContentProps) {
  


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    try {
      return new Date(`1970-01-01T${timeString}`).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return timeString; // Return original if parsing fails
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold">
            {event.event_name}
            <span className="ml-2 text-sm font-normal text-gray-500">
              ({sanctioning.toUpperCase()})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Details Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Event Details</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Date:</span> {formatDate(event.date)}</p>
                <p><span className="font-medium">Type:</span> {event.competition_type}</p>
                <p><span className="font-medium">Venue:</span> {event.venue_name}</p>
                <p><span className="font-medium">Address:</span> {event.address}</p>
                <p><span className="font-medium">City:</span> {event.city}</p>
                <p><span className="font-medium">State:</span> {event.state}</p>
                {event.zip && <p><span className="font-medium">ZIP:</span> {event.zip}</p>}
              </div>
            </div>

            {/* Schedule Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Schedule</h3>
              <div className="space-y-3">
                <p><span className="font-medium">Doors Open:</span> {formatTime(event.doors_open)}</p>
                <p><span className="font-medium">Weigh-in Date:</span> {formatDate(event.weighin_date)}</p>
                <p><span className="font-medium">Weigh-in Time:</span> {formatTime(event.weighin_start_time)} - {formatTime(event.weighin_end_time)}</p>
                <p><span className="font-medium">Rules Meeting:</span> {formatTime(event.rules_meeting_time)}</p>
                <p><span className="font-medium">Bouts Start:</span> {formatTime(event.bouts_start_time)}</p>
              </div>
            </div>

            {/* Registration Section */}
            {event.registration_enabled && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Registration</h3>
                <div className="space-y-3">
                  <p><span className="font-medium">Registration Fee:</span> ${event.registration_fee}</p>
                  {event.registration_link && (
                    <p><span className="font-medium">Registration Link:</span> {event.registration_link}</p>
                  )}
                </div>
              </div>
            )}

            {/* Tickets Section */}
            {event.tickets_enabled && (
              <div>
                <h3 className="text-lg font-semibold mb-4">Tickets</h3>
                <div className="space-y-3">
                  {event.ticket_price > 0 && (
                    <p>
                      <span className="font-medium">Ticket Price:</span> ${event.ticket_price}
                      {event.ticket_price_description && ` - ${event.ticket_price_description}`}
                    </p>
                  )}
                  {event.ticket_price2 > 0 && (
                    <p>
                      <span className="font-medium">Additional Ticket Price:</span> ${event.ticket_price2}
                      {event.ticket_price2_description && ` - ${event.ticket_price2_description}`}
                    </p>
                  )}
                  {event.ticket_system_option === 'thirdParty' && event.ticket_link && (
                    <p><span className="font-medium">Ticket Link:</span> {event.ticket_link}</p>
                  )}
                </div>
              </div>
            )}

            {/* Additional Services Section */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Additional Services</h3>
              <div className="space-y-3">
                {event.coach_enabled && (
                  <p><span className="font-medium">Coach Pass:</span> ${event.coach_price}</p>
                )}
                {event.photos_enabled && (
                  <p><span className="font-medium">Photos:</span> ${event.photos_price}</p>
                )}
              </div>
            </div>

            {/* Event Details Text */}
            {event.event_details && (
              <div className="col-span-full">
                <h3 className="text-lg font-semibold mb-4">Additional Information</h3>
                <p className="whitespace-pre-wrap">{event.event_details}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>


      
    </div>
  );
}