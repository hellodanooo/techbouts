'use client';

import React, { useState, useMemo } from 'react';
import { EventType, Promoter } from '../../../utils/types';
import { parseISO, format } from 'date-fns';
import Calendar from '../Calendar';
import MonthTable from '../../../components/MonthTable';
import Image from 'next/image';
 import AddEventForm from '@/components/AddEventForm';
 import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';

interface PromoterDashboardProps {
  promoter: Promoter;  // Changed from Promoter[] to Promoter
  promoterId: string;
  initialConfirmedEvents: EventType[];
  initialPendingEvents: EventType[];
  logoUrl: string;
  ikfEvents: EventType[];
}

export default function PromoterDashboard({ 
  
  initialConfirmedEvents, 
  initialPendingEvents, 
  logoUrl,
  promoter,
  ikfEvents
}: PromoterDashboardProps) {
  console.log('Promoter data in dashboard:', promoter);
  const [showEventModal, setShowEventModal] = useState(false);
  const { user, isAdmin, isPromoter, isNewUser } = useAuth();

  const canManageEvents = useMemo(() => {
    return (user?.email && promoter?.email && user.email === promoter.email) || isAdmin;
  }, [user?.email, promoter?.email, isAdmin]);


  // Process events with status
  const allEvents = useMemo(() => {
    const confirmed = initialConfirmedEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'confirmed' as const,
      eventType: 'pmt' as const
    }));

    const pending = initialPendingEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'pending' as const,
      eventType: 'pmt' as const
    }));

    const ikf = ikfEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'confirmed' as const,
      eventType: 'ikf' as const
    }));

    return [...confirmed, ...pending, ...ikf];
  }, [initialConfirmedEvents, initialPendingEvents, ikfEvents]);






  
  return (
    <div className="p-5">
      <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isPromoter={isPromoter}
        isNewUser={isNewUser}
      />
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10">
            <Image
              src={logoUrl || '/logos/techboutslogoFlat.png'}
              alt="Promoter Logo"
              fill
              className={`rounded-full object-cover ${isPromoter ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            />
          </div>
          <h1 className="text-2xl font-bold">
            {promoter.promotion || `${promoter.firstName} ${promoter.lastName}`}s Events
          </h1>
        </div>
      </div>

   {canManageEvents && (
 <div>
 <button
    onClick={() => setShowEventModal(true)}
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Create Event
  </button>

  </div>
)}

      {showEventModal && (
        <AddEventForm
          onClose={() => setShowEventModal(false)}
          promoter={promoter}
        />
      )}

      <div className="mt-8">
        <MonthTable 
          events={allEvents}
        />
        <Calendar />
      </div>

      {isPromoter && (
        <div className="mt-6">
          <h2 className="text-center text-xl font-semibold mb-4">Upcoming Events</h2>
          <div className="events-list">
            {allEvents
              .filter(event => event.status === 'confirmed')
              .map(event => (
                <div key={event.id}>
                  {event.event_name} - {format(event.parsedDate, 'MMMM d, yyyy')}
                  {event.eventType === 'ikf' && ' (IKF)'}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
}