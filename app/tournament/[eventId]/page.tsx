import { headers } from 'next/headers';
import TournamentDashboard from './TournamentDashboard';
import Head from 'next/head';

async function fetchEvent(eventId: string) {
  try {
    const headersList = await headers(); // Await the headers function
    const host = headersList.get('host');
    console.log('Fetching Event Data from:', `http://${host}/api/pmt/events/${eventId}`);
    
    const response = await fetch(`http://${host}/api/pmt/events/${eventId}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(`Failed to fetch event: ${errorData.error}`);
    }

    const data = await response.json();
    console.log('Full event data:', data.eventData);
    if (!data.eventData) {
      throw new Error('No event data returned');
    }
    return data.eventData;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}

export default async function TournamentPage({ 
  params 
}: { 
  params: Promise<{ eventId: string }> 
}) {
  const { eventId } = await params; // Await the params object
  const eventData = await fetchEvent(eventId);

  if (!eventData) {
    return <div>Event not found</div>;
  }

  const pageTitle = `${eventData.name} - Tournament Dashboard`;

  return (
    <>
      <Head>
        <title>{pageTitle}</title>
      </Head>
      <TournamentDashboard
        eventData={eventData}
        promoterId={eventData.promoterId}
        promoterEmail={eventData.promoterEmail}
      />
    </>
  );
}
