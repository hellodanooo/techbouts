// utils/apiFunctions/editTechBoutsEvent.ts
import { EventType } from '../types';

export async function editTechBoutsEvent(promoterId: string, eventId: string, updatedEventData: Partial<EventType>): Promise<EventType | null> {
  try {
    const url = `/api/events/${promoterId}/${eventId}`;
    console.log('editTechBoutsEvent - Updating Event Data at:', url);
    console.log('editTechBoutsEvent - Update payload:', updatedEventData);
    
    // Transform the data if needed to match what the API expects
    const transformedData = {
      // Ensure we have both name and event_name synced
      event_name: updatedEventData.name || updatedEventData.event_name,
      name: updatedEventData.name || updatedEventData.event_name,
      
      // Explicitly include numeric fields with proper conversion
      registration_fee: typeof updatedEventData.registration_fee === 'number' 
        ? updatedEventData.registration_fee 
        : Number(updatedEventData.registration_fee) || 0,
      
      ticket_price: typeof updatedEventData.ticket_price === 'number' 
        ? updatedEventData.ticket_price 
        : Number(updatedEventData.ticket_price) || 0,
      
      photoPackagePrice: typeof updatedEventData.photoPackagePrice === 'number' 
        ? updatedEventData.photoPackagePrice 
        : Number(updatedEventData.photoPackagePrice) || 0,
      
      coachRegPrice: typeof updatedEventData.coachRegPrice === 'number' 
        ? updatedEventData.coachRegPrice 
        : Number(updatedEventData.coachRegPrice) || 0,
      
      numMats: typeof updatedEventData.numMats === 'number' 
        ? updatedEventData.numMats 
        : Number(updatedEventData.numMats) || 1,
      
      // Include all other fields from the updated data
      ...updatedEventData,
      
      // Ensure other specific mappings if needed
      tickets_enabled: updatedEventData.ticket_enabled,
      photos_enabled: updatedEventData.photoPackageEnabled,
      photos_price: updatedEventData.photoPackagePrice,
      coach_enabled: updatedEventData.coach_enabled,
      coach_price: updatedEventData.coachRegPrice,
      payLaterEnabled: updatedEventData.payLaterEnabled ?? false,
    };
    
    console.log('editTechBoutsEvent - Transformed data:', transformedData);
    
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
      const errorText = await response.text();
      throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
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