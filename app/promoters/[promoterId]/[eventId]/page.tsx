import PageContentEvent from './PageContent';
import Head from 'next/head';
import { fetchPromoter } from '@/utils/apiFunctions/fetchPromoter';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';

export default async function EventPage({ 
  params 
}: { 
  params: Promise<{ promoterId: string, eventId: string }> 
}) {
  const { promoterId, eventId } = await params; 
  
  // Fetch promoter data first
  const promoterData = await fetchPromoter(promoterId);
  const sanctioning = promoterData?.sanctioning;

  console.log('promoterId', promoterId);
  console.log('sanctioning', sanctioning);
console.log('eventId', eventId);

  // Check if promoter has PMT sanctioning
  if (!sanctioning?.includes('PMT')) {
    return <div>No PMT Events for this promoter</div>;
  }

  // Only fetch PMT event if promoter has PMT sanctioning
  const eventData = await fetchPmtEvent(eventId);

  if (!eventData) {
    return <div>Event not found</div>;
  }

  const pageTitle = `${eventData.name} - ${eventData.date}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <PageContentEvent
        eventData={eventData}
        promoterId={eventData.promoterId}
        promoterEmail={eventData.promoterEmail}
      />
    </>
  );
}