import { EventType } from '../types';

export async function deleteTechBoutsEvent(promoterId: string, eventId: string): Promise<boolean> {
    try {
        const url = `/api/events/${promoterId}/${eventId}`;
        console.log('deleteEvent - Deleting event at:', url);
        
        const response = await fetch(url, {
          method: 'DELETE',
          headers: { 
            'Content-Type': 'application/json'
          },
          cache: 'no-store'
        });
    
        console.log('deleteEvent - Response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        console.log('deleteEvent - Response data:', data);
        
        // Check if there was a partial success (main doc deleted but calendar update failed)
        if (data.message && data.message.includes('from both collections')) {
          console.log('deleteEvent - Event fully deleted from all collections');
        } else {
          console.log('deleteEvent - Event deletion may have been partial, but main document was deleted');
        }
        
        return true;
      } catch (error) {
        console.error('deleteEvent - Error deleting event:', error);
        return false;
      }
    }