// app/promoter/page.tsx
import { headers } from 'next/headers';
import PromoterDashboard from './Dashboard';
import { Event, Promoter } from '../../utils/types';
export const dynamic = 'force-dynamic';

async function fetchAllPMTEvents() {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    // Fetch both confirmed and pending events
    const [confirmedResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/events`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      }),
    
    ]);

    // Log responses for debugging
    console.log('Confirmed Events Status:', confirmedResponse.status);

    let confirmedEvents: Event[] = [];

    if (confirmedResponse.ok) {
      try {
        const confirmedData = await confirmedResponse.json();
        confirmedEvents = confirmedData.events || [];
      } catch (error) {
        console.error('Error parsing confirmed events:', error);
      }
    }

  

    return {
      confirmedEvents,
      
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { confirmedEvents: [] };
  }
}
async function fetchAllIKFEvents() {
  try {
    console.log('Starting IKF Event Fetch')
    const headersList = await headers();
    const host = headersList.get('host');
    
    const [confirmedResponse] = await Promise.all([
      fetch(`http://${host}/api/ikf/events`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    console.log('Fetch IKF Events Status:', confirmedResponse.status);

    let ikfEvents: Event[] = [];

    if (confirmedResponse.ok) {
      try {
        const confirmedData = await confirmedResponse.json();
        ikfEvents = confirmedData.events || [];
      } catch (error) {
        console.error('Error parsing confirmed events:', error);
      }
    }

    return { ikfEvents };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { ikfEvents: [] }; // Always return a default structure
  }
}
async function fetchAllIKFPromoters() {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    const [confirmedResponse] = await Promise.all([
      fetch(`http://${host}/api/ikf/promoters`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    console.log('IKF Promoters Status:', confirmedResponse.status);

    let ikfPromoters: Promoter[] = [];

    if (confirmedResponse.ok) {
      try {
        const confirmedData = await confirmedResponse.json();
        ikfPromoters = confirmedData.promoters || [];
      } catch (error) {
        console.error('Error parsing IKF Promoters:', error);
      }
    }

    return { ikfPromoters };
  } catch (error) {
    console.error('Error fetching IKF Promoters:', error);
    return { ikfPromoters: [] }; // Always return a default structure
  }
}
async function fetchAllPMTPromoters() {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    const [confirmedResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/promoters`, { 
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    ]);

    console.log('Promoters Status:', confirmedResponse.status);

    let pmtPromoters: Promoter[] = [];

    if (confirmedResponse.ok) {
      try {
        const confirmedData = await confirmedResponse.json();
        pmtPromoters = confirmedData.promoters || [];
      } catch (error) {
        console.error('Error parsing confirmed events:', error);
      }
    }

    return { pmtPromoters };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { pmtPromoters: [] }; // Always return a default structure
  }
}


export default async function PromoterEventsPage() {

  const { confirmedEvents } = await fetchAllPMTEvents();

  const { ikfEvents } = await fetchAllIKFEvents();

  const {ikfPromoters} = await fetchAllIKFPromoters();

  const {pmtPromoters} = await fetchAllPMTPromoters();

  // Log the results for debugging
  console.log('Fetched confirmed events:', confirmedEvents.length);
  console.log('Fetched IKF events:', ikfEvents.length);
  console.log('Fetched IKF promoters:', ikfPromoters.length);
  console.log('Fetched PMT promoters:', pmtPromoters.length);

  return (
    <PromoterDashboard 
    initialConfirmedEvents={confirmedEvents}
    ikfEvents={ikfEvents}
    ikfPromoters={ikfPromoters}
    pmtPromoters={pmtPromoters}
  />
  );
}