// app/api/pmt/events/route.ts
import { NextResponse } from 'next/server';
import firebaseAdmin from '../../../../utils/firebaseAdmin';
import { Event } from '../../../../utils/types';
import { generateDocId } from '../../../../utils/eventManagement';

// Define the type for raw Firebase event data
interface FirebaseEventData {
  name?: string;
  city?: string;
  state?: string;
  date: string;
  address?: string;
  flyer?: string;
  registration_fee?: number;
  ticket_system_option?: 'inHouse' | 'thirdParty' | 'none';
  promoterId?: string;
  status?: string;
}

interface FirebaseCalendarDoc {
  events: FirebaseEventData[];
}

export async function GET() {
  console.log('API Route: Starting fetch...');
  const db = firebaseAdmin.firestore();
  let events: Event[] = [];

  try {
    const eventCalendarRef = db.collection('event_calendar').doc('upcoming_events');
    const snapshot = await eventCalendarRef.get();
    console.log('API Route: Got Firestore snapshot');

    if (snapshot.exists) {
      const data = snapshot.data() as FirebaseCalendarDoc;
      
      if (data && data.events) {
        events = data.events.map((event: FirebaseEventData) => {
          const cityFormatted = event.city?.replace(/\s+/g, '_') ?? 'unknown_city';
          const docId = generateDocId(
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
            ticket_system_option: event.ticket_system_option ?? 'none',
            promoterId: event.promoterId ?? '',
            status: event.status ?? 'confirmed',
            // Add all required Event type properties with default values
            venue_name: '',
            weighin_date: event.date,
            weighin_start_time: '08:00',
            weighin_end_time: '09:00',
            rules_meeting_time: '09:15',
            bouts_start_time: '10:00',
            docId: docId,
            doors_open: '07:30',
            spectator_info: '',
            registration_enabled: false,
            tickets_enabled: false,
            ticket_enabled: false,
            ticket_price: 0,
            ticket_price_description: 'General Admission',
            ticket_price2: 0,
            ticket_price2_description: 'VIP',
            event_details: '',
            coach_price: 0,
            coach_enabled: false,
            photos_enabled: false,
            photos_price: 0,
            sanctioning: '',
            promotion: '',
            email: '',
            promoterEmail: ''
          };
        });
      }
    } else {
      console.log('API Route: No snapshot exists');
    }

    console.log(`API Route: Sending ${events.length} events`);
    return NextResponse.json({ events });
  } catch (error) {
    console.error("API Route: Error fetching events from Firestore:", error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}