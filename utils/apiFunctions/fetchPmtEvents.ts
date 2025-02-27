import { headers } from 'next/headers';
import { EventType } from '../types';

export async function fetchPmtEvents() {
  try {
    const headersList = await headers(); // In newer Next.js versions, headers() returns a Promise
    const host = headersList.get('host');
    const timestamp = Date.now(); // Add timestamp to bust cache
    
    // Use Promise.all to fetch both endpoints in parallel
    const [upcomingResponseRaw, pendingResponseRaw] = await Promise.all([
      fetch(`http://${host}/api/pmt/events?t=${timestamp}`, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      }),
      fetch(`http://${host}/api/pmt/pending_events?t=${timestamp}`, {
        cache: 'no-store',
        next: { revalidate: 0 },
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        },
      })
    ]);
    
    let confirmedPMTEvents: EventType[] = [];
    let pendingPMTEvents: EventType[] = [];

    // Clone responses before reading their bodies
    const upcomingResponse = upcomingResponseRaw.clone();
    const pendingResponse = pendingResponseRaw.clone();
    
    // Process responses
    if (upcomingResponse.ok) {
      try {
        const confirmedData = await upcomingResponse.json();
        confirmedPMTEvents = confirmedData.events || [];
      } catch (error) {
        console.error('Error parsing confirmed events:', error);
      }
    } else {
      console.error('Upcoming events response not OK:', upcomingResponse.status);
    }

    if (pendingResponse.ok) {
      try {
        const pendingData = await pendingResponse.json();
        pendingPMTEvents = pendingData.events || [];
      } catch (error) {
        console.error('Error parsing pending events:', error);
      }
    } else {
      console.error('Pending events response not OK:', pendingResponse.status);
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