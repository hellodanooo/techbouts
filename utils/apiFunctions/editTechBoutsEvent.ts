// utils/apiFunctions/editTechBoutsEvent.ts
import { EventType } from '../types';

export async function editTechBoutsEvent(eventId: string, updatedEventData: Partial<EventType>): Promise<EventType | null> {
  try {
    const url = `/api/events/${eventId}`;
    console.log('editTechBoutsEvent - Updating Event Data at:', url);
    console.log('editTechBoutsEvent - Update payload:', updatedEventData);
    
    // Transform the data if needed to match what the API expects
    const transformedData = {
      // Ensure we have both name and event_name synced
      event_name: updatedEventData.name || updatedEventData.event_name,
      name: updatedEventData.name || updatedEventData.event_name,
      // Include all other fields from the updated data
      ...updatedEventData,
      // Ensure other specific mappings if needed
      tickets_enabled: updatedEventData.ticket_enabled,
      photos_enabled: updatedEventData.photoPackageEnabled,
      photos_price: updatedEventData.photoPackagePrice,
      coach_enabled: updatedEventData.coachRegEnabled,
      coach_price: updatedEventData.coachRegPrice
    };
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: { 
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(transformedData),
      cache: 'no-store'
    });

    console.log('editTechBoutsEvent - Response status:', response.status);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!data.event) {
      throw new Error('No event data returned after update');
    }

    // Transform the response data to match the EventType if needed
    const eventData = data.event as EventType;
    
    console.log('editTechBoutsEvent - Finalized event data:', eventData);
    return eventData;
  } catch (error) {
    console.error('editTechBoutsEvent - Error updating event:', error);
    return null;
  }
}