// app/api/events/[promoterId]/[eventId]/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, getDoc, updateDoc, deleteDoc } from 'firebase/firestore';

interface CalendarEvent {
  eventId?: string;
  id?: string;
  name?: string;
  event_name?: string;
  date?: string;
  promoterId?: string;
  sanctioning?: string;
  city?: string;
  state?: string;
  address?: string;
  flyer?: string;
  registration_fee?: number;
  ticket_price?: number;
  // Add other known properties as needed
  [key: string]: string | number | boolean | object | undefined;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ promoterId: string, eventId: string }> }
) {
  console.log('API Route - Starting GET request');
  console.log('API Route - Request URL:', request.url);
  
  try {
    const { promoterId, eventId } = await params;
    console.log('API Route - Fetching event with ID:', eventId, 'for promoter:', promoterId);
    
    // Fix the document path to include the promoterId in the collection path
    const eventRef = doc(db, 'events', 'promotions', promoterId, eventId);
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
  { params }: { params: Promise<{ promoterId: string, eventId: string }> }
) {
  try {
    const { promoterId, eventId } = await params;
    console.log('API Route - Updating event with ID:', eventId, 'for promoter:', promoterId);
    
    const updatedData = await request.json();
    
    // Fix the document path to include the promoterId in the collection path
    const eventRef = doc(db, 'events', 'promotions', promoterId, eventId);
    const eventSnapshot = await getDoc(eventRef);

    if (!eventSnapshot.exists()) {
      console.log('API Route - Event document not found in Firebase');
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Update the document
    await updateDoc(eventRef, updatedData);
    
    // Fetch the updated document
    const updatedSnapshot = await getDoc(eventRef);
    const updatedEventData = updatedSnapshot.data();

    return NextResponse.json({ 
      message: 'Event updated successfully',
      event: updatedEventData 
    });
  } catch (error) {
    console.error('API Route - Error updating event:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update event', details: errorMessage },
      { status: 500 }
    );
  }
}


export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ promoterId: string, eventId: string }> }
) {
  try {
    const { promoterId, eventId } = await params;
    console.log('API Route - Deleting event with ID:', eventId, 'for promoter:', promoterId);
    
    // 1. First delete the main event document
    const eventRef = doc(db, 'events', 'promotions', promoterId, eventId);
    const eventSnapshot = await getDoc(eventRef);

    if (!eventSnapshot.exists()) {
      console.log('API Route - Event document not found in Firebase');
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // Delete the document
    await deleteDoc(eventRef);
    console.log('API Route - Main event document deleted successfully');
    
    // 2. Now remove the event from the events_json array
    try {
      // Get the events_json document
      const eventCalendarRef = doc(db, "events", "events_json");
      const snapshot = await getDoc(eventCalendarRef);
      
      if (snapshot.exists()) {
        const data = snapshot.data();
        
        // Check if events array exists
        if (data && Array.isArray(data.events)) {
          // Filter out the event with matching eventId - now using proper type
          const updatedEvents = data.events.filter((event: CalendarEvent) => 
            event.eventId !== eventId && event.id !== eventId
          );
          
          // Update the document with the filtered array
          await updateDoc(eventCalendarRef, {
            events: updatedEvents
          });
          
          console.log('API Route - Event removed from events_json calendar');
        } else {
          console.log('API Route - No events array found in events_json');
        }
      } else {
        console.log('API Route - events_json document not found');
      }
    } catch (calendarError) {
      // Log but don't fail the entire operation if calendar update fails
      console.error('API Route - Error updating events_json calendar:', calendarError);
    }
    
    return NextResponse.json({ 
      message: 'Event deleted successfully from both collections',
      eventId: eventId 
    });
  } catch (error) {
    console.error('API Route - Error deleting event:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to delete event', details: errorMessage },
      { status: 500 }
    );
  }
}