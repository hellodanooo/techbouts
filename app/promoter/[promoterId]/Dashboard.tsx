'use client';

import React, { useState, useEffect } from 'react';
import { Event, PromoterType } from '../../../utils/types';
import { parseISO, format } from 'date-fns';
import Calendar from '../Calendar';
import MonthTable from '../MonthTable';
import PromoterEditEvent from '../PromoterEditEvent';
import PasswordVerification from '../../../components/promoters/PasswordVerification';
import SubmitEvent from '../../../components/promoters/SubmitEvent';
import { FaCalendarPlus, FaLock } from "react-icons/fa6";
import buttons from '../../../styles/buttons.module.css';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getDatabase, ref, get } from 'firebase/database';

interface PromoterEvent extends Event {
  parsedDate: Date;
  status?: 'confirmed' | 'pending' | 'approved';
}

interface PromoterDashboardProps {
  promoterId: string;
  initialConfirmedEvents: Event[];
  initialPendingEvents: Event[];
}

export default function PromoterDashboard({ 
  promoterId, 
  initialConfirmedEvents, 
  initialPendingEvents 
}: PromoterDashboardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isPromoter, setIsPromoter] = useState<boolean | null>(null);

  // Events State
  const [confirmedEvents, setConfirmedEvents] = useState<PromoterEvent[]>(
    initialConfirmedEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'confirmed'
    }))
  );
  
  const [pendingEvents, setPendingEvents] = useState<PromoterEvent[]>(
    initialPendingEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'pending'
    }))
  );

  // Authentication & Authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      if (user?.email) {
        try {
          const db = getDatabase();
          const promoterRef = ref(db, `promoters/${promoterId}/authorizedEmails`);
          const snapshot = await get(promoterRef);

          if (snapshot.exists()) {
            const authorizedEmails = snapshot.val();
            const isAuthorizedUser = Array.isArray(authorizedEmails) && 
              authorizedEmails.some(email => email.toLowerCase() === user.email?.toLowerCase());
            setIsPromoter(isAuthorizedUser);
          } else {
            setIsPromoter(false);
          }
        } catch (error) {
          console.error('Error checking authorization:', error);
          setIsPromoter(false);
        }
      }
    };

    if (user) {
      checkAuthorization();
    } else {
      setIsPromoter(false);
    }
  }, [user, promoterId]);

  const handleLogin = () => {
    router.push(`/auth/login?promoterId=${promoterId}`);
  };

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-5">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">
          {promoterId.charAt(0).toUpperCase() + promoterId.slice(1)} Events
        </h1>
        {!isPromoter && (
          <button 
            onClick={handleLogin} 
            className="text-gray-500 hover:text-gray-700">
            <FaLock size={20} />
          </button>
        )}
      </div>

      <div className="mt-8">
        <MonthTable initialEvents={confirmedEvents} initialPendingEvents={pendingEvents} />
        <Calendar />
      </div>

      {isPromoter && (
        <div className="mt-6">
          <h2 className="text-center text-xl font-semibold mb-4">Upcoming Events</h2>
          <div className="events-list">
            {confirmedEvents.map(event => (
              <div key={event.id}>
                {event.event_name} - {format(event.parsedDate, 'MMMM d, yyyy')}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
