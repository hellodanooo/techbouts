// utils/records/database.ts

import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { RosterFighter } from '@/utils/types';

// Function to check if a fighter exists in the techbouts_fighters collection
export async function checkFighterExistsInDatabase(fighterId: string): Promise<boolean> {
  if (!fighterId) return false;
  
  try {
    const fighterRef = doc(db, 'techbouts_fighters', fighterId);
    const fighterSnap = await getDoc(fighterRef);
    return fighterSnap.exists();
  } catch (error) {
    console.error('Error checking if fighter exists:', error);
    return false;
  }
}



/**
 * Adds a fighter from the roster to the main fighters database
 * @param fighter The fighter object from the roster
 * @returns Promise<boolean> Success status
 */
export async function addFighterToDatabase(fighter: RosterFighter): Promise<boolean> {
    if (!fighter.fighter_id) return false;
    
    try {
      // Check if fighter already exists
      const fighterRef = doc(db, 'techbouts_fighters', fighter.fighter_id);
      const fighterSnap = await getDoc(fighterRef);
      
      if (fighterSnap.exists()) {
        console.log("Fighter already exists in database");
        return true; // Already exists, consider it a success
      }
      
      // Prepare fighter data - include all necessary fields
      const fighterData = {
        fighter_id: fighter.fighter_id,
        first: fighter.first || '',
        last: fighter.last || '',
        email: fighter.email || '',
        phone: fighter.phone || '',
        age: fighter.age || 0,
        gender: fighter.gender || '',
        weightclass: fighter.weightclass || 0,
        gym: fighter.gym || '',
        gym_id: fighter.gym_id || '',
        city: fighter.city || '',
        state: fighter.state || '',
        photo: fighter.photo || '',
        mt_win: fighter.mt_win || 0,
        mt_loss: fighter.mt_loss || 0,
        mma_win: fighter.mma_win || 0,
        mma_loss: fighter.mma_loss || 0,
        boxing_win: fighter.boxing_win || 0,
        boxing_loss: fighter.boxing_loss || 0,
        pmt_win: fighter.pmt_win || 0,
        pmt_loss: fighter.pmt_loss || 0,
        nc: fighter.nc || 0,
        dq: fighter.dq || 0,
        created_at: new Date().toISOString(),
        last_updated: new Date().toISOString()
      };
      
      // Add to database
      await setDoc(fighterRef, fighterData);
      console.log("Fighter added to database successfully");
      return true;
    } catch (error) {
      console.error("Error adding fighter to database:", error);
      return false;
    }
  }