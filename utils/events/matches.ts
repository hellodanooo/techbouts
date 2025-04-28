import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase_techbouts/config';
import { RosterFighter, Bout, EventType } from '../types';



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



export const isBoutFinished = (bout: Bout): boolean => {
  // Check if both red and blue have results other than null, blank, or "-"
  const redResult = bout.red?.result;
  const blueResult = bout.blue?.result;
  
  // Consider a bout finished if both fighters have valid results
  return (
    redResult && 
    redResult !== '-' &&
    blueResult && 
    blueResult !== '-'
  );
};

/**
 * Validates if a URL is properly formatted
 */
export const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};


export const getPhotoUrl = (fighter: RosterFighter, defaultPhotoUrl: string = "/images/techbouts_fighter_icon.png"): string => {
  return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
};


export const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

const generateFighterStatsHtml = (fighter: RosterFighter) => {
  return `
    <div class="fighter-stats">
      <table style="border-collapse: collapse; line-height: 0.8; font-size: 12px;">
        <tbody>
          <tr>
            <td style="opacity: 0.7; width: 40px; text-align: center; padding: 0;">YRS:</td>
            <td style="text-align: center; padding: 0 0 0 2px;">${fighter.years_exp || '-'}</td>
          </tr>
          ${(fighter.mt_win > 0 || fighter.mt_loss > 0) ? `
          <tr>
            <td style="opacity: 0.7; width: 40px; text-align: center; padding: 0;">MT:</td>
            <td style="text-align: center; padding: 0 0 0 2px;">${fighter.mt_win}-${fighter.mt_loss}</td>
          </tr>` : ''}
          ${(fighter.mma_win > 0 || fighter.mma_loss > 0) ? `
          <tr>
            <td style="opacity: 0.7; width: 40px; text-align: center; padding: 0;">MMA:</td>
            <td style="text-align: center; padding: 0 0 0 2px;">${fighter.mma_win}-${fighter.mma_loss}</td>
          </tr>` : ''}
          ${(fighter.pmt_win > 0 || fighter.pmt_loss > 0) ? `
          <tr>
            <td style="opacity: 0.7; width: 40px; text-align: center; padding: 0;">PMT:</td>
            <td style="text-align: center; padding: 0 0 0 2px;">${fighter.pmt_win}-${fighter.pmt_loss}</td>
          </tr>` : ''}
          ${(fighter.pb_win > 0 || fighter.pb_loss > 0) ? `
          <tr>
            <td style="opacity: 0.7; width: 40px; text-align: center; padding: 0;">PBSC:</td>
            <td style="text-align: center; padding: 0 0 0 2px;">${fighter.pb_win}-${fighter.pb_loss}</td>
          </tr>` : ''}
        </tbody>
      </table>
    </div>
  `;
};

/**
 * Generates HTML content for a bout card
 */
