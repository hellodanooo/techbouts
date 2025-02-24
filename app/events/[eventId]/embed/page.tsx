// app/events/[eventId]/embed/page.tsx
import { Metadata } from 'next';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
import EmbedRegistrationPage from './EmbedRegistrationPage';

export async function generateMetadata({
  params
}: {
  params: Promise<{ eventId: string }>
}): Promise<Metadata> {
  const { eventId } = await params;
  return {
    title: `Embed Registration - ${eventId}`
  };
}

export default async function Page({
  params
}: {
  params: Promise<{ eventId: string }>
}) {
  const { eventId } = await params;
  
  // Fetch event data
  let eventData = null;
  try {
    eventData = await fetchPmtEvent(eventId);
    if (!eventData) {
      eventData = await fetchTechBoutsEvent(eventId);
    }
  } catch (error) {
    console.error('Error fetching event data for embed:', error);
  }

  return (
    <EmbedRegistrationPage 
      eventId={eventId} 
      eventData={eventData} 
    />
  );
}