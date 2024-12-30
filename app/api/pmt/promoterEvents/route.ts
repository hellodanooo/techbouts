// app/api/pmt/promoterEvents/route.ts
import { NextResponse } from 'next/server';
import firebaseAdmin from '../../../../utils/firebaseAdmin';
import { Event } from '../../../../utils/types';
import { generateDocId } from '../../../../utils/eventManagement';

interface FirebaseEventData {
  eventId: string;
  name?: string;
  address?: string;
  street?: string;
  colonia?: string;
  municipality?: string;
  city?: string;
  state?: string;
  country?: string;
  postal_code?: string;
  date: string;
  flyer?: string;
  registration_fee?: number;
  ticket_system_option?: 'inHouse' | 'thirdParty' | 'none';
  promoterId?: string;
  status?: string;
  created_at: FirebaseFirestore.Timestamp;
  promoterEmail?: string;
  event_details?: string;
}

// Helper function to ensure ticket_system_option is valid
function validateTicketSystemOption(option?: string): 'inHouse' | 'thirdParty' | 'none' {
  if (option === 'inHouse' || option === 'thirdParty' || option === 'none') {
    return option;
  }
  return 'none';
}

export async function GET() {
  const db = firebaseAdmin.firestore();

  try {
    const eventCalendarRef = db.collection('event_calendar').doc('pending_events');
    const snapshot = await eventCalendarRef.get();

    let events: Event[] = [];
    if (snapshot.exists) {
      const data = snapshot.data();
      if (data && data.events) {
        events = (data.events as FirebaseEventData[]).map((event) => ({
          id: event.eventId,
          event_name: event.name ?? 'Unnamed Event',
          address: event.address ?? 'No address provided',
          street: event.street,
          colonia: event.colonia,
          municipality: event.municipality,
          city: event.city ?? 'Unknown City',
          state: event.state ?? 'Unknown State',
          country: event.country,
          postal_code: event.postal_code,
          date: event.date,
          flyer: event.flyer && event.flyer !== '' ? event.flyer : '/default-flyer.png',
          registration_fee: event.registration_fee ?? 0,
          ticket_system_option: validateTicketSystemOption(event.ticket_system_option),
          promoterId: event.promoterId ?? '',
          status: event.status ?? '',
          promoterEmail: event.promoterEmail ?? '',
          venue_name: '',
          weighin_date: event.date,
          weighin_start_time: '08:00',
          weighin_end_time: '09:00',
          rules_meeting_time: '09:15',
          bouts_start_time: '10:00',
          docId: event.eventId,
          doors_open: '07:30',
          spectator_info: '',
          registration_enabled: false,
          tickets_enabled: false,
          ticket_enabled: false,
          ticket_price: 0,
          ticket_price_description: 'General Admission',
          ticket_price2: 0,
          ticket_price2_description: 'VIP',
          event_details: event.event_details ?? '',
          coach_price: 0,
          coach_enabled: false,
          photos_enabled: false,
          photos_price: 0,
          sanctioning: '',
          promotion: '',
          email: event.promoterEmail ?? '',
          name: event.name
        }));
      }
    }

    return NextResponse.json({ events });
  } catch (error) {
    console.error("Error fetching events:", error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  const db = firebaseAdmin.firestore();

  try {
    const eventData = await request.json();
    
    const cityFormatted = eventData.city.replace(/\s+/g, '_');
    const eventId = generateDocId(cityFormatted, eventData.state, eventData.date);
    
    const newEvent: FirebaseEventData = {
      eventId,
      name: eventData.event_name,
      date: eventData.date,
      address: eventData.address,
      street: eventData.street,
      city: eventData.city,
      state: eventData.state,
      country: eventData.country,
      postal_code: eventData.postal_code,
      colonia: eventData.colonia || '',
      municipality: eventData.municipality || '',
      flyer: eventData.flyer || '',
      event_details: eventData.event_details || '',
      promoterId: eventData.promoterId,
      status: 'pending',
      created_at: firebaseAdmin.firestore.Timestamp.now(),
      promoterEmail: eventData.promoterEmail,
      ticket_system_option: validateTicketSystemOption(eventData.ticket_system_option)
    };

    const eventCalendarRef = db.collection('event_calendar').doc('pending_events');
    const doc = await eventCalendarRef.get();
    let currentEvents: FirebaseEventData[] = [];
    
    if (doc.exists) {
      const data = doc.data();
      currentEvents = data?.events || [];
    }

    await eventCalendarRef.set({
      events: [...currentEvents, newEvent]
    }, { merge: true });

    return NextResponse.json({ 
      success: true, 
      message: 'Event submitted successfully',
      eventId 
    });
  } catch (error) {
    console.error("Error submitting event:", error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit event' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const db = firebaseAdmin.firestore();
  const { searchParams } = new URL(request.url);
  const eventId = searchParams.get('id');

  if (!eventId) {
    return NextResponse.json(
      { error: 'Event ID is required' },
      { status: 400 }
    );
  }

  try {
    const eventCalendarRef = db.collection('event_calendar').doc('pending_events');
    const doc = await eventCalendarRef.get();
    
    if (!doc.exists) {
      return NextResponse.json(
        { error: 'No pending events found' },
        { status: 404 }
      );
    }

    const data = doc.data();
    const currentEvents = data?.events || [];
    const updatedEvents = currentEvents.filter(
      (event: FirebaseEventData) => event.eventId !== eventId
    );

    if (currentEvents.length === updatedEvents.length) {
      return NextResponse.json(
        { error: 'Event not found' },
        { status: 404 }
      );
    }

    await eventCalendarRef.set({
      events: updatedEvents
    });

    return NextResponse.json({ 
      success: true, 
      message: 'Event deleted successfully' 
    });
  } catch (error) {
    console.error("Error deleting event:", error);
    return NextResponse.json(
      { error: 'Failed to delete event' },
      { status: 500 }
    );
  }
}