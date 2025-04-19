// app/events/[promoterId]/[eventId]/matches/PageClient.tsx
'use client';

import React, { useState } from 'react';


import { RosterFighter, EventType, Bout } from '@/utils/types';
import MatchesDisplay from './MatchesDisplay';
import { useAuth } from '@/context/AuthContext';
import RosterTable from '@/app/events/[promoterId]/[eventId]/admin/RosterTable';
import Header from '@/components/headers/Header';
import { createMatchesFromWeighins } from '@/utils/events/matches';
import { fetchTechboutsBouts, deleteTechboutsMatchesJson } from '@/utils/apiFunctions/techboutsBouts';
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react";

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


  const handleDeleteMatches = async () => {
    const success = await deleteTechboutsMatchesJson(promoterId, eventId);
    if (success) {
      // Clear the bouts in the UI
      setBouts([]);
    }
  };


  return (
    <div className="">
      <Header />

      
      {isAdmin && (
             <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', gap:'5px' }}>

        <Button onClick={() => createMatchesFromWeighins({ eventId, promoterId, eventName: eventData.name || '', promotionName: eventData.promotionName, date: eventData.date, sanctioning: eventData.sanctioning, setIsCreatingMatches: () => {}, saveMatches: true })}>
          Auto Match
        </Button>

       
          <Button 
            variant="destructive" 
            onClick={handleDeleteMatches}
            className="flex items-center gap-2"
          >
            <Trash2 size={16} />
            Delete Matches
          </Button>

          </div>

        )}


      <MatchesDisplay bouts={bouts} promoterId={promoterId} eventId={eventId} isAdmin={isAdmin} eventData={eventData} />

      <RosterTable promoterId={promoterId} eventId={eventId} roster={roster} eventData={eventData} isAdmin={isAdmin} bouts={bouts} onBoutsRefresh={refreshBouts} />

     
    </div>
  );
}