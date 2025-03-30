// app/events/[promoterId]/[eventId]/matches/PageClient.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { RosterFighter, EventType, Bout } from '@/utils/types';
import MatchesDisplay from './MatchesDisplay';
import { useAuth } from '@/context/AuthContext';

import RosterTable from '@/app/events/[promoterId]/[eventId]/admin/RosterTable';

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
  initialRoster = [],
  eventData,
  bouts,
  roster

}: PageClientProps) {
  console.log("eventData Page Client", eventData);
  const { isAdmin } = useAuth();

  const router = useRouter();


  const [rosterData, ] = useState<RosterFighter[]>(initialRoster);



  if (!rosterData || rosterData.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No roster data available. Please add fighters to the roster first.</p>
          <Button
            className="mt-4"
            onClick={() => router.push(`/events/${promoterId}/${eventId}`)}
          >
            Go to Event Page
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">

      <RosterTable
        roster={roster}
        eventId={eventId}
        promoterId={promoterId}
        isAdmin={isAdmin}
        eventData={eventData}
      />

      <MatchesDisplay bouts={bouts} promoterId={promoterId} eventId={eventId} />
    </div>
  );
}