import { headers } from 'next/headers';
import { Promoter } from '../types';

export async function fetchPromoter(promoterId: string) {
  try {
    const headersList = await headers();
    const host = headersList.get('host');
    console.log('Fetching promoter from:', `http://${host}/api/promoters/${promoterId}`);
    
    const response = await fetch(`http://${host}/api/promoters/${promoterId}`, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error response:', errorData);
      throw new Error(`Failed to fetch promoter: ${errorData.error}`);
    }

    const data = await response.json();
    console.log('Full promoter data:', data.promoter);
    if (!data.promoter) {
      throw new Error('No promoter data returned');
    }
    return data.promoter;
  } catch (error) {
    console.error('Error fetching promoter:', error);
    return null;
  }
}