// app/promoter/page.tsx
import { headers } from 'next/headers';
import PromoterDashboard from './Dashboard';
import { Event } from '../../utils/types';

async function fetchAllEvents() {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    // Fetch both confirmed and pending events
    const [confirmedResponse, pendingResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/events`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
      fetch(`http://${host}/api/pmt/promoterEvents`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    // Log responses for debugging
    console.log('Confirmed Events Status:', confirmedResponse.status);
    console.log('Pending Events Status:', pendingResponse.status);

    let confirmedEvents: Event[] = [];
    let pendingEvents: Event[] = [];

    if (confirmedResponse.ok) {
      try {
        const confirmedData = await confirmedResponse.json();
        confirmedEvents = confirmedData.events || [];
      } catch (error) {
        console.error('Error parsing confirmed events:', error);
      }
    }

    if (pendingResponse.ok) {
      try {
        const pendingData = await pendingResponse.json();
        pendingEvents = pendingData.events || [];
      } catch (error) {
        console.error('Error parsing pending events:', error);
      }
    }

    return {
      confirmedEvents,
      pendingEvents
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { confirmedEvents: [], pendingEvents: [] };
  }
}


export default async function PromoterEventsPage() {
  const { confirmedEvents, pendingEvents } = await fetchAllEvents();

  // Log the results for debugging
  console.log('Fetched confirmed events:', confirmedEvents.length);
  console.log('Fetched pending events:', pendingEvents.length);

  return (
    <PromoterDashboard 
    initialConfirmedEvents={confirmedEvents}
      initialPendingEvents={pendingEvents}
    />
  );
}