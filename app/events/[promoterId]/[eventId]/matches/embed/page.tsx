import { Metadata } from 'next';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import EmbedMatchesPage from './EmbedMatches';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';

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

// Fetch roster data from Firestore
async function fetchRoster(promoterId: string, eventId: string) {
  const pathsToTry = [
    { path: `events/promotions/${promoterId}/${eventId}/roster_json/fighters` },
    { path: `events/${promoterId}/${eventId}/roster_json/fighters` },
    { path: `promotions/${promoterId}/events/${eventId}/roster_json/fighters` }
  ];

  for (const { path } of pathsToTry) {
    try {
      const ref = doc(db, path);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        if (data?.fighters) {
          console.log(`Found roster at path: ${path}`);
          return data.fighters;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch from path: ${path}`, err);
    }
  }

  console.warn("Roster not found in any path.");
  return [];
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

  const rosterData = await fetchRoster(promoterId, eventId);

  return (
    <EmbedMatchesPage
      eventId={eventId}
      promoterId={promoterId}
      initialRoster={rosterData}
      eventData={eventData}
    />
  );
}