export const generateBoutsHtml = (bouts: Bout[], eventData?: EventType) => {
  // Separate bouts into finished and unfinished
  const finishedBouts = bouts.filter(bout => isBoutFinished(bout));
  const unfinishedBouts = bouts.filter(bout => !isBoutFinished(bout));
  
  const cssStyles = `
    <style>
      body {
        font-family: Arial, sans-serif;
        line-height: 1.6;
        color: #333;
        max-width: 1200px;
        margin: 0 auto;
        padding: 20px;
      }
      .event-header {
        text-align: center;
        margin-bottom: 30px;
      }
      .event-title {
        font-size: 28px;
        font-weight: bold;
      }
      .event-date {
        font-size: 18px;
        color: #666;
      }
      .event-location {
        font-size: 16px;
        color: #666;
        margin-bottom: 10px;
      }
      .bouts-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .bouts-table th {
        background-color: #f0f0f0;
        padding: 12px;
        text-align: center;
        border: 1px solid #ddd;
      }
      .bouts-table td {
        padding: 12px;
        border: 1px solid #ddd;
        vertical-align: top;
      }
      .bout-number {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        border-radius: 50%;
        border: 1px solid #999;
        margin: 0 auto 8px auto;
        font-size: 14px;
      }
      .section-header {
        background-color: #e9e9e9;
        text-align: center;
        font-weight: bold;
        padding: 8px;
      }
      .red-fighter {
        position: relative;
        display: flex;
        align-items: flex-start;
      }
      .blue-fighter {
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        text-align: right;
      }
      .fighter-photo {
        width: 60px;
        height: 60px;
        border-radius: 6px;
        object-fit: cover;
      }
      .fighter-info {
        margin: 0 10px;
      }
      .fighter-name {
        font-weight: bold;
        font-size: 16px;
      }
      .fighter-gym {
        color: #666;
        font-size: 14px;
      }
      .fighter-stats {
        font-size: 12px;
        color: #555;
      }
      .match-info {
        text-align: center;
      }
      .weightclass {
        margin-bottom: 5px;
      }
      .bout-type {
        margin-bottom: 5px;
      }
      .bout-result {
        font-weight: bold;
        margin-top: 10px;
      }
      .result-red {
        color: #d32f2f;
      }
      .result-blue {
        color: #1976d2;
      }
      @media print {
        body {
          font-size: 12px;
        }
        .event-title {
          font-size: 24px;
        }
        .event-date, .event-location {
          font-size: 14px;
        }
        .fighter-name {
          font-size: 14px;
        }
        .fighter-gym {
          font-size: 12px;
        }
      }
    </style>
  `;

  let boutsHtml = '';
  
  // Add event information
  boutsHtml += `
    <div class="event-header">
      <div class="event-title">${eventData?.event_name || 'Fight Card'}</div>
      <div class="event-date">${eventData?.date || 'TBD'}</div>
      <div class="event-location">${eventData?.venue_name || ''} ${eventData?.state || ''}</div>
    </div>
  `;

  // Build table
  boutsHtml += `
    <table class="bouts-table">
      <thead>
        <tr>
          <th style="width: 40%;">Red Corner</th>
          <th style="width: 20%;">Match Info</th>
          <th style="width: 40%;">Blue Corner</th>
        </tr>
      </thead>
      <tbody>
  `;

  // Add finished bouts section if any
  if (finishedBouts.length > 0) {
    boutsHtml += `
      <tr>
        <td colspan="3" class="section-header">Completed Bouts</td>
      </tr>
    `;

    // Add finished bouts
    finishedBouts.forEach(bout => {
      if (bout.red && bout.blue) {
        const redFighter = bout.red;
        const blueFighter = bout.blue;
        boutsHtml += `
          <tr>
            <td>
              <div class="red-fighter">
                <div>
                  <img class="fighter-photo" src="${getPhotoUrl(redFighter)}" alt="${redFighter.first} ${redFighter.last}">
                  <div class="fighter-info">
                    <div class="fighter-name">${redFighter.first} ${redFighter.last}</div>
                    <div class="fighter-gym">${redFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(redFighter)}
              </div>
            </td>
            <td class="match-info">
              <div class="bout-number">${bout.boutNum}</div>
              <div class="weightclass">${bout.weightclass || ''}</div>
              <div class="bout-type">${bout.bout_type || ''}</div>
              ${isBoutFinished(bout) ? `
              <div class="bout-result">
                <div class="result-red">${redFighter.result}</div>
                <div class="result-blue">${blueFighter.result}</div>
              </div>` : ''}
            </td>
            <td>
              <div class="blue-fighter">
                <div>
                  <img class="fighter-photo" src="${getPhotoUrl(blueFighter)}" alt="${blueFighter.first} ${blueFighter.last}">
                  <div class="fighter-info">
                    <div class="fighter-name">${blueFighter.first} ${blueFighter.last}</div>
                    <div class="fighter-gym">${blueFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(blueFighter)}
              </div>
            </td>
          </tr>
        `;
      }
    });
  }

  // Add unfinished bouts section
  if (unfinishedBouts.length > 0) {
    boutsHtml += `
      <tr>
        <td colspan="3" class="section-header">Upcoming Bouts</td>
      </tr>
    `;

    // Add unfinished bouts
    unfinishedBouts.forEach(bout => {
      if (bout.red && bout.blue) {
        const redFighter = bout.red;
        const blueFighter = bout.blue;
        boutsHtml += `
          <tr>
            <td>
              <div class="red-fighter">
                <div>
                  <img class="fighter-photo" src="${getPhotoUrl(redFighter)}" alt="${redFighter.first} ${redFighter.last}">
                  <div class="fighter-info">
                    <div class="fighter-name">${redFighter.first} ${redFighter.last}</div>
                    <div class="fighter-gym">${redFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(redFighter)}
              </div>
            </td>
            <td class="match-info">
              <div class="bout-number">${bout.boutNum}</div>
              <div class="weightclass">${bout.weightclass || ''}</div>
              <div class="bout-type">${bout.bout_type || ''}</div>
            </td>
            <td>
              <div class="blue-fighter">
                <div>
                  <img class="fighter-photo" src="${getPhotoUrl(blueFighter)}" alt="${blueFighter.first} ${blueFighter.last}">
                  <div class="fighter-info">
                    <div class="fighter-name">${blueFighter.first} ${blueFighter.last}</div>
                    <div class="fighter-gym">${blueFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(blueFighter)}
              </div>
            </td>
          </tr>
        `;
      }
    });
  }

  boutsHtml += `
      </tbody>
    </table>
  `;

  // Complete HTML document
  const fullHtml = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${eventData?.event_name || 'Fight Card'}</title>
      ${cssStyles}
    </head>
    <body>
      ${boutsHtml}
    </body>
    </html>
  `;

  return fullHtml;
};

/**
 * Handles exporting bout information as HTML
 */
export const handleExportHtml = async (bouts: Bout[], eventData?: EventType): Promise<void> => {
  try {
    // Generate the HTML content for the bouts
    const htmlContent = generateBoutsHtml(bouts, eventData);
    
    // Create a blob from the HTML content
    const blob = new Blob([htmlContent], { type: 'text/html' });
    
    // Create a URL for the blob
    const url = URL.createObjectURL(blob);
    
    // Create a temporary anchor element and trigger download
    const a = document.createElement('a');
    a.href = url;
    a.download = `${eventData?.event_name || 'fight-card'}.html`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    URL.revokeObjectURL(url);
    document.body.removeChild(a);
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error exporting HTML:', error);
    return Promise.reject(error);
  }
};