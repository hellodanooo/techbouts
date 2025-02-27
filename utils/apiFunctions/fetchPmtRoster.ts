// utils/apiFunctions/fetchPmtRoster.ts
import { headers } from 'next/headers';
import { PmtFighterRecord } from '../types';

export async function fetchPmtRoster(eventId: string): Promise<PmtFighterRecord[] | null> {
  try {
    const headersList = await headers(); 
    const host = headersList.get('host');
    const url = `http://${host}/api/pmt/events/${eventId}/roster`;
    console.log('Fetching PMT Roster from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    // Log the response status for debugging
    console.log('PMT Roster Response status:', response.status);

    if (!response.ok && response.status !== 404) {
      // We allow 404 since it just means empty roster
      console.log('PMT Roster fetch failed with status:', response.status);
      return null;
    }

    const responseText = await response.text();
    console.log('Raw PMT Roster response length:', responseText.length);

    // Only try to parse if we have content
    if (!responseText) {
      console.log('No PMT Roster content returned');
      return [];
    }

    try {
      const data = JSON.parse(responseText);
      
      if (!data.roster) {
        console.log('No roster array found in response, returning empty array');
        return [];
      }

      console.log(`Successfully parsed roster with ${data.roster.length} fighters`);
      return data.roster as PmtFighterRecord[];
    } catch (parseError) {
      console.error('Error parsing PMT Roster JSON response:', parseError);
      return null;
    }
  } catch (error) {
    console.error('Error fetching PMT Roster:', error);
    return null;
  }
}