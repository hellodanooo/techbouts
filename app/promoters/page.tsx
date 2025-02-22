//app/promoters/page.tsx

import { headers } from 'next/headers';
import PromoterDashboard from './Dashboard';
import { EventType, Promoter } from '../../utils/types';
import { fetchPmtEvents } from '../../utils/apiFunctions/fetchPmtEvents';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

async function fetchAllTechBoutsEvents() {
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

async function fetchAllTechBoutsPromoters() {
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

    let techBoutsPromoters: Promoter[] = [];

    if (confirmedResponse.ok) {
      try {
        const confirmedData = await confirmedResponse.json();
        techBoutsPromoters = confirmedData.promoters || [];
      } catch (error) {
        console.error('Error parsing IKF Promoters:', error);
      }
    }

    return { techBoutsPromoters };
  } catch (error) {
    console.error('Error fetching IKF Promoters:', error);
    return { techBoutsPromoters: [] };
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
    return { pmtPromoters: [] };
  }
}

export default async function PromoterEventsPage() {
  const { confirmedPMTEvents, pendingPMTEvents } = await fetchPmtEvents();
  const { allTechBoutsEvents } = await fetchAllTechBoutsEvents();
  const { techBoutsPromoters } = await fetchAllTechBoutsPromoters();
  const { pmtPromoters } = await fetchAllPMTPromoters();

  // Log the results for debugging
  console.log('Fetched confirmed events:', confirmedPMTEvents.length);
  console.log('Fetched pending events:', pendingPMTEvents.length);
  console.log('Fetched Techbouts events:', allTechBoutsEvents.length);
  console.log('Fetched TechBouts promoters:', techBoutsPromoters.length);
  console.log('Fetched PMT promoters:', pmtPromoters.length);

  return (
    <>
      <PromoterDashboard 
        initialConfirmedEvents={confirmedPMTEvents}
        initialPendingEvents={pendingPMTEvents}
        allTechBoutsEvents={allTechBoutsEvents}
        techBoutsPromoters={techBoutsPromoters}
        pmtPromoters={pmtPromoters}
      />
    </>
  );
}