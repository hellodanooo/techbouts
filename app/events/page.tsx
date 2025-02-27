// app/events/page.tsx
import { headers } from 'next/headers';
import PageClient from './PageClient';
import { EventType } from '../../utils/types';
import { fetchPmtEvents } from '../../utils/apiFunctions/fetchPmtEvents';

export const dynamic = 'force-dynamic';

async function fetchAllTechBoutsEvents() {
  try {
    console.log('Starting IKF Event Fetch')
    const headersList = await headers(); // headers() returns a Promise in newer Next.js versions
    const host = headersList.get('host');
    
    const response = await fetch(`http://${host}/api/events`, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    console.log('Fetch IKF Events Status:', response.status);

    let allTechBoutsEvents: EventType[] = [];

    if (response.ok) {
      try {
        const data = await response.json();
        allTechBoutsEvents = data.events || [];
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
  // Use Promise.all to parallelize the fetch operations
  const [pmtEvents, techBoutsEvents] = await Promise.all([
    fetchPmtEvents(),
    fetchAllTechBoutsEvents()
  ]);
  
  const { confirmedPMTEvents, pendingPMTEvents } = pmtEvents;
  const { allTechBoutsEvents } = techBoutsEvents;

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