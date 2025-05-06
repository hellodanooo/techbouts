// utils/apiFunctions/fetchTechboutsBouts.ts
import { db } from '@/lib/firebase_techbouts/config';
import { Firestore, doc, getDoc, deleteDoc } from 'firebase/firestore';
import { Bout } from '@/utils/types';

/**
 * Deletes the entire matches JSON document for an event
 * 
 * @param promoterId - The promoter's ID
 * @param eventId - The event's ID
 * @returns Promise<boolean> - True if delete was successful, false otherwise
 */
export async function deleteTechboutsMatchesJson(promoterId: string, eventId: string): Promise<boolean> {
  const boutsPath = `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`;
  
  // Show confirmation dialog
  const isConfirmed = window.confirm("Are You Sure You Want To Delete the Matches?");
  
  if (!isConfirmed) {
    return false;
  }
  
  try {
    const boutsRef = doc(db, boutsPath);
    await deleteDoc(boutsRef);
    console.log(`Successfully deleted matches for event ${eventId}`);
    return true;
  } catch (err) {
    console.error(`Failed to delete matches from path: ${boutsPath}`, err);
    return false;
  }
}

/**
 * Fetches and processes bouts from Firestore
 * 
 * @param promoterId - The promoter's ID
 * @param eventId - The event's ID
 * @returns Promise<Bout[]> - Array of processed bouts
 */
export async function fetchTechboutsBouts(promoterId: string, eventId: string): Promise<Bout[]> {
  const boutsPath = `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`;
  
  try {
    const boutsRef = doc(db, boutsPath);
    const boutsDoc = await getDoc(boutsRef);
    
    if (boutsDoc.exists()) {
      const data = boutsDoc.data();
      if (data && Array.isArray(data.bouts)) {
        // Process the bouts to identify and categorize bracket bouts
        return processBoutsData(data.bouts);
      }
    }
  } catch (err) {
    console.error(`Failed to fetch bouts from path: ${boutsPath}`, err);
  }
  
  return [];
}

/**
 * Helper function to process bouts data and categorize bracket bouts
 * Preserves bout_ruleset (MT, Boxing, MMA) and bracket_bout_type (semifinal, final)
 * 
 * @param bouts - Array of bouts from Firestore
 * @returns Bout[] - Processed bouts
 */
export function processBoutsData(bouts: Bout[]): Bout[] {
  // Return the bouts as-is, preserving both bout_ruleset and bracket_bout_type
  // No need to modify any fields since they're already properly structured
  return bouts;
}

/**
 * Helper function to get all bracket bouts from an array of bouts
 * 
 * @param bouts - Array of bouts
 * @returns Bout[] - Array of bracket bouts only
 */
export function getBracketBouts(bouts: Bout[]): Bout[] {
  return bouts.filter(bout => bout.bracket_bout_type);
}

/**
 * Helper function to get bracket groups from an array of bouts
 * 
 * @param bouts - Array of bouts
 * @returns Array of bracket groups with their associated bouts
 */
export function getBracketGroups(bouts: Bout[]): {
  id: string;
  fighters: any[];
  semifinals: Bout[];
  final: Bout | null;
}[] {
  // Filter to get only bracket bouts
  const bracketBouts = getBracketBouts(bouts);
  
  // Create a map to group bouts by their bracket_bout_fighters array
  const bracketGroupsMap = new Map();
  
  bracketBouts.forEach(bout => {
    if (!bout.bracket_bout_fighters) return;
    
    // Create a stable representation of the bracket fighters
    const fightersKey = JSON.stringify(bout.bracket_bout_fighters);
    
    // If this bracket group doesn't exist yet, create it
    if (!bracketGroupsMap.has(fightersKey)) {
      const bracketId = `bracket_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
      bracketGroupsMap.set(fightersKey, {
        id: bracketId,
        fighters: bout.bracket_bout_fighters,
        semifinals: [],
        final: null
      });
    }
    
    // Add the bout to the appropriate category in the bracket group
    const bracketGroup = bracketGroupsMap.get(fightersKey);
    if (bout.bracket_bout_type === 'semifinal') {
      bracketGroup.semifinals.push(bout);
    } else if (bout.bracket_bout_type === 'final') {
      bracketGroup.final = bout;
    }
  });
  
  // Convert the Map to an array
  return Array.from(bracketGroupsMap.values());
}