import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';

export const runtime = 'nodejs';

// Helper function to initialize Firestore
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

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Fetching event", eventId);

  const db = getFirestore();

  try {
    console.log("API Route: Getting document reference");
    const eventRef = db.collection("events").doc(eventId);
    const snapshot = await eventRef.get();

    if (!snapshot.exists) {
      console.log("API Route: Event not found");
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const eventData = snapshot.data();
    console.log("API Route: Event data fetched", eventData);

    return NextResponse.json({ event: eventData });
    
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Updating event", eventId);

  try {
    const updatedData = await request.json();
    const db = getFirestore();
    const eventRef = db.collection("events").doc(eventId);

    // Verify the event exists
    const snapshot = await eventRef.get();
    if (!snapshot.exists) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Update the document
    await eventRef.update(updatedData);
    
    // Fetch and return the updated document
    const updatedSnapshot = await eventRef.get();
    const updatedEventData = updatedSnapshot.data();

    return NextResponse.json({ 
      message: "Event updated successfully",
      event: updatedEventData 
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}