// app/events/[promoterId]/[eventId]/matches/PageClient.tsx
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { RosterFighter, EventType, Bout } from '@/utils/types';
import MatchesDisplay from './MatchesDisplay';
import { createMatch as createMatchUtil } from '@/utils/events/matches';
import { useAuth } from '@/context/AuthContext';
import CreateBout from './CreateBout';
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

  // Only keep necessary UI state variables, not roster state
  const [red, setRed] = useState<RosterFighter | null>(null);
  const [blue, setBlue] = useState<RosterFighter | null>(null);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [rosterData, ] = useState<RosterFighter[]>(initialRoster);
  const [rosterPath, ] = useState<string | null>(null);
  const [boutNum, setBoutNum] = useState<number>(1);
  const [ringNum, setRingNum] = useState<number>(1);
  const [dayNum, setDayNum] = useState<number>(1);
  const [bout_type, setBoutType] = useState<string>('MT');
  const [weightclass, setWeightclass] = useState<number>(0);
  const [boutConfirmed, setBoutConfirmed] = useState<boolean>(true);





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

      <CreateBout
        red={red}
        blue={blue}
        boutNum={boutNum}
        setBoutNum={setBoutNum}
        weightclass={weightclass}
        setWeightclass={setWeightclass}
        ringNum={ringNum}
        setRingNum={setRingNum}
        dayNum={dayNum}
        setDayNum={setDayNum}
        bout_type={bout_type}
        setBoutType={setBoutType}
        boutConfirmed={boutConfirmed}
        setBoutConfirmed={setBoutConfirmed}
        isCreatingMatch={isCreatingMatch}
        setRed={setRed}
        setBlue={setBlue}
        createMatch={() =>
          createMatchUtil({
            red,
            blue,
            weightclass,
            boutNum,
            ringNum,
            eventId,
            promoterId,
            setIsCreatingMatch,
            setRed,
            setBlue,
            date: eventData.date,
            sanctioning: eventData.sanctioning,
            eventName: eventData.event_name,
            promotionName: eventData.promoterId,
            bout_type: bout_type,
            dayNum: dayNum,
          })
        }
        disableCreate={!red || !blue || isCreatingMatch || !rosterPath}
      />


      <RosterTable
        roster={roster}
        eventId={eventId}
        promoterId={promoterId}
        isAdmin={isAdmin}
      />

      <MatchesDisplay bouts={bouts} promoterId={promoterId} eventId={eventId} />
    </div>
  );
}