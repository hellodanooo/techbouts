import { NextResponse } from 'next/server';
import { EventType } from '@/utils/types';

export const runtime = 'nodejs';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;

export async function POST(req: Request) {
  try {
    const eventData: EventType = await req.json();

    if (!eventData?.eventId) {
      return NextResponse.json({ error: 'Missing eventId in eventData' }, { status: 400 });
    }

    const firestoreURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events/${eventData.eventId}?key=${apiKey}`;

    // Convert eventData to Firestore's expected format
    const firestoreData = {
      fields: Object.fromEntries(
        Object.entries(eventData).map(([key, value]) => [
          key,
          { stringValue: String(value) },
        ])
      ),
    };

    const response = await fetch(firestoreURL, {
      method: 'PATCH', // Firestore requires PATCH for document creation/update
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData),
    });

    if (!response.ok) {
      throw new Error(`Failed to create event collection. Status: ${response.status}`);
    }

    return NextResponse.json({ success: true, message: 'Event collection created successfully' });
  } catch (error) {
    console.error('Error creating event collection:', error);
    return NextResponse.json({ error: 'Failed to create event collection' }, { status: 500 });
  }
}
