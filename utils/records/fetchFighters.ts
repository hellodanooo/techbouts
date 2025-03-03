// utils/records/fetchFighters.ts
import { collection, getDocs, query, limit, where } from 'firebase/firestore';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { FullContactFighter, PmtFighterRecord } from '../types';



export const fetchTechBoutsFighters = async (): Promise<FullContactFighter[]> => {
  try {
    console.log('Starting to fetch TechBouts fighters');
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    const fightersQuery = query(fightersRef);

    console.log('Executing query...');
    const fightersSnapshot = await getDocs(fightersQuery);
    console.log('Query completed. Number of docs:', fightersSnapshot.size);

    const fighters: FullContactFighter[] = [];
    
    fightersSnapshot.forEach((doc) => {
      const data = doc.data();
      console.log('Processing document:', doc.id);
      console.log('Document data:', data);
      
      // Convert the document data to Fighter type
      const fighter: FullContactFighter = {
        fighter_id: data.fighter_id || doc.id,
        first: data.first || '',
        last: data.last || '',
        gym: data.gym || '',
        email: data.email || '',
        weightclass: Number(data.weightclass) || 0,
        age_gender: data.age_gender || '',
        // record
        mt_win: data.win || 0,
        mt_loss: data.loss || 0,
        boxing_win: data.boxing_win || 0,
        boxing_loss: data.boxing_loss || 0,
        mma_win: data.mmawin || 0,
        mma_loss: data.mmaloss || 0,
        pmt_win: data.pmt_win || 0,
        pmt_loss: data.pmt_loss || 0,
        nc: data.nc || 0,
        dq: data.dq || 0,
        years_exp: data.years_exp || 0,
        class: data.class || '',
        // additional fields
        address: data.address || '',
        age: Number(data.age) || 0,
        city: data.city || '',
        coach: data.coach_name || '',
        coach_name: data.coach_name || '',
        coach_phone: data.coach_phone || '',
        coach_email: data.coach_email || '',
        dob: data.dob || '',
        docId: data.docId || doc.id,
        gender: data.gender || '',
        gym_id: data.gym_id || '',
        height: Number(data.height) || 0,
  
        photo: data.photo || '',
        state: data.state || '',
        website: data.website || '',
        id: data.id || '',
        confirmed: data.confirmed || false,
     
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







export const fetchPMTFighters = async (year: string): Promise<PmtFighterRecord[]> => {
  try {
    const fightersRef = collection(pmtDb, `records_pmt_${year}`);
    let threshold = 5;
    let fighters: PmtFighterRecord[] = [];

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
          win: data.win,
          wins: data.wins,
          losses: data.losses,
          loss: data.loss,
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
          photo: '',
          state: '',
          website: '',
          pmt_id: data.pmt_id,
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