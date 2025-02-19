// app/api/pmt/events/registerFighter/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;

export async function POST(req: Request) {
  try {
    const { eventId, fighterId, ...fighterData } = await req.json();

    if (!eventId || !fighterId) {
      return NextResponse.json(
        { error: 'Missing eventId or fighterId' },
        { status: 400 }
      );
    }

    // Construct the URL for the roster_json document within the event
    const firestoreURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/events/${eventId}/roster_json/${fighterId}?key=${apiKey}`;

    // Convert fighter data to Firestore format
    const firestoreData = {
      fields: Object.fromEntries(
        Object.entries(fighterData).map(([key, value]) => [
          key,
          { stringValue: String(value) },
        ])
      ),
    };

    const response = await fetch(firestoreURL, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(firestoreData),
    });

    if (!response.ok) {
      throw new Error(`Failed to register fighter. Status: ${response.status}`);
    }

    return NextResponse.json({
      success: true,
      message: 'Fighter registered successfully',
    });
  } catch (error) {
    console.error('Error registering fighter:', error);
    return NextResponse.json(
      { error: 'Failed to register fighter' },
      { status: 500 }
    );
  }
}