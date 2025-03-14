// utils/apiFunctions/createPmtEventCollection.ts
import { EventType } from '../types';
import { db } from '@/lib/firebase_pmt/config';
import { doc, setDoc } from 'firebase/firestore';

// Define the return type
type CreatePmtEventCollectionResult = 
  | { success: true; message: string }
  | { success: false; message: string };

export async function createPmtEventCollection(eventData: EventType): Promise<CreatePmtEventCollectionResult> {
  try {
    console.log('Creating PMT event collection:', JSON.stringify(eventData, null, 2));

    if (!eventData?.eventId) {
      throw new Error('Missing eventId in eventData');
    }

    // Create the event document in the events collection
    const eventDocRef = doc(db, 'events', eventData.eventId);
    
    // Convert any non-string values to strings for compatibility with the existing code
    // This is to match the behavior of your original approach where all values were stringified
    const processedEventData = Object.fromEntries(
      Object.entries(eventData).map(([key, value]) => {
        // Skip undefined values
        if (value === undefined) return [key, ''];
        
        // Keep booleans and numbers as is
        if (typeof value === 'boolean' || typeof value === 'number') {
          return [key, value];
        }
        
        // Convert objects to JSON strings
        if (typeof value === 'object' && value !== null) {
          return [key, JSON.stringify(value)];
        }
        
        return [key, String(value)];
      })
    );

    // Set the document data
    await setDoc(eventDocRef, processedEventData);

    console.log('Event collection created successfully:', eventData.eventId);
    
    return { 
      success: true, 
      message: 'Event collection created successfully' 
    };
  } catch (error) {
    console.error('Error creating event collection:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Failed to create event collection' 
    };
  }
}