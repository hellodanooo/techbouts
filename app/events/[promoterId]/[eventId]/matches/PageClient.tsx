// app/events/[promoterId]/[eventId]/matches/PageClient.tsx
'use client';

import React, { useState } from 'react';


import { RosterFighter, EventType, Bout } from '@/utils/types';
import MatchesDisplay from './MatchesDisplay';
import { useAuth } from '@/context/AuthContext';

import RosterTable from '@/app/events/[promoterId]/[eventId]/admin/RosterTable';
import Header from '@/components/headers/Header';


import { fetchTechboutsBouts } from '@/utils/apiFunctions/fetchTechboutsBouts';


interface PageClientProps {
  eventId: string;
  promoterId: string;
  initialRoster: RosterFighter[];
  bouts: Bout[];
  sanctioning?: string;
  eventData: EventType;
  roster: RosterFighter[];
}


export default function PageClient({
  eventId,
  promoterId,
  eventData,
  bouts: initialBouts,
  roster,

}: PageClientProps) {
  console.log("eventData Page Client", eventData);
  const { isAdmin } = useAuth();
  const [bouts, setBouts] = useState<Bout[]>(initialBouts);


  const refreshBouts = async () => {
    try {
      const updated = await fetchTechboutsBouts(promoterId, eventId);
      setBouts(updated);
    } catch (err) {
      console.error("Failed to refresh bouts", err);
    }
  };


  return (
    <div className="">
      <Header />
      <MatchesDisplay bouts={bouts} promoterId={promoterId} eventId={eventId} isAdmin={isAdmin} eventData={eventData} />

      <RosterTable promoterId={promoterId} eventId={eventId} roster={roster} eventData={eventData} isAdmin={isAdmin} bouts={bouts} onBoutsRefresh={refreshBouts} />

    </div>
  );
}