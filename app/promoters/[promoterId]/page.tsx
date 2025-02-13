import { headers } from 'next/headers';
import { EventType } from '../../../utils/types';
import PromoterDashboard from './Dashboard';
import Head from 'next/head';
import { fetchPromoter } from '@/utils/apiFunctions/fetchPromoter';

type EventsResponse = {
  confirmedEvents: EventType[];
  pendingEvents: EventType[];
}

type IKFEventsResponse = {
  ikfEvents: EventType[];
}

async function fetchPMTEvents(promoterId: string): Promise<EventsResponse> {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    const [confirmedResponse, pendingResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/events`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`http://${host}/api/pmt/pending_events`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })
    ]);

    let confirmedEvents: EventType[] = [];
    let pendingEvents: EventType[] = [];

    if (confirmedResponse.ok) {
      const confirmedData = await confirmedResponse.json();
      confirmedEvents = confirmedData.events?.filter(
        (event: EventType) => event.promoterId === promoterId
      ) || [];
    }

    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      pendingEvents = pendingData.events?.filter(
        (event: EventType) => event.promoterId === promoterId
      ) || [];
    }

    return {
      confirmedEvents,
      pendingEvents,
    };
  } catch (error) {
    console.error('Error fetching PMT events:', error);
    return { confirmedEvents: [], pendingEvents: [] };
  }
}

async function fetchIKFEvents(promoterId: string): Promise<IKFEventsResponse> {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    const response = await fetch(`http://${host}/api/ikf/events`, { 
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return {
        ikfEvents: data.events?.filter(
          (event: EventType) => event.promoterId === promoterId
        ) || []
      };
    }
    
    return { ikfEvents: [] };
  } catch (error) {
    console.error('Error fetching IKF events:', error);
    return { ikfEvents: [] };
  }
}

export default async function PromoterPage(props: { params: Promise<{ promoterId: string }> }) {
  const { promoterId } = await props.params;
  
  // First fetch the promoter to check sanctioning
  const promoter = await fetchPromoter(promoterId);

  if (!promoter) {
    return <div>Promoter not found</div>;
  }

  // Initialize event data with proper types
  let pmtEvents: EventsResponse = { confirmedEvents: [], pendingEvents: [] };
  let ikfEvents: IKFEventsResponse = { ikfEvents: [] };

  // Conditionally fetch events based on sanctioning
  if (promoter.sanctioning?.includes('PMT')) {
    pmtEvents = await fetchPMTEvents(promoterId);
  }
  
  if (promoter.sanctioning?.includes('IKF')) {
    ikfEvents = await fetchIKFEvents(promoterId);
  }

  const pageTitle = promoter.promotion || `${promoter.firstName} ${promoter.lastName}'s Events`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <PromoterDashboard
        promoter={promoter}
        promoterId={promoterId}
        initialConfirmedEvents={pmtEvents.confirmedEvents}
        initialPendingEvents={pmtEvents.pendingEvents}
        logoUrl={"/logos/techboutslogoFlat.png"}
        ikfEvents={ikfEvents.ikfEvents}
      />
    </>
  );
}