import { headers } from 'next/headers';
import { Promoter } from '../types';

export async function fetchPromoter(promoterId: string) {
  try {
console.log('fetchPromoter', promoterId);

const transformedPromoterId = promoterId === "borntowin" ? "born_to_win" : promoterId;

    const headersList = await headers();
    const host = headersList.get('host');
    
    const url = `http://${host}/api/promoters/${transformedPromoterId}`;
    console.log('Fetching promoter from:', url);
    
    const response = await fetch(url, {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log('Response status:', response.status);
      console.log('Error response:', errorData);
      throw new Error(`Failed to fetch promoter: ${errorData.error}`);
    }

    const data = await response.json();
    console.log('Successful response data:', data);
    
    if (!data.promoter) {
      console.log('No promoter data in response:', data);
      throw new Error('No promoter data returned');
    }

    return data.promoter;
  } catch (error) {
    console.error('Error in fetchPromoter:', error);
    return null;
  }
}