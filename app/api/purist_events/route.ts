//app/api/pmt/purist_events/route.ts
import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';

export const runtime = 'nodejs';

const getFirestore = () => {
  return new Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID_PMT,
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL_PMT,
      private_key: process.env.FIREBASE_PRIVATE_KEY_PMT?.replace(/\\n/g, '\n'),
    },
    preferRest: true,
  });
};

export async function GET() {
  const db = getFirestore();

  try {
    const eventsRef = db.collection('purist_events');
    const snapshot = await eventsRef.get();
    
    const events = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    return NextResponse.json({ events });
  } catch (error) {
    console.error('Error fetching events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}