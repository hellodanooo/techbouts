import { Metadata } from 'next';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import { fetchTechboutsBouts } from '@/utils/apiFunctions/fetchTechboutsBouts';
import EmbedMatchesPage from './EmbedMatches';


interface PageProps {
  params: Promise<{
    promoterId: string;
    eventId: string;
  }>;
}

export async function generateMetadata({
  params
}: {
  params: Promise<{ promoterId: string; eventId: string }>;
}): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Embed Matches - ${eventId}`
  };
}



export default async function Page({ params }: PageProps) {
  const { promoterId, eventId } = await params;

  let eventData = null;
  try {
    eventData = await fetchPmtEvent(eventId);
    if (!eventData) {
      eventData = await fetchTechBoutsEvent(promoterId, eventId);
    }
  } catch (error) {
    console.error('Error fetching event data for embed matches:', error);
  }

  const matchesData = await fetchTechboutsBouts(promoterId, eventId);

  return (
    <EmbedMatchesPage
      eventId={eventId}
      promoterId={promoterId}
      bouts={matchesData}
      eventData={eventData}
    />
  );
}
