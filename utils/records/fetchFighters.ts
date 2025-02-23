// utils/records/fetchFighters.ts
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
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
};

export const fetchPMTFighters = async (year: string): Promise<Fighter[]> => {
  try {
    const fightersRef = collection(pmtDb, `records_pmt_${year}`);
    let threshold = 5;
    let fighters: Fighter[] = [];

    // Loop, relaxing the wins requirement until we have at least 30 fighters (or threshold hits 0)
    while (threshold >= 0) {
      const fightersQuery = query(
        fightersRef,
        where('wins', '>', threshold),
        limit(100)
      );
      const fightersSnapshot = await getDocs(fightersQuery);

      fighters = fightersSnapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          fighter_id: data.pmt_id,
          first: data.first,
          last: data.last,
          gym: data.gym,
          email: data.email,
          weightclass: data.weightclasses[0], // use the first weightclass as primary
          wins: data.wins,
          losses: data.losses,
          address: '',
          age: data.age,
          city: '',
          coach: '',
          coach_phone: '',
          coach_email: '',
          dob: '',
          docId: doc.id,
          gender: data.gender || '',
          gym_id: '',
          height: 0,
          mtp_id: '',
          photo: '',
          state: '',
          website: '',
        };
      });

      if (fighters.length >= 100) {
        break;
      }
      threshold--;
    }

    return fighters;
  } catch (error) {
    console.error('Error fetching PMT fighters:', error);
    return [];
  }
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
        wins: data.wins || 0,
        losses: data.losses || 0,
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
        website: data.website || ''
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


