// utils/records/fetchTechBoutsFighters.ts

import { collection, getDocs, query } from 'firebase/firestore';

import { db as techboutsDb } from '@/lib/firebase_techbouts/config';

export type Fighter = {
  address: string;
  age: number;
  city: string;
  coach: string;
  coach_phone: string;
  coach_email: string;
  email: string;
  dob: string;
  docId: string;
  fighter_id: string;
  first: string;
  gender: string;
  gym: string;
  gym_id: string;
  height: number;
  last: string;
  losses: number;
  mtp_id: string;
  photo: string;
  state: string;
  website: string;
  weightclass: number;
  wins: string | number;
  mma_win?: number;
  mma_loss?: number;
  
};

export const fetchTechBoutsFighters = async (): Promise<Fighter[]> => {
    try {
      console.log('Starting to fetch TechBouts fighters');
      const fightersRef = collection(techboutsDb, 'techbouts_fighters');
      const fightersQuery = query(fightersRef);
  
      console.log('Executing query...');
      const fightersSnapshot = await getDocs(fightersQuery);
      console.log('Query completed. Number of docs:', fightersSnapshot.size);
  
      const fighters: Fighter[] = [];
      
      fightersSnapshot.forEach((doc) => {
        const data = doc.data();
        console.log('Processing document:', doc.id);
        console.log('Document data:', data);
        
        // Convert the document data to Fighter type
        const fighter: Fighter = {
          fighter_id: data.fighter_id || doc.id,
          first: data.first || '',
          last: data.last || '',
          gym: data.gym || '',
          email: data.email || '',
          weightclass: Number(data.weightclass) || 0,
          wins: data.win || 0,
          losses: data.loss || 0,
          address: data.address || '',
          age: Number(data.age) || 0,
          city: data.city || '',
          coach: data.coach_name || '',  // Updated to match the field name in screenshot
          coach_phone: data.coach_phone || '',
          coach_email: data.coach_email || '',
          dob: data.dob || '',
          docId: data.docId || doc.id,
          gender: data.gender || '',
          gym_id: data.gym_id || '',
          height: Number(data.height) || 0,
          mtp_id: data.mtp_id || '',
          photo: data.photo || '',
          state: data.state || '',
          website: data.website || '',
          mma_win: data.mma_win || 0,
          mma_loss: data.mma_loss || 0,
        };
        
        fighters.push(fighter);
      });
  
      console.log(`Found ${fighters.length} TechBouts fighters`);
      if (fighters.length > 0) {
        console.log('Sample fighter:', fighters[0]);
      }
      
      return fighters;
      
    } catch (error) {
      console.error('Error fetching TechBouts fighters:', error);
      if (error instanceof Error) {
        console.error('Error details:', error.message);
        console.error('Error stack:', error.stack);
      }
      return [];
    }
  };
  