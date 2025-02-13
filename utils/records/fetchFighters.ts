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
          // Provide defaults for the remaining Fighter fields
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

      if (fighters.length >= 30) {
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

export const fetchIKFFighters = async (): Promise<Fighter[]> => {
  try {
    const fightersRef = collection(techboutsDb, 'fighters_database');
    // Initially fetch a batch (limit to 100 docs)
    const fightersQuery = query(fightersRef, limit(100));
    const fightersSnapshot = await getDocs(fightersQuery);

    let allFighters: Fighter[] = [];
    fightersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fighters) {
        allFighters.push(...data.fighters);
      }
    });

    // Now filter client-side using the wins threshold logic.
    let threshold = 5;
    let filteredFighters = allFighters.filter(
      (fighter) => Number(fighter.wins) > threshold
    );
    while (filteredFighters.length < 30 && threshold > 0) {
      threshold--;
      filteredFighters = allFighters.filter(
        (fighter) => Number(fighter.wins) > threshold
      );
    }

    return filteredFighters;
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
