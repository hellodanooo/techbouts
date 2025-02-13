//utils/apiFunctions/fetchPmtEvents.ts
import { headers } from 'next/headers';
import { EventType } from '../types';

export async function fetchPmtEvents() {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    // Fetch both confirmed and pending events in parallel
    const [upcomingResponse, pendingResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/events`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      fetch(`http://${host}/api/pmt/pending_events`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    ]);

    let confirmedPMTEvents: EventType[] = [];
    let pendingPMTEvents: EventType[] = [];

    if (upcomingResponse.ok) {
      const confirmedData = await upcomingResponse.json();
      confirmedPMTEvents = confirmedData.events || [];
    }

    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      pendingPMTEvents = pendingData.events || [];
    }

    return {
      confirmedPMTEvents,
      pendingPMTEvents,
    };
  } catch (error) {
    console.error('Error fetching PMT events:', error);
    return {
      confirmedPMTEvents: [],
      pendingPMTEvents: [],
    };
  }
}