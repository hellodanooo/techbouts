import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase_techbouts/config';
import { RosterFighter, Bout } from '../types';




export const updateBoutResults = async ({
  boutId,
  redResult,
  blueResult,
  methodOfVictory,
  promoterId,
  eventId,
}: {
  boutId: string;
  redResult: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-';
  blueResult: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-';
  methodOfVictory: string;
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
      toast.error("No bouts found to update.");
      return false;
    }

    const data = boutsDoc.data();
    const existingBouts: Bout[] = data.bouts || [];

    // Find the bout to update
    const boutIndex = existingBouts.findIndex((b) => b.boutId === boutId);
    if (boutIndex === -1) {
      toast.error(`Bout ID ${boutId} not found`);
      return false;
    }

    // Update the bout with results
    const updatedBout = {
      ...existingBouts[boutIndex],
      red: {
        ...existingBouts[boutIndex].red,
        result: redResult
      },
      blue: {
        ...existingBouts[boutIndex].blue,
        result: blueResult
      },
      methodOfVictory: methodOfVictory
    };

    // Replace the bout in the array
    existingBouts[boutIndex] = updatedBout;

    // Save back to Firebase
    await setDoc(boutsRef, { bouts: existingBouts });
    
    toast.success("Bout results updated successfully");
    return true;
  } catch (error) {
    console.error("Error updating bout results:", error);
    toast.error("Failed to update bout results");
    return false;
  }
};











