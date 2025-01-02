import { headers } from 'next/headers';
import { Event } from '../../../utils/types';
import PromoterDashboard from './Dashboard';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { app } from '../../../utils/firebase';
import Head from 'next/head';

async function fetchAllEvents(promoterId: string) {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    const [confirmedResponse, pendingResponse] = await Promise.all([
      fetch(`http://${host}/api/pmt/events`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }),
      fetch(`http://${host}/api/pmt/promoterEvents`, {
        cache: 'no-store',
        headers: { 'Content-Type': 'application/json' },
      }),
    ]);

    let confirmedEvents: Event[] = [];
    let pendingEvents: Event[] = [];

    if (confirmedResponse.ok) {
      const confirmedData = await confirmedResponse.json();
      confirmedEvents =
        confirmedData.events?.filter(
          (event: Event) => event.promoterId === promoterId
        ) || [];
    }


    if (pendingResponse.ok) {
      const pendingData = await pendingResponse.json();
      pendingEvents =
        pendingData.events?.filter(
          (event: Event) => event.promoterId === promoterId
        ) || [];
    }

    return {
      confirmedEvents,
      pendingEvents,
    };
  } catch (error) {
    console.error('Error fetching events:', error);
    return { confirmedEvents: [], pendingEvents: [] };
  }
}

async function fetchPromoterLogo(promoterId: string) {
  try {
    const storage = getStorage(app);
    const logoRef = ref(storage, `techbouts_promoters/${promoterId}.png`);
    const logoUrl = await getDownloadURL(logoRef);
    return logoUrl;
  } catch (error) {
    if (error instanceof Error && (error.message.includes('storage/object-not-found') || error.message.includes('storage/unauthorized'))) {
      console.warn('Logo not found or access denied, using default logo.');
      return '/logos/techboutslogoFlat.png';
    }
    console.error('Unexpected error fetching logo:', error);
    throw error; 
  }
}

export default async function PromoterPage(props: { params: Promise<{ promoterId: string }> }) {
 
  const { promoterId } = await props.params;

  const { confirmedEvents, pendingEvents } = await fetchAllEvents(promoterId);
  const logoUrl = await fetchPromoterLogo(promoterId);

  return (
    <>
      <Head>
        <title>{promoterId.charAt(0).toUpperCase() + promoterId.slice(1)} Events</title>
        {logoUrl && <meta property="og:image" content={logoUrl} />}
      </Head>
      <PromoterDashboard
        promoterId={promoterId}
        initialConfirmedEvents={confirmedEvents}
        initialPendingEvents={pendingEvents}
        logoUrl={logoUrl}
      />
    </>
  );
}
