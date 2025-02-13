// app/api/ikf/events/[eventId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  console.log('API Route - Starting GET request');
  console.log('API Route - Request URL:', request.url);
  
  try {
    const { eventId } = await params;
    console.log('API Route - Fetching IKF event with ID:', eventId);
    
    const eventRef = doc(db, 'events', eventId);
    console.log('API Route - Created Firestore reference');
    
    const eventSnapshot = await getDoc(eventRef);
    console.log('API Route - Got Firestore snapshot, exists:', eventSnapshot.exists());

    if (!eventSnapshot.exists()) {
      console.log('API Route - Event document not found in Firebase');
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Get the raw data and ensure ID fields are set
    const eventData = eventSnapshot.data();
    console.log('API Route - Raw Firestore data:', eventData);

    return NextResponse.json({ event: eventData });
  } catch (error) {
    console.error('API Route - Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to fetch event', details: errorMessage },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const { eventId } = await params;
    const updatedData = await request.json();
    
    const eventRef = doc(db, 'events', eventId);
    const eventSnapshot = await getDoc(eventRef);

    if (!eventSnapshot.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // ✅ Use `updateDoc` instead of `eventRef.update`
    await updateDoc(eventRef, updatedData);
    
    const updatedSnapshot = await getDoc(eventRef);
    const updatedEventData = updatedSnapshot.data();

    return NextResponse.json({ 
      message: 'Event updated successfully',
      event: updatedEventData 
    });
  } catch (error) {
    console.error('API Route - Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update event', details: errorMessage },
      { status: 500 }
    );
  }
}
