// utils/apiFunctions/fetchPuristRoster.ts

import { headers } from 'next/headers';

export async function fetchPuristRoster(eventId: string) {
  try {
    const headersList = await headers();
    const host = headersList.get('host');


if (eventId === 'muay_thai_purist_evo_santa_clara_ca_04_12_2025') {
    eventId = 'Evo_Expo_Full_Rules_Muay_Thai_04_12_2025';
  }

    const url = `http://${host}/api/purist_events/roster/${eventId}`;
    console.log('Fetching Purist Roster from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      console.log('Purist Roster fetch failed with status:', response.status);
      return null;
    }

    const data = await response.json();
    console.log('Purist Roster data:', data);

    if (!data.roster) {
      console.log('No roster data found in response');
      return null;
    }

    return data.roster;
  } catch (error) {
    console.error('Error fetching Purist Roster:', error);
    return null;
  }
}