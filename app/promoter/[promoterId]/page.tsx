import { headers } from 'next/headers';
import { Event } from '../../../utils/types';
import PromoterDashboard from './Dashboard';
import Head from 'next/head';



async function fetchPromoter(promoterId: string) {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    console.log('Fetching promoter from:', `http://${host}/api/promoters/${promoterId}`);
    
    const response = await fetch(`http://${host}/api/promoters/${promoterId}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(`Failed to fetch promoter: ${errorData.error}`);
    }

    const data = await response.json();
    console.log('Full promoter data:', data.promoter); // Add this log to see the full data
    if (!data.promoter) {
      throw new Error('No promoter data returned');
    }
    return data.promoter;
  } catch (error) {
    console.error('Error fetching promoter:', error);
    return null;
  }
}

async function fetchPromoterIKFEvents(promoterId: string) {
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
        
        
        ikfEvents = confirmedData.events?.filter(
          (event: Event) => event.promoterId === promoterId
        ) || [];
     

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

async function fetchPMTEvents(promoterId: string) {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    
    // Fetch both responses first
    const [confirmedResponse, pendingResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/events`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`http://${host}/api/pmt/promoterEvents`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      })
    ]);

    // Initialize arrays
    let confirmedEvents: Event[] = [];
    let pendingEvents: Event[] = [];

    // Handle confirmed events
    if (confirmedResponse.ok) {
      const confirmedData = await confirmedResponse.json();
      confirmedEvents = confirmedData.events?.filter(
        (event: Event) => event.promoterId === promoterId
      ) || [];
    } else {
      const errorText = await confirmedResponse.text();
      console.error('Failed to fetch confirmed events:', errorText);
    }

    // Handle pending events
    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      pendingEvents = pendingData.events?.filter(
        (event: Event) => event.promoterId === promoterId
      ) || [];
    } else {
      const errorText = await pendingResponse.text();
      console.error('Failed to fetch pending events:', errorText);
    }

    return {
      confirmedEvents,
      pendingEvents,
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { confirmedEvents: [], pendingEvents: [] };
  }
}



export default async function PromoterPage(props: { params: Promise<{ promoterId: string }> }) {
  const { promoterId } = await props.params;
  
  // Fetch all data in parallel
  const [
    promoter,
    { confirmedEvents, pendingEvents },
    { ikfEvents },
  ] = await Promise.all([
    fetchPromoter(promoterId),
    fetchPMTEvents(promoterId),
    fetchPromoterIKFEvents(promoterId),

  ]);

  // If no promoter is found, you might want to handle this case
  if (!promoter) {
    // You could redirect to a 404 page or show an error message
    return <div>Promoter not found</div>;
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
        initialConfirmedEvents={confirmedEvents}
        initialPendingEvents={pendingEvents}
        logoUrl={"/logos/techboutslogoFlat.png"}
        ikfEvents={ikfEvents}
      />
    </>
  );
}