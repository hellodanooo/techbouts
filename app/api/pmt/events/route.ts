
// app/api/pmt/events/route.ts

// HERE WE CAN CREATE THE INTIAL EVENT AS STATUS = PENDING IF WANTED

import { NextResponse } from 'next/server';
import { EventType } from '@/utils/types';

export const runtime = 'nodejs';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;
const firestoreURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/event_calendar/upcoming_events?key=${apiKey}`;

type FirestoreDocument = {
  fields?: {
    events?: {
      arrayValue?: {
        values?: FirestoreEvent[];
      };
    };
  };
};

type FirestoreEvent = {
  mapValue: {
    fields: {
      [key: string]: { stringValue?: string; integerValue?: number; doubleValue?: number; booleanValue?: boolean };
    };
  };
};

// Utility function to safely extract a field value
const extractField = <T extends string | number | boolean | undefined>(
  obj: FirestoreEvent,
  field: string,
  type: 'string' | 'number' | 'boolean' = 'string'
): T | undefined => {
  if (!obj || !obj.mapValue.fields[field]) return undefined;
  const value = obj.mapValue.fields[field];
  return (type === 'number'
    ? (value.integerValue as T) || (value.doubleValue as T)
    : type === 'boolean'
    ? (value.booleanValue as T)
    : (value.stringValue as T)) || undefined;
};

export async function GET() {
  const timestamp = new Date().toISOString(); 
  const urlWithMask = `${firestoreURL}&mask.fieldPaths=events&readTime=${timestamp}`;
  
  try {
    const response = await fetch(urlWithMask, {
      headers: {
        'Accept': 'application/json',
        'X-Firebase-Query-Options': 'readTime',
      },
      cache: 'no-store'
    });

    console.log("Request time:", new Date(timestamp).toISOString());
    console.log("Response status:", response.status);
    
    const clonedResponse = response.clone();
    const responseText = await clonedResponse.text();
    console.log("Response received at:", new Date().toISOString());
    console.log("Response body:", responseText);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data: FirestoreDocument = await response.json();

    if (!data.fields?.events?.arrayValue?.values) {
      throw new Error("No 'events' field found in document.");
    }

    const eventsArray: FirestoreEvent[] = data.fields.events.arrayValue.values;

    const events: EventType[] = eventsArray.map((event) => ({
      id: extractField(event, 'eventId', 'string') || '',
      eventId: extractField(event, 'eventId', 'string') || '',
      event_name: extractField(event, 'event_name', 'string') || '',
      address: extractField(event, 'address', 'string') || '',
      city: extractField(event, 'city', 'string') || '',
      state: extractField(event, 'state', 'string') || '',
      date: extractField(event, 'date', 'string') || '',
      flyer: extractField(event, 'flyer', 'string') || '',
      promoterId: extractField(event, 'promoterId', 'string') || '',
      promotionName: extractField(event, 'promotionName', 'string') || '',
      sanctioning: extractField(event, 'sanctioning', 'string') || '',
      email: extractField(event, 'email', 'string') || '',
      promoterEmail: extractField(event, 'promoterEmail', 'string') || '',
      competition_type: extractField(event, 'competition_type', 'string') as 'FightCard' | 'Tournament' || 'FightCard',
      venue_name: extractField(event, 'venue_name', 'string') || '',
      registration_link: extractField(event, 'registration_link', 'string') || '',
      matches_link: extractField(event, 'matches_link', 'string') || '',
      weighin_date: extractField(event, 'weighin_date', 'string') || '',
      weighin_start_time: extractField(event, 'weighin_start_time', 'string') || '',
      weighin_end_time: extractField(event, 'weighin_end_time', 'string') || '',
      rules_meeting_time: extractField(event, 'rules_meeting_time', 'string') || '',
      bouts_start_time: extractField(event, 'bouts_start_time', 'string') || '',
      docId: extractField(event, 'docId', 'string') || '',
      doors_open: extractField(event, 'doors_open', 'string') || '',
      spectator_info: extractField(event, 'spectator_info', 'string') || '',
      registration_enabled: extractField(event, 'registration_enabled', 'boolean') || false,
      registration_fee: extractField(event, 'registration_fee', 'number') || 0,
      tickets_enabled: extractField(event, 'tickets_enabled', 'boolean') || false,
      ticket_price: extractField(event, 'ticket_price', 'number') || 0,
      ticket_price_description: extractField(event, 'ticket_price_description', 'string') || '',
      status: extractField(event, 'status', 'string') || 'pending',
      numMats: extractField(event, 'numMats', 'number') || 1,
      disableRegistration: extractField(event, 'disableRegistration', 'boolean') || false,
      
      
      country: extractField(event, 'country', 'string') || 'USA',
      
      
      locale: extractField(event, 'locale', 'string') || 'en',
      event_details: extractField(event, 'event_details', 'string') || '',
      zip: extractField(event, 'zip', 'string') || '',
      coach_enabled: extractField(event, 'coach_enabled', 'boolean') || false,
      coach_price: extractField(event, 'coach_price', 'number') || 0,
      ticket_price2: extractField(event, 'ticket_price2', 'number') || 0,
      ticket_price2_description: extractField(event, 'ticket_price2_description', 'string') || '',
      photoPackagePrice: extractField(event, 'photoPackagePrice', 'number') || 0,
      coachRegPrice: extractField(event, 'coachRegPrice', 'number') || 0,
      photoPackageEnabled: extractField(event, 'photoPackageEnabled', 'boolean') || false,
      ticket_system_option: extractField(event, 'ticket_system_option', 'string') as 'inHouse' | 'thirdParty' | 'none' || 'none',
      ticket_link: extractField(event, 'ticket_link', 'string') || '',
      street: extractField(event, 'street', 'string') || '',
   
      name: extractField(event, 'name', 'string') || extractField(event, 'event_name', 'string') || '',
      display_matches: extractField(event, 'display_matches', 'boolean') || false,
      recieve_email_notifications: extractField(event, 'recieve_email_notifications', 'boolean') || false, // Added missing property
    }));

    console.log('Fetched Upcoming Events:', events);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching PMT upcoming events from Firestore:', error);
    return NextResponse.json({ error: 'Failed to fetch upcoming events' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const eventData: Partial<EventType> = await req.json();

    if (!eventData.event_name || !eventData.city || !eventData.state || !eventData.date) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const response = await fetch(firestoreURL, { cache: 'no-store' });
    const data: FirestoreDocument = await response.json();
    const existingEvents: FirestoreEvent[] = data.fields?.events?.arrayValue?.values || [];

    const newEvent: FirestoreEvent = {
      mapValue: {
        fields: {
          eventId: { stringValue: eventData.eventId || '' },
          event_name: { stringValue: eventData.event_name },
          address: { stringValue: eventData.address || '' },
          city: { stringValue: eventData.city || '' },
          state: { stringValue: eventData.state || '' },
          date: { stringValue: eventData.date },
          promoterId: { stringValue: eventData.promoterId || '' },
          promotionName: { stringValue: eventData.promotionName || '' },
          sanctioning: { stringValue: eventData.sanctioning || '' },
          email: { stringValue: eventData.email || '' },
          promoterEmail: { stringValue: eventData.promoterEmail || '' },
          status: { stringValue: 'confirmed' },
          flyer: { stringValue: eventData.flyer || '' },
        },
      },
    };

    const updatedEvents = [...existingEvents, newEvent];

    const updatePayload = {
      fields: {
        events: {
          arrayValue: { values: updatedEvents },
        },
      },
    };

    const updateResponse = await fetch(firestoreURL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatePayload),
    });

    if (!updateResponse.ok) {
      throw new Error(`Failed to update events. Status: ${updateResponse.status}`);
    }

    return NextResponse.json({ success: true, event: eventData, message: 'Event added successfully' });
  } catch (error) {
    console.error('Error adding event:', error);
    return NextResponse.json({ error: 'Failed to add event' }, { status: 500 });
  }
}