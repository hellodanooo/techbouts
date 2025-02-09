import { headers } from 'next/headers';
import PromoterDashboard from './PageContent';
export const dynamic = 'force-dynamic';

async function fetchPMTData() {
  const headersList = await headers();
  const host = headersList.get('host');
  
  try {
    const [confirmedEventsRes, pendingEventsRes, promotersRes] = await Promise.all([
      fetch(`http://${host}/api/pmt/events`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`http://${host}/api/pmt/pending_events`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`http://${host}/api/pmt/promoters`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })
    ]);

    const [confirmedData, pendingData, promotersData] = await Promise.all([
      confirmedEventsRes.json(),
      pendingEventsRes.json(),
      promotersRes.json()
    ]);

    return {
      confirmedEvents: confirmedData.events || [],
      pendingEvents: pendingData.events || [],
      promoters: promotersData.promoters || []
    };
  } catch (error) {
    console.error('Error fetching PMT data:', error);
    return { confirmedEvents: [], pendingEvents: [], promoters: [] };
  }
}

async function fetchIKFData() {
  const headersList = await headers();
  const host = headersList.get('host');
  
  try {
    const [eventsRes, promotersRes] = await Promise.all([
      fetch(`http://${host}/api/ikf/events`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`http://${host}/api/ikf/promoters`, { 
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })
    ]);

    const [eventsData, promotersData] = await Promise.all([
      eventsRes.json(),
      promotersRes.json()
    ]);

    return {
      events: eventsData.events || [],
      promoters: promotersData.promoters || []
    };
  } catch (error) {
    console.error('Error fetching IKF data:', error);
    return { events: [], promoters: [] };
  }
}

export default async function PromoterEventsPage({ 
  params 
}: { 
  params: Promise<{ sanctioning: string }> 
}) {
  const { sanctioning } = await params;
  const sanctioningType = sanctioning.toLowerCase();

  if (sanctioningType === 'pmt') {
    const { confirmedEvents, pendingEvents, promoters } = await fetchPMTData();
    
    return (
      <PromoterDashboard 
        initialConfirmedEvents={confirmedEvents}
        initialPendingEvents={pendingEvents}
        pmtPromoters={promoters}
        ikfEvents={[]}
        ikfPromoters={[]}
      />
    );
  } 
  
  if (sanctioningType === 'ikf') {
    const { events, promoters } = await fetchIKFData();
    
    return (
      <PromoterDashboard 
        ikfEvents={events}
        ikfPromoters={promoters}
        initialConfirmedEvents={[]}
        initialPendingEvents={[]}
        pmtPromoters={[]}
      />
    );
  }

  throw new Error(`Invalid sanctioning parameter: ${sanctioning}`);
}