// app/fighter/[fighterId]/utils.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { FullContactFighter } from '@/utils/types';

// Define interfaces for the expected data structures
interface FighterFight {
  eventId: string;
  eventName: string;
  date: string;
  result: string;
  weightclass: number;
  opponent_id: string;
  bout_type: string;
  bodykick: number;
  boxing: number;
  clinch: number;
  defense: number;
  footwork: number;
  headkick: number;
  kicks: number;
  knees: number;
  legkick: number;
  ringawareness: number;
}

// Define the structure of the raw fighter data from Firestore
interface FirestoreFighterData {
  fighter_id?: string;
  first?: string;
  last?: string;
  dob?: string;
  age?: number;
  gender?: string;
  email?: string;
  
  // Gym Information
  gym?: string;
  gym_id?: string;
  coach?: string;
  coach_email?: string;
  coach_name?: string;
  coach_phone?: string;
  
  // Location Information
  state?: string;
  city?: string;
  address?: string;
  
  // Physical Information
  weighin?: number;
  weightclass?: number | string;
  height?: number | string;
  
  // Record
  mt_win?: number;
  mt_loss?: number;
  boxing_win?: number;
  boxing_loss?: number;
  mma_win?: number;
  mma_loss?: number;
  pmt_win?: number;
  pmt_loss?: number;
  win?: number;
  loss?: number;
  mmawin?: number;
  mmaloss?: number;
  nc?: number;
  dq?: number;
  
  // Experience & Classification
  years_exp?: number;
  class?: 'A' | 'B' | 'C' | string;
  age_gender?: 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS' | string;
  confirmed?: boolean;
  
  // Media & Documentation
  photo?: string;
  photo_package?: boolean;
  
  // Fights data
  fights?: Partial<FighterFight>[];
  pmt_fights?: Partial<FighterFight>[];
}

export async function getFighterData(fighterId: string): Promise<FullContactFighter | null> {
  try {
    // Fetch fighter document directly
    const fighterRef = doc(db, 'techbouts_fighters', fighterId);
    const fighterSnap = await getDoc(fighterRef);

    if (!fighterSnap.exists()) {
      return null;
    }

    const data = fighterSnap.data() as FirestoreFighterData;
    
    // Create base fighter object with all the required fields from interface
    const fighterData: FullContactFighter = {
      id: data.fighter_id || fighterSnap.id,
      fighter_id: data.fighter_id || fighterSnap.id,
      first: data.first || '',
      last: data.last || '',
      dob: data.dob || '',
      age: data.age || 0,
      gender: data.gender || '',
      email: data.email || '',
      
      // Gym Information
      gym: data.gym || '',
      gym_id: data.gym_id || '',
      coach: data.coach || '',
      coach_email: data.coach_email || '',
      coach_name: data.coach_name || '',
      coach_phone: data.coach_phone || '',
      
      // Location Information
      state: data.state || '',
      city: data.city || '',
      address: data.address || '',
      
      // Physical Information
      weighin: data.weighin || 0,
      weightclass: Number(data.weightclass) || 0,
      height: Number(data.height) || 0,
      
      // Record
      mt_win: data.mt_win || data.win || 0,
      mt_loss: data.mt_loss || data.loss || 0,
      boxing_win: data.boxing_win || 0,
      boxing_loss: data.boxing_loss || 0,
      mma_win: data.mma_win || data.mmawin || 0,
      mma_loss: data.mma_loss || data.mmaloss || 0,
      pmt_win: data.pmt_win || 0,
      pmt_loss: data.pmt_loss || 0,
      nc: data.nc || 0,
      dq: data.dq || 0,
      
      // Experience & Classification
      years_exp: data.years_exp || 0,
      class: (data.class as 'A' | 'B' | 'C') || 'C',
      age_gender: (data.age_gender as 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS') || 'MEN',
      confirmed: data.confirmed || false,
      
      // Media & Documentation
      photo: data.photo || '',
      photo_package: data.photo_package || false,
      docId: fighterSnap.id,
      
      // Process fights data
      fights: processAndSortFights(data),
      
      // Payment information with defaults
      payment_info: {
        paymentIntentId: '',
        paymentAmount: 0,
        paymentCurrency: ''
      }
    };

    // Calculate total wins/losses
    const totalWins = 
      (fighterData.mt_win || 0) + 
      (fighterData.boxing_win || 0) + 
      (fighterData.mma_win || 0) + 
      (fighterData.pmt_win || 0);
    
    const totalLosses = 
      (fighterData.mt_loss || 0) + 
      (fighterData.boxing_loss || 0) + 
      (fighterData.mma_loss || 0) + 
      (fighterData.pmt_loss || 0);

    return {
      ...fighterData,
      wins: totalWins, // Add a convenience property for total wins
      losses: totalLosses, // Add a convenience property for total losses
    } as FullContactFighter;
  } catch (error) {
    console.error('Error fetching fighter data:', error);
    return null;
  }
}

// Helper function to process and sort fights data
function processAndSortFights(data: FirestoreFighterData): FighterFight[] {
  let fights: Partial<FighterFight>[] = [];
  
  // Check for different possible fight data structures
  if (Array.isArray(data.pmt_fights) && data.pmt_fights.length > 0) {
    fights = data.pmt_fights;
  } else if (Array.isArray(data.fights) && data.fights.length > 0) {
    fights = data.fights;
  }
  
  // Process fights to ensure all required fields
  const processedFights = fights.map((fight: Partial<FighterFight>) => ({
    eventId: fight.eventId || '',
    eventName: fight.eventName || '',
    date: fight.date || '',
    result: fight.result || '',
    weightclass: fight.weightclass || 0,
    opponent_id: fight.opponent_id || '',
    bout_type: fight.bout_type || '',
    bodykick: fight.bodykick || 0,
    boxing: fight.boxing || 0,
    clinch: fight.clinch || 0,
    defense: fight.defense || 0,
    footwork: fight.footwork || 0,
    headkick: fight.headkick || 0,
    kicks: fight.kicks || 0,
    knees: fight.knees || 0,
    legkick: fight.legkick || 0,
    ringawareness: fight.ringawareness || 0,
  }));
  
  // Sort fights by date, most recent first
  return processedFights.sort((a, b) => {
    // Try to parse dates if possible
    const dateA = a.date ? new Date(a.date) : new Date(0);
    const dateB = b.date ? new Date(b.date) : new Date(0);
    
    // Sort in descending order (newest first)
    return dateB.getTime() - dateA.getTime();
  });
}