// app/events/[eventId]/page.tsx
import PageContentEvent from './PageContent';
import Head from 'next/head';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';

export default async function EventPage(params: { 
  params: Promise<{eventId: string }> 
}) {
  // Destructure and await the params
  const { eventId } = await params.params;
  
  console.log('Page Component - Received params:', { eventId });

  // Try to fetch from both sources
  try {
    // Try PMT first
    const pmtEventData = await fetchPmtEvent(eventId);
    if (pmtEventData) {
      console.log('Page Component - Successfully fetched PMT event data');
      const pageTitle = `${pmtEventData.name} - ${pmtEventData.date}`;
      
      return (
        <>
          <Head>
            <title>{pageTitle}</title>
          </Head>
          <PageContentEvent
            eventId={eventId}
            eventData={{...pmtEventData, sanctioning: 'PMT'}}
            promoterId={pmtEventData.promoterId}
            promoterEmail={pmtEventData.promoterEmail}
          />
        </>
      );
    }

    // If PMT event not found, try TechBouts (IKF/PBSC)
    const techBoutsEventData = await fetchTechBoutsEvent(eventId);
    if (techBoutsEventData) {
      console.log('Page Component - Successfully fetched TechBouts event data');
      const pageTitle = `${techBoutsEventData.name} - ${techBoutsEventData.date}`;
      
      // Determine if it's IKF or PBSC based on the event data
      const sanctioning = techBoutsEventData.sanctioning || 'IKF'; // Default to IKF if not specified
      
      return (
        <>
          <Head>
            <title>{pageTitle}</title>
          </Head>
          <PageContentEvent
            eventId={eventId}
            eventData={{...techBoutsEventData, sanctioning}}
            promoterId={techBoutsEventData.promoterId}
            promoterEmail={techBoutsEventData.promoterEmail}
          />
        </>
      );
    }

    // If no event is found in either source
    console.log('Page Component - No event data found in any source');
    return <div className="p-4 text-center">Event not found</div>;

  } catch (error) {
    console.error('Error fetching event data:', error);
    return (
      <div className="p-4 text-center">
        Error loading event. Please try again later.
      </div>
    );
  }
}