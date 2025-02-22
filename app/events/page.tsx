//app/events/page.tsx

import { headers } from 'next/headers';
import PageClient from './PageClient';
import { EventType } from '../../utils/types';
import { fetchPmtEvents } from '../../utils/apiFunctions/fetchPmtEvents';

export const dynamic = 'force-dynamic';

async function fetchAllTechBoutsEvents() {
  try {
    console.log('Starting IKF Event Fetch')
    const headersList = await headers();
    const host = headersList.get('host');
    
    const [confirmedResponse] = await Promise.all([
      fetch(`http://${host}/api/events`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    console.log('Fetch IKF Events Status:', confirmedResponse.status);

    let allTechBoutsEvents: EventType[] = [];

    if (confirmedResponse.ok) {
      try {
        const confirmedData = await confirmedResponse.json();
        allTechBoutsEvents = confirmedData.events || [];
      } catch (error) {
        console.error('Error parsing confirmed events:', error);
      }
    }

    return { allTechBoutsEvents };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { allTechBoutsEvents: [] };
  }
}

export default async function EventsPage() {
  const { confirmedPMTEvents, pendingPMTEvents } = await fetchPmtEvents();
  const { allTechBoutsEvents } = await fetchAllTechBoutsEvents();


  // Log the results for debugging
  console.log('Fetched confirmed events:', confirmedPMTEvents.length);
  console.log('Fetched pending events:', pendingPMTEvents.length);
  console.log('Fetched IKF events:', allTechBoutsEvents.length);


  return (
    <>
      <PageClient 
        initialConfirmedEvents={confirmedPMTEvents}
        initialPendingEvents={pendingPMTEvents}
        allTechBoutsEvents={allTechBoutsEvents}
     
      />
    </>
  );
}