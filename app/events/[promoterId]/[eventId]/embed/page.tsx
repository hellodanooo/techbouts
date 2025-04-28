// app/events/[promoterId]/[eventId]/embed/page.tsx
import { Metadata } from 'next';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import EmbedRegistrationPage from './EmbedRegistrationPage';
import { fetchTechboutsBouts } from '@/utils/apiFunctions/techboutsBouts';

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
  try {
    eventData = await fetchPmtEvent(eventId);
    if (!eventData) {
      eventData = await fetchTechBoutsEvent(promoterId, eventId);


    }
  } catch (error) {
    console.error('Error fetching event data for embed:', error);
  }

  let matchesData = [];

  try {
    matchesData = await fetchTechboutsBouts(promoterId, eventId);
  } catch (err) {
    console.error('Error fetching TechBouts data:', err);
  }

  return (
    <EmbedRegistrationPage 
      eventId={eventId} 
      promoterId={promoterId}
      eventData={eventData} 
      bouts={matchesData}
    />
  );
}