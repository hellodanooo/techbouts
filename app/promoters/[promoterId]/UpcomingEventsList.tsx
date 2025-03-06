// components/UpcomingEvents.tsx
import React from 'react';
import { EventType } from '@/utils/types';
import { format } from 'date-fns';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface UpcomingEventsProps {
  events: Array<EventType & {
    parsedDate: Date;
    status: 'confirmed' | 'pending';
    eventType?: 'pmt';
    promoterId?: string; // Added promoterId for navigation
  }>;
}

const UpcomingEvents: React.FC<UpcomingEventsProps> = ({ events }) => {
  const router = useRouter();
  
  const confirmedEvents = events
    .filter(event => event.status === 'confirmed')
    .sort((a, b) => a.parsedDate.getTime() - b.parsedDate.getTime()); // Sort by date ascending
  
  // Handler to navigate to event details page
  const handleEventClick = (promoterId: string, eventId: string) => {
    router.push(`/events/${promoterId}/${eventId}`);
  };

  return (
    <Card className="w-full shadow-md">
      <CardHeader className="bg-gray-50 border-b">
        <CardTitle className="text-center text-xl font-semibold">Upcoming Events</CardTitle>
      </CardHeader>
      
      <CardContent className="pt-6">
        {confirmedEvents.length > 0 ? (
          <div className="space-y-4">
            {confirmedEvents.map(event => (
              <div 
                key={event.id} 
                className="flex items-center p-3 border rounded-lg hover:bg-gray-50 transition-colors duration-200 cursor-pointer"
                onClick={() => handleEventClick(event.promoterId || 'default', event.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    handleEventClick(event.promoterId || 'default', event.id);
                  }
                }}
              >
                <div className="flex-shrink-0 mr-3 bg-gray-100 p-2 rounded-full">
                  <Calendar className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-grow">
                  <h3 className="font-medium">{event.event_name}</h3>
                  <p className="text-sm text-gray-500">
                    {format(event.parsedDate, 'MMMM d, yyyy')}
                  </p>
                </div>
                {event.eventType && (
                  <Badge variant="outline" className="ml-2 capitalize">
                    {event.eventType}
                  </Badge>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <Calendar className="h-12 w-12 mx-auto mb-3 text-gray-400" />
            <p>No upcoming events scheduled</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;