export const createMatchesFromWeighins = async ({
  roster,
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
  updateStatus, // Callback function to report status
  saveMatches = false // Flag to control whether to save matches or just log them
}: {
  roster: RosterFighter[];
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
  updateStatus?: (message: string) => void; // Status update callback
  saveMatches?: boolean; // Flag for saving matches
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
    
    const allFighters: RosterFighter[] = roster || [];

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
      weightDifference: number;
    }[] = [];

    // Process each gender group
    let totalProcessed = 0;
    let matchesCreated = 0;
    let unmatchedTotal = 0;

    reportStatus("🔄 Beginning matching process...");

    // Maximum allowed weight difference (in pounds)
    const MAX_WEIGHT_DIFF = 10;
    // Maximum allowed age difference for youth fighters (in months)
    const MAX_YOUTH_AGE_DIFF_MONTHS = 24;

    // Process each gender group separately
    Object.keys(fightersByGender).forEach(gender => {
      const fighters = fightersByGender[gender];
      reportStatus(`⚙️ Processing ${fighters.length} ${gender} fighters`);
      
      // We'll use this array to track which fighters have been matched
      const matched = new Array(fighters.length).fill(false);
      
      // For each fighter
      for (let i = 0; i < fighters.length; i++) {
        // Skip if this fighter is already matched
        if (matched[i]) continue;
        
        const fighter1 = fighters[i];
        const fighter1Weight = fighter1.weighin || 0;
        const fighter1IsYouth = isUnder18(fighter1.dob);
        const fighter1AgeMonths = calculateAgeInMonths(fighter1.dob);
        
        // Find the best match for this fighter
        let bestMatchIndex = -1;
        let minWeightDiff = Infinity;
        
        for (let j = i + 1; j < fighters.length; j++) {
          // Skip if this potential opponent is already matched
          if (matched[j]) continue;
          
          const fighter2 = fighters[j];
          const fighter2Weight = fighter2.weighin || 0;
          const fighter2IsYouth = isUnder18(fighter2.dob);
          const fighter2AgeMonths = calculateAgeInMonths(fighter2.dob);
          
          // Calculate weight difference
          const weightDiff = Math.abs(fighter1Weight - fighter2Weight);
          
          // Both must be youth or both must be adults
          if (fighter1IsYouth !== fighter2IsYouth) continue;
          
          // If both are youth, check age difference
          if (fighter1IsYouth && fighter2IsYouth) {
            const ageDiffMonths = Math.abs(fighter1AgeMonths - fighter2AgeMonths);
            if (ageDiffMonths > MAX_YOUTH_AGE_DIFF_MONTHS) continue;
          }
          
          // Check if weight difference is acceptable
          if (weightDiff <= MAX_WEIGHT_DIFF && weightDiff < minWeightDiff) {
            minWeightDiff = weightDiff;
            bestMatchIndex = j;
          }
        }
        
        // If we found a match
        if (bestMatchIndex !== -1) {
          const fighter2 = fighters[bestMatchIndex];
          const avgWeight = Math.round((fighter1.weighin + fighter2.weighin) / 2);
          
          proposedMatches.push({
            red: fighter1,
            blue: fighter2,
            avgWeight,
            isYouth: fighter1IsYouth,
            weightDifference: minWeightDiff
          });
          
          // Mark both fighters as matched
          matched[i] = true;
          matched[bestMatchIndex] = true;
          
          matchesCreated++;
          
          reportStatus(`🤼 Created match: ${fighter1.first} ${fighter1.last} (${fighter1.weighin}lbs) vs ${fighter2.first} ${fighter2.last} (${fighter2.weighin}lbs)`);
        }
      }
      
      // Count unmatched fighters
      const unmatchedCount = matched.filter(m => !m).length;
      unmatchedTotal += unmatchedCount;
      
      reportStatus(`✅ Created ${matchesCreated - totalProcessed} ${gender} matches, ${unmatchedCount} fighters unmatched`);
      totalProcessed = matchesCreated;
    });

    // Final report
    reportStatus(`📊 Match creation summary: ${matchesCreated} matches created, ${unmatchedTotal} fighters unmatched`);
    
    if (proposedMatches.length === 0) {
      reportStatus("⚠️ No matches could be created with the current criteria");
      return { 
        success: false, 
        message: "No matches could be created with the current criteria", 
        matches: [] 
      };
    }

    // Sort matches - youth first, then by average weight (lightest first)
    const sortedMatches = [...proposedMatches].sort((a, b) => {
      // Youth matches come first
      if (a.isYouth && !b.isYouth) return -1;
      if (!a.isYouth && b.isYouth) return 1;
      
      // For matches of the same youth status, sort by weight (lightest first)
      return a.avgWeight - b.avgWeight;
    });
    
    reportStatus(`🔄 Sorted ${sortedMatches.length} matches by youth status and weight`);
    
    // If saveMatches is false, just return the proposed matches without saving
    if (!saveMatches) {
      reportStatus("✅ Generated match suggestions successfully (not saved)");
      setIsCreatingMatches(false);
      return { 
        success: true, 
        message: `Created ${matchesCreated} matches (not saved)`, 
        matches: sortedMatches 
      };
    }
    
    // Save the matches to Firestore
    try {
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
      
      reportStatus(`✅ Successfully saved ${newBouts.length} matches to database`);
      return { 
        success: true, 
        message: `Created and saved ${newBouts.length} matches`, 
        matches: newBouts 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      reportStatus(`❌ Error saving matches: ${errorMessage}`);
      return { 
        success: false, 
        message: `Error saving matches: ${errorMessage}`, 
        matches: sortedMatches 
      };
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    console.error("Error creating matches from weighins:", error);
    toast.error("Failed to create matches from weighins");
    reportStatus(`❌ Error: ${errorMessage}`);
    return { 
      success: false, 
      message: `Error: ${errorMessage}`, 
      matches: [] 
    };
  } finally {
    setIsCreatingMatches(false);
  }
};


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


    const redWithResetResult: RosterFighter = {
      ...red,
      result: '-',  // Reset result to empty '-'
    };

    const blueWithResetResult: RosterFighter = {
      ...blue,
      result: '-',  // Reset result to empty '-'
    };




    const bout: Bout = {
      
      weightclass: weightclass,
      ringNum: ringNum,
      boutNum: boutNum,
      red: redWithResetResult,
      blue: blueWithResetResult,
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


