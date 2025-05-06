// app/events/[promoterId]/[eventId]/embed/page.tsx
import { Metadata } from 'next';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import { fetchTechboutsBouts } from '@/utils/apiFunctions/techboutsBouts';
import {fetchTechBoutsRoster} from '@/utils/apiFunctions/techboutsRoster';
import {fetchPmtRoster} from '@/utils/apiFunctions/pmtRoster';

import EmbedRegistrationPage from './EmbedRegistrationPage';

export async function generateMetadata({
  params
}: {
  params: Promise<{ promoterId: string, eventId: string }>
}): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Embed Registration - ${eventId}`
  };
}

export default async function Page({
  params
}: {
  params: Promise<{ promoterId: string, eventId: string }>
}) {
  const { promoterId, eventId } = await params;
  
  // Fetch event data
  let eventData = null;
  let roster = null;

  try {
    eventData = await fetchPmtEvent(eventId);
    if (eventData) {
      eventData.sanctioning = "PMT";
      roster = await fetchPmtRoster(eventId);
    }
    if (!eventData) {
      eventData = await fetchTechBoutsEvent(promoterId, eventId);
      roster = await fetchTechBoutsRoster(promoterId, eventId);


    }
  } catch (error) {
    console.error('Error fetching event data for embed:', error);
  }

  const matchesData = await fetchTechboutsBouts(promoterId, eventId);

  return (
    <EmbedRegistrationPage 
      eventId={eventId} 
      promoterId={promoterId}
      eventData={eventData} 
      bouts={matchesData}
      roster={roster}
    />
  );
}