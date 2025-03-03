// app/events/[eventId]/embed/page.tsx
import { Metadata } from 'next';
import { fetchPmtEvent } from '@/utils/apiFunctions/fetchPmtEvent';
import { fetchTechBoutsEvent } from '@/utils/apiFunctions/fetchTechBoutsEvent';
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
  try {
    eventData = await fetchPmtEvent(eventId);
    if (!eventData) {
      eventData = await fetchTechBoutsEvent(promoterId, eventId);


    }
  } catch (error) {
    console.error('Error fetching event data for embed:', error);
  }

if (eventData?.sanctioning === 'PMT') {
  eventData.sanctioningLogoUrl = '/logos/pmt_logo_2024_sm.png';
   
  }
  if (eventData?.sanctioning === 'PBSC') {
    eventData.sanctioningLogoUrl = '/logos/pbsc_logo.png';
    }
    if (eventData?.sanctioning === 'IKF') {
      eventData.sanctioningLogoUrl = 'techbouts.com/logos/ikf_logo.png';
      }

  return (
    <EmbedRegistrationPage 
      eventId={eventId} 
      eventData={eventData} 
    />
  );
}