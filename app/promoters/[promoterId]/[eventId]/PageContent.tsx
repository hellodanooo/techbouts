// app/promoters/[promoterId]/[eventId]/PageContent.tsx

'use client';

import React, { useState, useMemo } from 'react';
import { Event, Promoter } from '../../../../utils/types';
import Image from 'next/image';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';

interface TournamentDashboardProps {
  eventId: string;
  promoterId: string;
  promoterEmail: string;
  eventData: Event;
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

  return (
    <div className="p-5">
       <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isPromoter={isPromoter}
        isNewUser={isNewUser}
      />
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
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
      </div>
    </div>
  );
}