// app/events/[promoterId]/[eventId]/matches/page.tsx
import { Suspense } from 'react';
import PageClient from './PageClient';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import {fetchTechBoutsRoster} from '@/utils/apiFunctions/techboutsRoster';
import { fetchTechboutsBouts } from '@/utils/apiFunctions/techboutsBouts'; 
import { notFound } from 'next/navigation';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchPmtRoster } from '@/utils/apiFunctions/pmtRoster';

// Update the type to match Next.js 15 pattern with params as a Promise
interface PageProps {
  params: Promise<{
    promoterId: string;
    eventId: string;
  }>;
}

export default async function MatchesPage({ params }: PageProps) {
  // Now we need to await params since it's a Promise in the updated type
  const { promoterId, eventId } = await params;

  if (!promoterId || !eventId) {
    console.error('Missing promoterId or eventId');
    notFound();
  }
  
  console.log('matches page promoterId:', promoterId);
  console.log('matches page eventId:', eventId);
  
  // Try to fetch TechBouts event data first
  let eventData = await fetchTechBoutsEvent(promoterId, eventId);
  let matchesData = [];
  let rosterData = [];
  let sanctioning = eventData?.sanctioning || '';

  // If TechBouts data is not found, try PMT as fallback
  if (!eventData) {
    console.log('TechBouts event not found, trying PMT fallback');
    eventData = await fetchPmtEvent(eventId);
    rosterData = await fetchPmtRoster(eventId) || [];
    sanctioning = 'PMT';
    
    
    // If PMT data is also not found, return 404
    if (!eventData) {
      console.error('Event not found in either TechBouts or PMT');
      notFound();
    }
    
    // Add PMT-specific data fetching here if needed
    // matchesData = await fetchPmtBouts(eventId);
    // rosterData = await fetchPmtRoster(eventId);
  } else {
    // Fetch TechBouts specific data
    try {
      matchesData = await fetchTechboutsBouts(promoterId, eventId);
      rosterData = await fetchTechBoutsRoster(promoterId, eventId);
    } catch (err) {
      console.error('Error fetching TechBouts data:', err);
    }
  }

  console.log(`Using ${sanctioning} data for event:`, eventData);
  console.log("Bouts data:", matchesData);

  return (
    <Suspense fallback={<div>Loading fighters roster...</div>}>
      <PageClient 
        eventId={eventId} 
        promoterId={promoterId}
        eventData={eventData}
        initialRoster={rosterData}
        bouts={matchesData}
        roster={rosterData}
        sanctioning={sanctioning} // Pass the source to the client component
      />
    </Suspense>
  );
}