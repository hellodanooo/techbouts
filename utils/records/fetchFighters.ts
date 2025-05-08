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

        // additional fields
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

        photo: data.photo || '',
        state: data.state || '',
        phone: data.phone || '',
        pb_win: data.pb_win || 0,
        pb_loss: data.pb_loss || 0,
        other_exp: '',
        pmt_fights: [],
        gym_website: '',
        gym_address: ''
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
          events_participated: data.events_participated || [],
          nc: data.nc || 0,
          dq: data.dq || 0,
          lastUpdated: data.lastUpdated || null,
          weightclasses: data.weightclasses || [],
          years_exp: data.years_exp || 0,
          pb_win: data.pb_win || 0,
          pb_loss: data.pb_loss || 0,
          mma_win: data.mma_win || 0,
          mma_loss: data.mma_loss || 0,
          boxing_win: data.boxing_win || 0,
          boxing_loss: data.boxing_loss || 0,
          // Add missing properties with default values
          bodykick: data.bodykick || 0,
          boxing: data.boxing || 0,
          clinch: data.clinch || 0,
          defense: data.defense || 0,
          footwork: data.footwork || 0,
          headkick: data.headkick || 0,
          knees: data.knees || 0,
          lowkick: data.lowkick || 0,
          power: data.power || 0,
          speed: data.speed || 0,
          stamina: data.stamina || 0,
          technique: data.technique || 0,
          kicks: data.kicks || 0,
          legkick: data.legkick || 0,
          ringawareness: data.ringawareness || 0,
          fights: data.fights || 0,
          searchKeywords: data.searchKeywords || [],
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