//utils/apiFunctions/fetchPmtEvents.ts
import { headers } from 'next/headers';
import { EventType } from '../types';

export async function fetchPmtEvents() {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    const timestamp = Date.now(); // Add timestamp to bust cache
    
    // Add cache-busting headers and timestamp to URL
    const [upcomingResponse, pendingResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/events?t=${timestamp}`, {
        cache: 'no-store',
        next: { revalidate: 0 }, // Force revalidation
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      }),
      fetch(`http://${host}/api/pmt/pending_events?t=${timestamp}`, {
        cache: 'no-store',
        next: { revalidate: 0 }, // Force revalidation
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
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