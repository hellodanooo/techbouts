// app/events/[promoterId]/[eventId]/page.tsx

import PageContentEvent from './PageContent';
import Head from 'next/head';
import { Metadata } from 'next';

import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';

// Add generateMetadata function
export async function generateMetadata({ 
  params 
}: { 
  params: Promise<{ promoterId:string, eventId: string }> 
}): Promise<Metadata> {
  
  const { promoterId, eventId } = await params;
  
  try {
    // Try PMT first
    const pmtEventData = await fetchPmtEvent(eventId);
    if (pmtEventData) {
      const pageTitle = `${pmtEventData.event_name} - ${pmtEventData.date}`;
      return {
        title: pageTitle,
        
        openGraph: {
          title: pageTitle,
        },
        twitter: {
          title: pageTitle,
        }
      };
    }

    // Try TechBouts if PMT not found
    const techBoutsEventData = await fetchTechBoutsEvent(promoterId, eventId);
    if (techBoutsEventData) {
      const pageTitle = `${techBoutsEventData.name} - ${techBoutsEventData.date}`;
      return {
        title: pageTitle,
        openGraph: {
          title: pageTitle,
        },
        twitter: {
          title: pageTitle,
        }
      };
    }



    return {
      title: 'Event Not Found | TechBouts'
    };
  } catch {
    return {
      title: 'Error Loading Event | TechBouts'
    };
  }
}


export default async function EventPage(params: { 
  params: Promise<{promoterId:string, eventId: string }> 
}) {
  // Destructure and await the params
  const { promoterId, eventId } = await params.params;
  
  console.log('Page Component - Received params:', { eventId });

  // Try to fetch from both sources
  try {
    // Try PMT first
    const pmtEventData = await fetchPmtEvent(eventId);
    if (pmtEventData) {
      console.log('Page Component - Successfully fetched PMT event data');
      const pageTitle = `${pmtEventData.event_name} - ${pmtEventData.date}`;
      console.log("SEO TITLE", pageTitle)
      // console.log("pmtEventData", pmtEventData)



      
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
    const techBoutsEventData = await fetchTechBoutsEvent(promoterId,eventId);
    
    
    if (techBoutsEventData) {
      console.log('Page Component - Successfully fetched TechBouts event data');
      const pageTitle = `${techBoutsEventData.name} - ${techBoutsEventData.date}`;
      
      // Determine if it's IKF or PBSC based on the event data
      const sanctioning = techBoutsEventData.sanctioning || 'IKF'; // Default to IKF if not specified

      const sanctioningLogoUrl = techBoutsEventData.sanctioning === 'PMT' ? '/logos/pmt_logo_2024_sm.png' : techBoutsEventData.sanctioning === 'PBSC' ? '/logos/pbsc_logo.png' : '/logos/ikf_logo.png';      
techBoutsEventData.sanctioningLogoUrl = sanctioningLogoUrl;

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