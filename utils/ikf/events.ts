import { Event } from '@/utils/types';
import { collection, doc, getDoc } from 'firebase/firestore';
import { generateDocId } from '@/utils/eventManagement';
import { db } from '@/lib/firebase_pmt/config';

export async function fetchEvents(): Promise<Event[]> {
  try {
    console.log('Utility: Starting fetch...');
    const eventCalendarRef = doc(db, 'event_calendar', 'upcoming_events');
    const snapshot = await getDoc(eventCalendarRef);
    console.log('Utility: Got Firestore snapshot');

    if (snapshot.exists()) {
      const data = snapshot.data();

      if (data && data.events) {
        return data.events.map((event: any) => {
          // Generate consistent ID using city, state, and date
          const cityFormatted = event.city?.replace(/\s+/g, '_') ?? 'unknown_city';
          
          
          const docId = generateDocId(
            event.name ?? 'Unnamed Event',
            cityFormatted,
            event.state ?? 'unknown_state',
            event.date

            
          );

          return {
            id: docId,
            event_name: event.name ?? 'Unnamed Event',
            name: event.name ?? 'Unnamed Event',
            address: event.address ?? 'No address provided',
            city: event.city ?? 'Unknown City',
            state: event.state ?? 'Unknown State',
            date: event.date,
            flyer: event.flyer && event.flyer !== '' ? event.flyer : '/default-flyer.png',
            registration_fee: event.registration_fee ?? 0,
            ticket_system_option: event.ticket_system_option ?? '',
            promoterId: event.promoterId ?? '',
            status: event.status ?? 'confirmed',
            // Additional fields for PMT events
            promotion: event.promoterId ?? '', // Map promoterId to promotion
            sanctioning: 'PMT' // Set sanctioning to PMT
          };
        });
      }
    }

    console.log('Utility: No events found');
    return [];
  } catch (error) {
    console.error("Utility: Error fetching events:", error);
    throw new Error('Failed to fetch events');
  }
}
