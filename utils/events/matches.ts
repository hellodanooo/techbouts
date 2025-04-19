import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase_techbouts/config';
import { RosterFighter, Bout } from '../types';


export const createMatch = async ({
  red,
  blue,
  weightclass,
  boutNum,
  ringNum,
  eventId,
  promoterId,
  eventName,
  promotionName,
  date,
  sanctioning,
  bout_type,
  dayNum,
  setIsCreatingMatch,
  setRed,
  setBlue,
}: {
  red: RosterFighter | null;
  blue: RosterFighter | null;
  weightclass: number;
  boutNum: number;
  ringNum: number;
  eventId: string;
  promoterId: string;
  eventName: string;
  promotionName: string;
  date: string;
  sanctioning: string;
  bout_type: string;
  dayNum: number;
  setIsCreatingMatch: (value: boolean) => void;
  setRed: (fighter: RosterFighter | null) => void;
  setBlue: (fighter: RosterFighter | null) => void;
}) => {
  if (!red || !blue || !eventId || !promoterId) {
    toast.error("Missing fighters or event/promoter IDs");
    return;
  }

  setIsCreatingMatch(true);

  try {
    const redId = red.fighter_id;
    const blueId = blue.fighter_id;

    if (!redId || !blueId) {
      toast.error("Fighter IDs are missing");
      return;
    }

    const bout: Bout = {
      
      weightclass: weightclass,
      ringNum: ringNum,
      boutNum: boutNum,
      red,
      blue,
      methodOfVictory: '',
      confirmed: false,
      eventId,
      eventName,
      url: '',
      date,
      promotionId: promoterId,
      promotionName,
      sanctioning,
      bout_type,
      dayNum,
      class: '',
      boutId: `day${dayNum}ring${ringNum}bout${boutNum}${sanctioning}${promoterId}${eventId}`,
    };


console.log('bout', bout)

    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (boutsDoc.exists()) {
      const data = boutsDoc.data();
      const existingBouts = data.bouts || [];
      await setDoc(boutsRef, { bouts: [...existingBouts, bout] });
    } else {
      await setDoc(boutsRef, { bouts: [bout] });
    }

    toast.success(
      `Match created: ${red.first} ${red.last} vs ${blue.first} ${blue.last}`
    );

    setRed(null);
    setBlue(null);
  } catch (error) {
    console.error("Error creating match:", error);
    toast.error("Failed to create match");
  } finally {
    setIsCreatingMatch(false);
  }
};


export const editBout = async ({
  bout,
  promoterId,
  eventId,
  originalBoutNum,

}: {
  bout: Bout; // the updated bout object
  promoterId: string;
  eventId: string;
  originalBoutNum?: number;
}) => {
  try {
    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (!boutsDoc.exists()) {
      toast.error("No bouts found to edit.");
      return;
    }

    const data = boutsDoc.data();
    const existingBouts: Bout[] = data.bouts || [];

    // Find index of the existing bout in the array
    const index = existingBouts.findIndex((b) => b.boutId === bout.boutId);
    if (index === -1) {
      toast.error(`Bout ID ${bout.boutId} not found`);
      return;
    }



    // Check if bout number has changed and there might be conflicts
    if (originalBoutNum !== undefined && bout.boutNum !== originalBoutNum) {
      const moveSuccess = await moveBout({
        boutNum: bout.boutNum,
        ringNum: bout.ringNum,
        dayNum: bout.dayNum,
        promoterId,
        eventId,
        existingBoutId: bout.boutId
      });

      if (!moveSuccess) {
        toast.error("Failed to arrange bout order");
        return;
      }
    }

    // Get fresh data after possible reordering
    const updatedBoutsDoc = await getDoc(boutsRef);
    const updatedData = updatedBoutsDoc.data();
    const updatedBouts: Bout[] = updatedData?.bouts || [];

    // Find index again as it might have changed
    const updatedIndex = updatedBouts.findIndex((b) => b.boutId === bout.boutId);
    
    if (updatedIndex === -1) {
      // The bout might have been removed or ID changed during reordering
      // Simply add the updated bout to the array
      await setDoc(boutsRef, { bouts: [...updatedBouts, bout] });
    } else {
      // Update the bout
      updatedBouts[updatedIndex] = bout;
      await setDoc(boutsRef, { bouts: updatedBouts });
    }
    
    toast.success("Bout updated successfully");
  } catch (error) {
    console.error("Error editing bout:", error);
    toast.error("Failed to edit bout");
  }
};


