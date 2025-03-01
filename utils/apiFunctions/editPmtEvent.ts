// utils/apiFunctions/editPmtEvent.ts
import { EventType } from '../types';

export async function editPmtEvent(eventId: string, updatedEventData: Partial<EventType>): Promise<EventType | null> {
  try {
    const url = `/api/pmt/events/${eventId}`;
    console.log('Updating Event Data at:', url);
    console.log('Update payload:', updatedEventData);
    
    // Debugging: Check types of numeric fields
    if (updatedEventData.numMats !== undefined) {
      console.log('numMats type:', typeof updatedEventData.numMats, updatedEventData.numMats);
    }
    if (updatedEventData.registration_fee !== undefined) {
      console.log('registration_fee type:', typeof updatedEventData.registration_fee, updatedEventData.registration_fee);
    }
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(updatedEventData),
      cache: 'no-store'
    });

    // Log the raw response for debugging
    console.log('Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.event) {
      throw new Error('No event data returned after update');
    }

    return data.event as EventType;
  } catch (error) {
    console.error('Error updating event:', error);
    return null;
  }
}