// utils/apiFunctions/addPmtEvent.ts
import { EventType } from '../types';
import { db } from '@/lib/firebase_pmt/config';
import { 
  doc, 
  setDoc, 
  updateDoc, 
  arrayUnion, 
  getDoc 
} from 'firebase/firestore';

// Define the return type for the function
type AddPmtEventResult = 
  | { success: true; event: EventType; message: string }
  | { success: false; message: string; event?: undefined };

export async function addPmtEvent(eventData: EventType): Promise<AddPmtEventResult> {
  try {
    console.log('Processing PMT event data:', JSON.stringify(eventData, null, 2));

    if (!eventData.event_name || !eventData.date || !eventData.address) {
      throw new Error('Missing required fields: event name, date, or address');
    }

    // Ensure we have an eventId
    if (!eventData.eventId) {
      throw new Error('Missing eventId in eventData');
    }

    // First, add the event to the upcoming_events array
    const upcomingEventsRef = doc(db, 'event_calendar', 'upcoming_events');
    
    // Check if the document exists, create it if it doesn't
    const upcomingEventsDoc = await getDoc(upcomingEventsRef);
    
    if (!upcomingEventsDoc.exists()) {
      // Create the document with an empty events array
      await setDoc(upcomingEventsRef, { events: [] });
    }
    
    // Now update the document by adding the new event to the events array
    const eventForArray = {
      eventId: eventData.eventId,
      event_name: eventData.event_name,
      address: eventData.address || '',
      city: eventData.city || '',
      state: eventData.state || '',
      date: eventData.date,
      promoterId: eventData.promoterId || '',
      promotionName: eventData.promotionName || '',
      sanctioning: eventData.sanctioning || '',
      email: eventData.email || '',
      promoterEmail: eventData.promoterEmail || '',
      status: 'confirmed',
      flyer: eventData.flyer || '',
      sanctioningLogoUrl: eventData.sanctioningLogoUrl || '',
      promotionLogoUrl: eventData.promotionLogoUrl || '',
    };

    await updateDoc(upcomingEventsRef, {
      events: arrayUnion(eventForArray)
    });

    console.log('Event added to upcoming_events successfully');

    return { 
      success: true, 
      event: eventData, 
      message: 'Event added successfully to PMT database' 
    };
  } catch (error) {
    console.error('Error creating PMT event:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create PMT event' 
    };
  }
}