export const deleteBout = async ({
  boutId,
  promoterId,
  eventId,
}: {
  boutId: string;
  promoterId: string;
  eventId: string;
}) => {
  try {
    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (!boutsDoc.exists()) {
      toast.error("No bouts found to delete.");
      return;
    }

    const data = boutsDoc.data();
    const existingBouts: Bout[] = data.bouts || [];

    console.log("📦 Existing bouts:", existingBouts);
    const boutToDelete = existingBouts.find((b) => b.boutId === boutId);
    console.log("🗑️ Deleting bout:", boutToDelete);

    // Filter out the bout to delete
    const updatedBouts = existingBouts.filter((b) => b.boutId !== boutId);
    console.log("✅ Updated bouts after deletion:", updatedBouts);

    // Only update the bouts field
    await setDoc(boutsRef, { bouts: updatedBouts }, { merge: true });
    toast.success(`Bout ${boutId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting bout:", error);
    toast.error("Failed to delete bout");
  }
};



export const moveBout = async ({
  boutNum,        // Target bout number
  ringNum,
  dayNum,
  promoterId,
  eventId,
  existingBoutId = null, // ID of bout being edited or null for new bout
}: {
  boutNum: number;
  ringNum: number;
  dayNum: number;
  promoterId: string;
  eventId: string;
  existingBoutId?: string | null;
}): Promise<boolean> => {
  try {
    // Get the existing bouts
    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (!boutsDoc.exists()) {
      toast.error("No bouts document found.");
      return false;
    }

    const data = boutsDoc.data();
    const existingBouts: Bout[] = data.bouts || [];
    
console.log("bout before moving:", existingBouts);


    
    console.log("Successfully moved/rearranged bouts");
    return true;
  } catch (error) {
    console.error("Error moving bouts:", error);
    toast.error("Failed to rearrange bouts");
    return false;
  }
};





/**
 * Creates matches from weighins data based on specified constraints:
 * - Same gender
 * - Under 18: max age difference of 24 months
 * - Sorted by total wins (most experienced fighters paired together)
 * - Weightclass is determined as the average of the fighters' weighins
 * - Bout order starts with lightest fighters and all under-18s first
 * - Returns status messages to update the UI
 */
export const createMatchesFromWeighins = async ({
  eventId,
  promoterId,
  eventName,
  promotionName,
  date,
  sanctioning,
  bout_type = '',
  dayNum = 1,
  ringNum = 1, 
  startingBoutNum = 1,
  setIsCreatingMatches,
  updateStatus, // New callback function to report status
  saveMatches = false // Flag to control whether to save matches or just log them
}: {
  eventId: string;
  promoterId: string;
  eventName: string;
  promotionName: string;
  date: string;
  sanctioning: string;
  bout_type?: string;
  dayNum?: number;
  ringNum?: number;
  startingBoutNum?: number;
  setIsCreatingMatches: (value: boolean) => void;
  updateStatus?: (message: string) => void; // Optional status update callback
  saveMatches?: boolean; // Optional flag for saving matches
}) => {
  // Helper function to update status if callback provided
  const reportStatus = (message: string) => {
    console.log(message); // Always log to console
    if (updateStatus) {
      updateStatus(message); // Update UI if callback provided
    }
  };

  if (!eventId || !promoterId) {
    toast.error("Missing event or promoter IDs");
    reportStatus("❌ Error: Missing event or promoter IDs");
    return { success: false, message: "Missing event or promoter IDs", matches: [] };
  }

  setIsCreatingMatches(true);

  try {
    reportStatus("🔍 Getting fighter roster...");
    
    // Get all fighters from the roster


    const rosterRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/roster_json/fighters`
    );
    const rosterDoc = await getDoc(rosterRef);

console.log("Roster path:", `events/promotions/${promoterId}/${eventId}/roster/fighters`);

    if (!rosterDoc.exists()) {
      toast.error("No roster found for this event");
      reportStatus("❌ Error: No roster found for this event");
      setIsCreatingMatches(false);
      return { success: false, message: "No roster found for this event", matches: [] };
    }

    const data = rosterDoc.data();
    const allFighters: RosterFighter[] = data.fighters || [];

    reportStatus(`📋 Found ${allFighters.length} total fighters in roster`);

    // Filter fighters with weighin > 0 and not null
    const eligibleFighters = allFighters.filter(
      fighter => fighter.weighin && fighter.weighin > 0
    );

    reportStatus(`✅ Found ${eligibleFighters.length} fighters with valid weighin values`);

    if (eligibleFighters.length === 0) {
      toast.error("No fighters with valid weighin values found");
      reportStatus("❌ Error: No fighters with valid weighin values found");
      setIsCreatingMatches(false);
      return { success: false, message: "No fighters with valid weighin values", matches: [] };
    }

    // Group fighters by gender
    const fightersByGender: { [key: string]: RosterFighter[] } = {};
    
    eligibleFighters.forEach(fighter => {
      const gender = fighter.gender || 'unknown';
      if (!fightersByGender[gender]) {
        fightersByGender[gender] = [];
      }
      fightersByGender[gender].push(fighter);
    });

    const genderReport = Object.keys(fightersByGender).map(gender => 
      `${gender}: ${fightersByGender[gender].length}`
    ).join(', ');
    
    reportStatus(`👥 Fighter gender breakdown: ${genderReport}`);

    // Calculate age in months for each fighter
    const calculateAgeInMonths = (dob: string): number => {
      if (!dob) return 0;
      
      const birthDate = new Date(dob);
      const today = new Date();
      
      const yearDiff = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      return yearDiff * 12 + monthDiff;
    };

    // Helper to check if a fighter is under 18
    const isUnder18 = (dob: string): boolean => {
      if (!dob) return false;
      
      const birthDate = new Date(dob);
      const today = new Date();
      
      const age = today.getFullYear() - birthDate.getFullYear();
      const monthDiff = today.getMonth() - birthDate.getMonth();
      
      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
        return age - 1 < 18;
      }
      
      return age < 18;
    };

    // Count youth fighters
    const youthCount = eligibleFighters.filter(fighter => isUnder18(fighter.dob)).length;
    reportStatus(`👶 Found ${youthCount} youth fighters (under 18)`);

    // Store proposed matches
    const proposedMatches: { 
      red: RosterFighter; 
      blue: RosterFighter;
      avgWeight: number;
      isYouth: boolean;
    }[] = [];

    // Process each gender group
    let totalProcessed = 0;
    let matchesCreated = 0;
    let unmatchedTotal = 0;

    reportStatus("🔄 Beginning matching process...");

    Object.keys(fightersByGender).forEach(gender => {
      reportStatus(`⚙️ Processing ${fightersByGender[gender].length} ${gender} fighters`);
      
      // Sort fighters by total wins (descending) - handling totalWins as a local property not in the type
      const sortedFighters = [...fightersByGender[gender]].sort(
        (a, b) => ((b as any).totalWins || 0) - ((a as any).totalWins || 0)
      );
      
      totalProcessed += sortedFighters.length;
      
      // Create a copy of the sorted array to track unmatched fighters
      const unmatchedFighters = [...sortedFighters];
      
      let genderMatchesCreated = 0;
      let unmatchedCount = 0;
      
      while (unmatchedFighters.length >= 2) {
        const redFighter = unmatchedFighters.shift()!;
        
        // Find a suitable opponent
        let blueIndex = -1;
        
        // If fighter is under 18, we need to check age difference
        if (isUnder18(redFighter.dob)) {
          const redAgeMonths = calculateAgeInMonths(redFighter.dob);
          
          // Find first fighter with age difference <= 24 months
          blueIndex = unmatchedFighters.findIndex(fighter => {
            if (!isUnder18(fighter.dob)) return false;
            
            const blueAgeMonths = calculateAgeInMonths(fighter.dob);
            const ageDiffMonths = Math.abs(redAgeMonths - blueAgeMonths);
            
            return ageDiffMonths <= 24;
          });
        } else {
          // For adults, just take the next fighter
          blueIndex = 0;
        }
        
        if (blueIndex === -1) {
          // Put this fighter back at the end
          unmatchedFighters.push(redFighter);
          unmatchedCount++;
          
          // If we've gone through all fighters and couldn't match anyone, break to avoid infinite loop
          if (unmatchedFighters.length <= 1) break;
          
          continue;
        }
        
        const blueFighter = unmatchedFighters.splice(blueIndex, 1)[0];
        
        // Calculate average weight for this match
        const redWeight = redFighter.weighin || 0;
        const blueWeight = blueFighter.weighin || 0;
        const avgWeight = Math.round((redWeight + blueWeight) / 2);
        
        // Record if this is a youth match (under 18)
        const isYouth = isUnder18(redFighter.dob) || isUnder18(blueFighter.dob);
        
        // Create the match
        proposedMatches.push({
          red: redFighter,
          blue: blueFighter,
          avgWeight,
          isYouth
        });
        
        genderMatchesCreated++;
        matchesCreated++;
      }
      
      // Count unmatched fighters
      unmatchedCount += unmatchedFighters.length;
      unmatchedTotal += unmatchedCount;
      
      reportStatus(`✅ Created ${genderMatchesCreated} ${gender} matches, ${unmatchedCount} fighters unmatched`);
    });

    reportStatus(`📊 Match creation summary: ${matchesCreated} matches created, ${unmatchedTotal} fighters unmatched`);
    
    // Sort matches - youth first, then by average weight (lightest first)
    const sortedMatches = [...proposedMatches].sort((a, b) => {
      // Youth matches come first
      if (a.isYouth && !b.isYouth) return -1;
      if (!a.isYouth && b.isYouth) return 1;
      
      // For matches of the same youth status, sort by weight (lightest first)
      return a.avgWeight - b.avgWeight;
    });
    
    reportStatus(`🔄 Sorted matches by youth status and weight (youth first, then lightest first)`);
    
    // If saveMatches is false, just return the proposed matches without saving
    if (!saveMatches) {
      reportStatus("✅ Generated match suggestions successfully (not saved)");
      setIsCreatingMatches(false);
      return { 
        success: true, 
        message: `Created ${matchesCreated} matches (not saved)`, 
        matches: sortedMatches.map(match => ({ red: match.red, blue: match.blue, avgWeight: match.avgWeight, isYouth: match.isYouth }))
      };
    }
    
    // Save the matches to Firestore
    if (sortedMatches.length > 0) {
      reportStatus("💾 Saving matches to database...");
      
      const boutsRef = doc(
        db,
        `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
      );
      const boutsDoc = await getDoc(boutsRef);
      
      // Convert proposed matches to Bout objects with sequential bout numbers
      const newBouts: Bout[] = sortedMatches.map((match, index) => {
        const boutNum = startingBoutNum + index;
        return {
          weightclass: match.avgWeight, // Use the average weight as the weightclass
          ringNum,
          boutNum,
          red: match.red,
          blue: match.blue,
          methodOfVictory: '',
          confirmed: false,
          eventId,
          eventName,
          url: '',
          date,
          promotionId: promoterId,
          promotionName,
          sanctioning,
          bout_type,
          dayNum,
          class: '',
          boutId: `day${dayNum}ring${ringNum}bout${boutNum}${sanctioning}${promoterId}${eventId}`,
        };
      });
      
      if (boutsDoc.exists()) {
        const data = boutsDoc.data();
        const existingBouts = data.bouts || [];
        await setDoc(boutsRef, { bouts: [...existingBouts, ...newBouts] });
      } else {
        await setDoc(boutsRef, { bouts: newBouts });
      }
      
      toast.success(`${newBouts.length} matches created successfully`);
      reportStatus(`✅ Successfully saved ${newBouts.length} matches to database`);
      setIsCreatingMatches(false);
      return { 
        success: true, 
        message: `Created and saved ${newBouts.length} matches`, 
        matches: newBouts 
      };
    }
    
    reportStatus("⚠️ No matches were created due to matching constraints");
    setIsCreatingMatches(false);
    return { 
      success: false, 
      message: "No matches created due to matching constraints", 
      matches: [] 
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating matches from weighins:", error);
    toast.error("Failed to create matches from weighins");
    reportStatus(`❌ Error: ${errorMessage}`);
    setIsCreatingMatches(false);
    return { 
      success: false, 
      message: `Error: ${errorMessage}`, 
      matches: [] 
    };
  } finally {
    setIsCreatingMatches(false);
  }
};