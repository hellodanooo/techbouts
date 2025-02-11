// utils/apiFunctions/fetchPmtEvent.ts
import { headers } from 'next/headers';
import { Event } from '../types';

export async function fetchPmtEvent(eventId: string) {
  try {
    const headersList = await headers(); 
    const host = headersList.get('host');
    const url = `http://${host}/api/pmt/events/${eventId}`;
    console.log('Fetching Event Data from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    // Log the raw response for debugging
    console.log('Response status:', response.status);
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    // Try to parse the response
    const data = JSON.parse(responseText);
    
    if (!data.event) {
      throw new Error('No event data returned');
    }

    return data.event as Event;
  } catch (error) {
    console.error('Error fetching event:', error);
    return null;
  }
}