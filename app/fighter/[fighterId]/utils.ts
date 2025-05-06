// app/fighter/[fighterId]/utils.ts
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { FullContactFighter, Bout, PMTFight } from '@/utils/types';


export async function getFighterData(fighterId: string): Promise<FullContactFighter | null> {
  try {
    // Fetch fighter document directly
    const fighterRef = doc(db, 'techbouts_fighters', fighterId);
    const fighterSnap = await getDoc(fighterRef);

    if (!fighterSnap.exists()) {
      return null;
    }

    const data = fighterSnap.data() as FullContactFighter;
    
    // Create base fighter object with all the required fields from interface
    const fighterData: FullContactFighter = {
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
      gym_website: data.gym_website || '',
      gym_address: data.gym_address || '',
      
      // Location Information
      state: data.state || '',
      city: data.city || '',
  
      
      // Physical Information
      weightclass: Number(data.weightclass) || 0,
      
      // Record
      mt_win: data.mt_win || 0,
      mt_loss: data.mt_loss || 0,
      boxing_win: data.boxing_win || 0,
      boxing_loss: data.boxing_loss || 0,
      mma_win: data.mma_win || data.mma_win || 0,
      mma_loss: data.mma_loss || data.mma_loss || 0,
      pmt_win: data.pmt_win || 0,
      pmt_loss: data.pmt_loss || 0,
      nc: data.nc || 0,
      dq: data.dq || 0,
      // Experience & Classification
      years_exp: data.years_exp || 0,
      other_exp: data.other_exp || '',
      age_gender: (data.age_gender as 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS') || 'MEN',
      
      // Media & Documentation
      photo: data.photo || '',
      docId: fighterSnap.id,
      
      // Additional required fields
      phone: data.phone || '',
      pb_win: data.pb_win || 0,
      pb_loss: data.pb_loss || 0,
      
      // Process fights data
      pmt_fights: processAndSortPMTFights(data),
      
      // Include legacy bouts data if available
      fullContactbouts: data.fullContactbouts || [],
      
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



function processAndSortPMTFights(data: FullContactFighter): PMTFight[] {
  const fights = Array.isArray(data.pmt_fights) ? data.pmt_fights : [];

  return fights.map(fight => ({
    eventId: fight.eventId || '',
    eventName: fight.eventName || '',
    date: fight.date || '',
    result: fight.result || '',
    weightclass: fight.weightclass || 0,
    bout_type: fight.bout_type || '',
    opponent_id: fight.opponent_id || '',
    bodykick: fight.bodykick,
    boxing: fight.boxing,
    clinch: fight.clinch,
    defense: fight.defense,
    footwork: fight.footwork,
    headkick: fight.headkick,
    kicks: fight.kicks,
    knees: fight.knees,
    legkick: fight.legkick,
    ringawareness: fight.ringawareness,
  })).sort((a, b) => {
    return new Date(b.date).getTime() - new Date(a.date).getTime();
  });
}





// New helper function to fetch verified bouts for a fighter from the separate collection
export async function getVerifiedBoutsForFighter(fighterId: string): Promise<Bout[]> {
  try {
    // Query the verified bouts collection for this fighter
    const boutsRef = collection(db, 'techbouts_verified_bouts');
    const q = query(boutsRef, where('fighter_id', '==', fighterId));
    const querySnapshot = await getDocs(q);
    
    // Process and return the bouts
    const bouts: Bout[] = [];
    querySnapshot.forEach((doc) => {
      const boutData = doc.data();
      bouts.push({
        id: doc.id,
        boutId: boutData.boutId || '',
        weightclass: boutData.weightclass || 0,
        ringNum: boutData.ringNum || 0,
        boutNum: boutData.boutNum || 0,
        date: boutData.date || '',
        fighter_id: boutData.fighter_id || '',
        opponent_id: boutData.opponent_id || '',
        result: boutData.result || '',
        eventId: boutData.eventId || '',
        eventName: boutData.eventName || '',
        referee: boutData.referee || '',
        judges: boutData.judges || [],
        duration: boutData.duration || '',
        method: boutData.method || '',
        round: boutData.round || 0,
        notes: boutData.notes || '',
        red: boutData.red || '',
        blue: boutData.blue || '',
        methodOfVictory: boutData.methodOfVictory || '',
        url: boutData.url || '',
        location: boutData.location || '',
        time: boutData.time || '',
        promotionId: boutData.promotionId || '',
        promotionName: boutData.promotionName || '',
        sanctioning: boutData.sanctioning || '',
        weightclassName: boutData.weightclassName || '',
        dayNum: boutData.dayNum || 0, // Add default value for dayNum
        class: boutData.class || '', // Add default value for class
        bout_ruleset: boutData.bout_ruleset || '', // Add default value for bout_ruleset
        bracket_bout_type: boutData.bracket_bout_type || '', // Add default value for bracket_bout_type
      } as Bout);
    });
    
    // Sort by date (most recent first)
    return bouts.sort((a, b) => {
      const dateA = a.date ? new Date(a.date) : new Date(0);
      const dateB = b.date ? new Date(b.date) : new Date(0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching verified bouts:', error);
    return [];
  }
}