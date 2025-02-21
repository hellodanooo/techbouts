// utils/apiFunctions/fetchPmtEvent.ts
import { headers } from 'next/headers';
import { EventType } from '../types';

export async function fetchPmtEvent(eventId: string) {
  try {
    const headersList = await headers(); 
    const host = headersList.get('host');
    const url = `http://${host}/api/pmt/events/${eventId}`;
    console.log('Fetching PMT Event Data from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    // Log the response status for debugging
    console.log('PMT Event Response status:', response.status);

    if (!response.ok) {
      console.log('PMT Event fetch failed with status:', response.status);
      return null;
    }

    const responseText = await response.text();
    console.log('Raw PMT Event response:', responseText);

    // Only try to parse if we have content
    if (!responseText) {
      console.log('No PMT Event content returned');
      return null;
    }

    try {
      const data = JSON.parse(responseText);
      
      if (!data.event) {
        console.log('No PMT Event data found in response');
        return null;
      }

      const eventData = {
        ...data.event,
        country: data.event.country || 'USA'
      };


      return eventData as EventType;
    } catch (parseError) {
      console.error('Error parsing PMT Event JSON response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error fetching PMT Event:', error);
    return null;
  }
}