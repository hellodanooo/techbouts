import { NextResponse } from 'next/server';
import { EventType } from '@/utils/types';

export const runtime = 'nodejs';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;
const firestoreURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/event_calendar/pending_events?key=${apiKey}`;

type FirestoreField = {
  stringValue?: string;
  integerValue?: number;
  doubleValue?: number;
  booleanValue?: boolean;
  mapValue?: { fields: Record<string, FirestoreField> };
};

type FirestoreEvent = {
  mapValue: {
    fields: Record<string, FirestoreField>;
  };
};

type FirestoreDocument = {
  fields?: {
    events?: {
      arrayValue?: {
        values?: FirestoreEvent[];
      };
    };
  };
};

// Utility function to safely extract a field value
const extractField = <T extends string | number | boolean | undefined>(
  obj: FirestoreEvent,
  field: string,
  type: 'string' | 'number' | 'boolean' = 'string'
): T | undefined => {
  if (!obj?.mapValue?.fields[field]) return undefined;
  const value = obj.mapValue.fields[field];
  return (type === 'number'
    ? (value.integerValue as T) || (value.doubleValue as T)
    : type === 'boolean'
    ? (value.booleanValue as T)
    : (value.stringValue as T)) || undefined;
};

export async function GET() {
  try {
    const response = await fetch(firestoreURL, { cache: 'no-store' });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: FirestoreDocument = await response.json();

    if (!data.fields?.events?.arrayValue?.values) {
      throw new Error("No 'events' field found in document.");
    }

    const eventsArray: FirestoreEvent[] = data.fields.events.arrayValue.values;

    const events: EventType[] = eventsArray.map((event) => {
      // Extract coordinates safely
      const coordinatesField = event.mapValue.fields.coordinates;
      const coordinates = coordinatesField?.mapValue?.fields
        ? {
            latitude: parseFloat(coordinatesField.mapValue.fields.latitude?.doubleValue?.toString() || '0'),
            longitude: parseFloat(coordinatesField.mapValue.fields.longitude?.doubleValue?.toString() || '0'),
          }
        : undefined;

      return {
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
        competition_type: (extractField(event, 'competition_type', 'string') as 'FightCard' | 'Tournament') || 'FightCard',
        venue_name: extractField(event, 'venue_name', 'string'),
        coordinates,
        registration_link: extractField(event, 'registration_link', 'string'),
        matches_link: extractField(event, 'matches_link', 'string'),
        weighin_date: extractField(event, 'weighin_date', 'string'),
        weighin_start_time: extractField(event, 'weighin_start_time', 'string'),
        weighin_end_time: extractField(event, 'weighin_end_time', 'string'),
        rules_meeting_time: extractField(event, 'rules_meeting_time', 'string'),
        bouts_start_time: extractField(event, 'bouts_start_time', 'string'),
        docId: extractField(event, 'docId', 'string'),
        doors_open: extractField(event, 'doors_open', 'string'),
        spectator_info: extractField(event, 'spectator_info', 'string'),
        registration_enabled: extractField(event, 'registration_enabled', 'boolean') || false,
        registration_fee: extractField(event, 'registration_fee', 'number') || 0,
        tickets_enabled: extractField(event, 'tickets_enabled', 'boolean') || false,
        ticket_price: extractField(event, 'ticket_price', 'number') || 0,
        ticket_price_description: extractField(event, 'ticket_price_description', 'string'),
        ticket_price2: extractField(event, 'ticket_price2', 'number') || 0,
        ticket_price2_description: extractField(event, 'ticket_price2_description', 'string'),
        event_details: extractField(event, 'event_details', 'string'),
        coach_price: extractField(event, 'coach_price', 'number') || 0,
        coach_enabled: extractField(event, 'coach_enabled', 'boolean') || false,
        photos_enabled: extractField(event, 'photos_enabled', 'boolean') || false,
        photos_price: extractField(event, 'photos_price', 'number') || 0,
        status: extractField(event, 'status', 'string') || '',
        street: extractField(event, 'street', 'string'),
        postal_code: extractField(event, 'postal_code', 'string'),
        country: extractField(event, 'country', 'string'),
        colonia: extractField(event, 'colonia', 'string'),
        municipality: extractField(event, 'municipality', 'string'),
        ticket_enabled: extractField(event, 'ticket_enabled', 'boolean') || false,
        ticket_system_option: (extractField(event, 'ticket_system_option', 'string') as 'inHouse' | 'thirdParty' | 'none') || 'none',
        ticket_link: extractField(event, 'ticket_link', 'string'),
        zip: extractField(event, 'zip', 'string'),
        numMats: extractField(event, 'numMats', 'number') || 0,
      };
    });

    console.log('Fetched Pending Events:', events);

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching PMT pending events from Firestore:', error);
    return NextResponse.json({ error: 'Failed to fetch pending events' }, { status: 500 });
  }
}
