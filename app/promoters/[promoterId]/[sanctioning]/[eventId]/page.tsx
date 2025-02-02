//app/promoter/[promoterId]/[sanctioning]/[eventId]/page.tsx

import { headers } from 'next/headers';
import PageContent from './PageContent';
import Head from 'next/head';
import RosterContainer from './components/rosterContainer';
import { Suspense } from 'react';

async function fetchEvent(sanctioning: string, eventId: string, promoterId: string) {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    console.log('Host:', host);
    console.log('Sanctioning:', sanctioning);
    console.log('Event ID:', eventId);
    const response = await fetch(`http://${host}/api/${sanctioning}/events/${eventId}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(`Failed to fetch ${sanctioning.toUpperCase()} event: ${errorData.error}`);
    }

    const data = await response.json();
    if (!data.event) {
      throw new Error('No event data returned');
    }

    // Verify the event belongs to the promoter
    if (data.event.promoterId !== promoterId) {
      console.log('EventDetails:', data.event); 
      throw new Error('Event does not belong to this promoter');

    }

    return data.event;
  } catch (error) {
    console.error(`Error fetching ${sanctioning.toUpperCase()} event:`, error);
    return null;
  }
}

export default async function EventPage(props: { 
  params: Promise<{ 
    eventId: string;
    sanctioning: string;
    promoterId: string;
  }> 
}) {
  const { eventId, sanctioning, promoterId } = await props.params;
  
  // Validate sanctioning body
  if (!['pmt', 'ikf'].includes(sanctioning.toLowerCase())) {
    return <div>Invalid sanctioning body</div>;
  }

  // Fetch data in parallel
  const [event] = await Promise.all([
    fetchEvent(sanctioning.toLowerCase(), eventId, promoterId),
  ]);

  // Handle cases where data is not found
  if (!event) {
    return <div>Event not found</div>;
  }



  const pageTitle = `${event.event_name || 'Event Details'} - ${sanctioning.toUpperCase()}`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <PageContent
        event={event}
        sanctioning={sanctioning.toLowerCase()}
      />

<Suspense fallback={<div>Loading roster...</div>}>
        <RosterContainer eventId={eventId} />
      </Suspense>


    </>
  );
}