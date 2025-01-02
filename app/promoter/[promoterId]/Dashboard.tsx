'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '../../../utils/types';
import { parseISO, format } from 'date-fns';
import Calendar from '../Calendar';
import MonthTable from '../MonthTable';
import LogoUpload from '../../../components/LogoUpload';
import { FaLock } from "react-icons/fa6";
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { checkAuthorization } from '../../../utils/authUtils';
import Image from 'next/image'; // Add this import

interface PromoterEvent extends Event {
  parsedDate: Date;
  status?: 'confirmed' | 'pending' | 'approved';
}

interface PromoterDashboardProps {
  promoterId: string;
  initialConfirmedEvents: Event[];
  initialPendingEvents: Event[];
  logoUrl: string;
}

export default function PromoterDashboard({ 
  promoterId, 
  initialConfirmedEvents, 
  initialPendingEvents, 
  logoUrl
}: PromoterDashboardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isPromoter, setIsPromoter] = useState<boolean | null>(null);
  const [logoUploadOpen, setLogoUploadOpen] = useState(false);

  // Events State
  const [confirmedEvents] = useState<PromoterEvent[]>(
    initialConfirmedEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'confirmed'
    }))
  );
  
  const [pendingEvents] = useState<PromoterEvent[]>(
    initialPendingEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'pending'
    }))
  );

  // Authentication & Authorization
  useEffect(() => {
    const authorizeUser = async () => {
      if (user?.email) {
        const isAuthorized = await checkAuthorization(promoterId, user.email);
        setIsPromoter(isAuthorized);
      } else {
        setIsPromoter(false);
      }
    };

    if (user) {
      authorizeUser();
    } else {
      setIsPromoter(false);
    }
  }, [user, promoterId]);

  const handleLogin = () => {
    router.push(`/auth/login?promoterId=${promoterId}`);
  };

  const handleLogoUploadSuccess = () => {
    console.log('Logo uploaded successfully!');
    setLogoUploadOpen(false);
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
              onClick={isPromoter ? () => setLogoUploadOpen(true) : undefined}
            />
          </div>
          <h1 className="text-2xl font-bold">
            {promoterId.charAt(0).toUpperCase() + promoterId.slice(1)} Events
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

      <LogoUpload 
        docId={promoterId} 
        isOpen={logoUploadOpen} 
        onClose={() => setLogoUploadOpen(false)} 
        onSuccess={handleLogoUploadSuccess}
        source="promoters" 
      />
    </div>
  );
}