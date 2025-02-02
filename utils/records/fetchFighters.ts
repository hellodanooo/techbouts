// utils/records/fetchFighters.ts
import { collection, getDocs, query, limit } from 'firebase/firestore';
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
  loss: number;
  mtp_id: string;
  photo: string;
  state: string;
  website: string;
  weightclass: number;
  win: string | number;
};

export const fetchPMTFighters = async (year: string): Promise<Fighter[]> => {
  try {
    // Use a query with a limit to fetch only the top 100 documents.
    const fightersRef = collection(pmtDb, `records_pmt_${year}`);
    const fightersQuery = query(fightersRef, limit(100));
    const fightersSnapshot = await getDocs(fightersQuery);

    return fightersSnapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        fighter_id: data.pmt_id,
        first: data.first,
        last: data.last,
        gym: data.gym,
        email: data.email,
        weightclass: data.weightclasses[0], // using the first weightclass as primary
        win: data.wins + data.tournament_wins,
        loss: data.losses + data.tournament_losses,
        // Provide defaults for the remaining Fighter fields
        address: '',
        age: 0,
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
  } catch (error) {
    console.error('Error fetching PMT fighters:', error);
    return [];
  }
};

export const fetchIKFFighters = async (): Promise<Fighter[]> => {
  try {
    const fightersRef = collection(techboutsDb, 'fighters_database');
    // Also limit to top 100 for IKF
    const fightersQuery = query(fightersRef, limit(100));
    const fightersSnapshot = await getDocs(fightersQuery);

    const allFighters: Fighter[] = [];
    fightersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fighters) {
        allFighters.push(...data.fighters);
      }
    });

    return allFighters;
  } catch (error) {
    console.error('Error fetching IKF fighters:', error);
    return [];
  }
};

export const fetchFighters = async (
  sanctioning: string,
  year?: string
): Promise<Fighter[]> => {
  if (sanctioning === 'pmt') {
    return fetchPMTFighters(year || '2024');
  } else if (sanctioning === 'ikf') {
    return fetchIKFFighters();
  } else {
    return [];
  }
};
