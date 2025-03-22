// app/events/[promoterId]/[eventId]/matches/page.tsx
import { Suspense } from 'react';
import PageClient from './PageClient';
import { Toaster } from 'sonner';
import { db } from '@/lib/firebase_techbouts/config';
// can the be both db as pmt_db and techbouts_db with the path for pmt db lib/firebase_pmt/config.ts


import { doc, getDoc } from 'firebase/firestore';
import { notFound } from 'next/navigation';

// Update the type to match Next.js 15 pattern with params as a Promise
interface PageProps {
  params: Promise<{
    promoterId: string;
    eventId: string;
  }>;
}


async function fetchTechboutsRoster(promoterId: string, eventId: string) {
  const techboutsPath =  `events/promotions/${promoterId}/${eventId}/roster_json/fighters`


  let rosterData = [];


    try {
      const rosterRef = doc(db, techboutsPath);
      const rosterDoc = await getDoc(rosterRef);
      
      if (rosterDoc.exists()) {
        const data = rosterDoc.data();
        if (data && data.fighters) {
          rosterData = data.fighters;
     
          console.log(`Found roster at path: ${techboutsPath}`);
        }
      }
    } catch (err) {
      console.log(`Failed to fetch from path: ${techboutsPath}`, err);
    }
    return rosterData;
  }


  
export default async function MatchesPage({ params }: PageProps) {
  // Now we need to await params since it's a Promise in the updated type
  const { promoterId, eventId } = await params;
  
  console.log('matches page promoterId:', promoterId);
  console.log('matches page eventId:', eventId);
  
  if (!promoterId || !eventId) {
    console.error('Missing promoterId or eventId');
    notFound();
  }
  
  // Fetch data server-side
  let rosterData = [];
  const matchesData = [];
  
  try {
    rosterData = await fetchTechboutsRoster(promoterId, eventId);
    
    console.log(`Fetched ${rosterData.length} fighters and ${matchesData.length} matches`);
  } catch (err) {
    console.error('Error fetching data:', err);
  }

  return (
    <div className="container mx-auto py-6">
      <Toaster position="top-right" />
      <h1 className="text-2xl font-bold mb-6">Create Matches</h1>
      <Suspense fallback={<div>Loading fighters roster...</div>}>
        <PageClient 
          eventId={eventId} 
          promoterId={promoterId} 
          initialRoster={rosterData}
        />
      </Suspense>
    </div>
  );
}