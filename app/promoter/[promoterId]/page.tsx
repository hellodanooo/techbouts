import { headers } from 'next/headers';
import { Event } from '../../../utils/types';
import PromoterDashboard from './Dashboard';

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

// Await params properly
export default async function PromoterPage(props: { params: Promise<{ promoterId: string }> }) {
  // Await params to ensure they are resolved
  const { promoterId } = await props.params;

  const { confirmedEvents, pendingEvents } = await fetchAllEvents(promoterId);

  return (
    <PromoterDashboard
      promoterId={promoterId}
      initialConfirmedEvents={confirmedEvents}
      initialPendingEvents={pendingEvents}
    />
  );
}
