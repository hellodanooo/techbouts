// app/events/[promoterId]/[eventId]/matches/page.tsx
import { Suspense } from 'react';
import PageClient from './PageClient';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import {fetchTechBoutsRoster} from '@/utils/apiFunctions/fetchTechBoutsRoster';
import { fetchTechboutsBouts } from '@/utils/apiFunctions/fetchTechboutsBouts'; 
import { notFound } from 'next/navigation';



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

  const eventData =  await fetchTechBoutsEvent(promoterId, eventId);

  if (!eventData) {
    notFound();
  }
  
  console.log('matches page promoterId:', promoterId);
  console.log('matches page eventId:', eventId);
  
  if (!promoterId || !eventId) {
    console.error('Missing promoterId or eventId');
    notFound();
  }
  
  // Fetch data server-side
  let rosterData = [];
  
  const matchesData = await fetchTechboutsBouts(promoterId, eventId);
  
  try {
    rosterData = await fetchTechBoutsRoster(promoterId, eventId);
    
    //console.log(`Fetched ${rosterData.length} fighters and ${matchesData.length} matches`);
  } catch (err) {
    console.error('Error fetching data:', err);
  }

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
        />

      </Suspense>
      
  );
}