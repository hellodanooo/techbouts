'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { Event, Promoter } from '../../../utils/types';
import { parseISO, format } from 'date-fns';
import Calendar from '../Calendar';
import MonthTable from '../../../components/MonthTable';
import { FaLock } from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { checkDashboardAuthorization } from '../../../utils/authUtils';
import { useAuth } from '../../../context/AuthContext'; 
 import AddEventForm from '@/components/AddEventForm'; // Add this import

interface PromoterDashboardProps {
  promoter: Promoter;  // Changed from Promoter[] to Promoter
  promoterId: string;
  initialConfirmedEvents: Event[];
  initialPendingEvents: Event[];
  logoUrl: string;
  ikfEvents: Event[];
}

export default function PromoterDashboard({ 
  promoterId, 
  initialConfirmedEvents, 
  initialPendingEvents, 
  logoUrl,
  promoter,
  ikfEvents
}: PromoterDashboardProps) {
  console.log('Promoter data in dashboard:', promoter); // Add this log

 const { user, loading } = useAuth();

 
  const router = useRouter();
  const [isPromoter, setIsPromoter] = useState<boolean | null>(false);

const [showEventModal, setShowEventModal] = useState(false); // Controls AddEventForm visibility



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




  // Authentication & Authorization

  useEffect(() => {
    const authorizeUser = async () => {
      console.log('Starting dashboard authorization process:', {
        userEmail: user?.email,
        promoterEmail: promoter.email,
        promoterId: promoterId
      });
  
      if (user?.email) {
        const isAuthorized = checkDashboardAuthorization(promoter.email, user.email);
        console.log('Dashboard authorization completed:', {
          isAuthorized,
          userEmail: user.email,
          promoterEmail: promoter.email
        });
        setIsPromoter(isAuthorized);
      } else {
        console.log('No user email available, setting isPromoter to false');
        setIsPromoter(false);
      }
    };
  
    authorizeUser();
  }, [user, promoterId, promoter]);


  const handleLogin = () => {
    router.push(`/auth/login?promoterId=${promoterId}`);
  };



   if (loading) {
     return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
   }

   return (
    <div className="p-5">
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
        {!isPromoter && (
          <button 
            onClick={handleLogin} 
            className="text-gray-500 hover:text-gray-700">
            <FaLock size={20} />
          </button>
        )}
      </div>


      {isPromoter && (
  <button
    onClick={() => setShowEventModal(true)}
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Create Event
  </button>
)}
  {/* Add Event Modal */}
  {showEventModal && (
        console.log('promoter page:', promoter),
        <AddEventForm
          onClose={() => setShowEventModal(false)} // Close the AddEventForm modal
          promoter={promoter} // Pass promoters to AddEventForm
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