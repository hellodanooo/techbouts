// app/promoters/[promoterId]/[eventId]/page.tsx
import PageContentEvent from './PageContent';
import Head from 'next/head';
import { fetchPromoter } from '@/utils/apiFunctions/fetchPromoter';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchIkfEvent } from '@/utils/apiFunctions/fetchIkfEvent';

export default async function EventPage(params: { 
  params: Promise<{ promoterId: string, eventId: string }> 
}) {
  // Destructure and await the params
  const { promoterId, eventId } = await params.params;
  console.log('Page Component - Received params:', { promoterId, eventId });
  
  // Fetch promoter data first
  const promoter = await fetchPromoter(promoterId);
  console.log('Page Component - Fetched promoter:', { 
    promoterId, 
    sanctioning: promoter?.sanctioning 
  });
  
  const sanctioning = promoter?.sanctioning;

  if (!sanctioning) {
    console.log('Page Component - No sanctioning found for promoter');
    return <div>Promoter sanctioning not found</div>;
  }

  let eventData;

  // Check sanctioning and fetch appropriate event
  console.log('Page Component - Checking sanctioning:', sanctioning);
  
  if (sanctioning.includes('PMT')) {
    console.log('Page Component - Fetching PMT event');
    eventData = await fetchPmtEvent(eventId);
  } else if (sanctioning.includes('IKF')) {
    console.log('Page Component - Fetching IKF event');
    eventData = await fetchIkfEvent(eventId);
  }

  if (!eventData) {
    console.log('Page Component - No event data found');
    return <div>Event not found</div>;
  }

  console.log('Page Component - Successfully fetched event data:', { 
    eventId, 
    eventName: eventData.name 
  });

  const pageTitle = `${eventData.name} - ${eventData.date}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <PageContentEvent
        eventId={eventId}
        eventData={eventData}
        promoterId={promoterId}
        promoterEmail={promoter?.email}
        promoter={promoter}
      />
    </>
  );
}