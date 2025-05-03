import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase_techbouts/config';
import { RosterFighter, Bout, EventType } from '../types';


/**
 * Handles proper sequencing of boutNums within a specific day and ring
 * Can be used after deletion, creation, or any operation that might disrupt the sequence
 * 
 * @param bouts - Array of all bouts
 * @param dayNum - The day number to resequence
 * @param ringNum - The ring number to resequence
 * @param startingBoutNum - Optional starting bout number (defaults to 1)
 * @returns The resequenced array of bouts
 */
export const sequenceBouts = (
  bouts: Bout[],
  dayNum: number,
  ringNum: number,
  startingBoutNum: number = 1
): Bout[] => {
  console.log(`[SEQUENCE BOUTS] Starting to sequence bouts for day ${dayNum}, ring ${ringNum}`);
  console.log(`[SEQUENCE BOUTS] Total bouts before sequencing: ${bouts.length}`);
  
  // Separate bouts into those that need sequencing (matching day/ring) and others
  const boutsToSequence = bouts.filter(
    bout => bout.dayNum === dayNum && bout.ringNum === ringNum
  );
  
  const otherBouts = bouts.filter(
    bout => bout.dayNum !== dayNum || bout.ringNum !== ringNum
  );
  
  console.log(`[SEQUENCE BOUTS] Found ${boutsToSequence.length} bouts to sequence for day ${dayNum}, ring ${ringNum}`);
  console.log(`[SEQUENCE BOUTS] Other bouts not affected: ${otherBouts.length}`);
  
  if (boutsToSequence.length === 0) {
    console.log(`[SEQUENCE BOUTS] No bouts to sequence, returning original array`);
    return bouts;
  }
  
  // Sort the bouts by their current boutNum
  boutsToSequence.sort((a, b) => {
    const numA = typeof a.boutNum === 'number' ? a.boutNum : parseInt(String(a.boutNum));
    const numB = typeof b.boutNum === 'number' ? b.boutNum : parseInt(String(b.boutNum));
    return numA - numB;
  });
  
  // Resequence the boutNums and update boutIds
  const resequencedBouts = boutsToSequence.map((bout, index) => {
    const newBoutNum = startingBoutNum + index;
    const oldBoutNum = bout.boutNum;
    const sanctioning = bout.sanctioning || '';
    const promoterId = bout.promotionId;
    const eventId = bout.eventId;
    
    // Create a new boutId with the updated sequence number
    const newBoutId = `day${dayNum}ring${ringNum}bout${newBoutNum}${sanctioning}${promoterId}${eventId}`;
    
    // Log the change
    if (oldBoutNum !== newBoutNum) {
      console.log(`[SEQUENCE BOUTS] Resequencing bout: ${bout.red?.first} vs ${bout.blue?.first}`);
      console.log(`[SEQUENCE BOUTS] Old boutNum: ${oldBoutNum}, New boutNum: ${newBoutNum}`);
      console.log(`[SEQUENCE BOUTS] Old boutId: ${bout.boutId}`);
      console.log(`[SEQUENCE BOUTS] New boutId: ${newBoutId}`);
    }
    
    // Return a new bout object with updated boutNum and boutId
    return {
      ...bout,
      boutNum: newBoutNum,
      boutId: newBoutId
    };
  });
  
  // Combine the resequenced bouts with the other bouts
  const finalBouts = [...otherBouts, ...resequencedBouts];
  
  console.log(`[SEQUENCE BOUTS] Sequencing complete. Final bout count: ${finalBouts.length}`);
  
  // Verify no duplicates in the final array
  const finalBoutMap = new Map();
  let hasDuplicates = false;
  
  finalBouts.forEach(bout => {
    const key = `day${bout.dayNum}ring${bout.ringNum}bout${bout.boutNum}`;
    if (finalBoutMap.has(key)) {
      hasDuplicates = true;
      console.error(`[SEQUENCE BOUTS] Duplicate found in final array: ${key}`);
      console.error(`  First: ${finalBoutMap.get(key).red?.first} vs ${finalBoutMap.get(key).blue?.first}`);
      console.error(`  Second: ${bout.red?.first} vs ${bout.blue?.first}`);
    }
    finalBoutMap.set(key, bout);
  });
  
  if (hasDuplicates) {
    console.error("[SEQUENCE BOUTS] Duplicates detected in final array!");
  } else {
    console.log("[SEQUENCE BOUTS] No duplicates detected in final array");
  }
  
  return finalBouts;
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
  updateStatus, 
  saveMatches = false 
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
    
    let existingBouts: Bout[] = [];
    
    if (boutsDoc.exists()) {
      const data = boutsDoc.data();
      existingBouts = data.bouts || [];
    }
    
    // Find the highest bout number for the specific day and ring
    const highestBoutNum = existingBouts.reduce((highest, bout) => {
      if (bout.dayNum === dayNum && bout.ringNum === ringNum) {
        const boutNum = typeof bout.boutNum === 'number' ? bout.boutNum : parseInt(String(bout.boutNum));
        return Math.max(highest, boutNum);
      }
      return highest;
    }, 0);
    
    // If existing bouts are found, start new bouts after the highest existing bout number
    const actualStartingBoutNum = highestBoutNum > 0 ? highestBoutNum + 1 : startingBoutNum;
    
    reportStatus(`Found highest bout number ${highestBoutNum} for day ${dayNum}, ring ${ringNum}. Starting new bouts at ${actualStartingBoutNum}`);
    
    // Convert proposed matches to Bout objects with sequential bout numbers
    const newBouts: Bout[] = sortedMatches.map((match, index) => {
      const boutNum = actualStartingBoutNum + index;
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
    
    const combinedBouts = [...existingBouts, ...newBouts];
    
    // Make sure there are no duplicates or gaps in the sequence
    const finalBouts = sequenceBouts(combinedBouts, dayNum, ringNum, startingBoutNum);
    
    await setDoc(boutsRef, { bouts: finalBouts });
    
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

export const createMatchesFromWeightclasses = async ({
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
  updateStatus,
  saveMatches = false
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
  updateStatus?: (message: string) => void;
  saveMatches?: boolean;
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

    // Filter fighters with valid weightclass values
    const eligibleFighters = allFighters.filter(
      fighter => fighter.weightclass && fighter.weightclass > 0
    );

    reportStatus(`✅ Found ${eligibleFighters.length} fighters with valid weightclass values`);

    if (eligibleFighters.length === 0) {
      toast.error("No fighters with valid weightclass values found");
      reportStatus("❌ Error: No fighters with valid weightclass values found");
      setIsCreatingMatches(false);
      return { success: false, message: "No fighters with valid weightclass values", matches: [] };
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
      weightclass: number;
      isYouth: boolean;
    }[] = [];

    // Process each gender group
    let totalProcessed = 0;
    let matchesCreated = 0;
    let unmatchedTotal = 0;

    reportStatus("🔄 Beginning matching process by weightclass...");

    // Maximum allowed age difference for youth fighters (in months)
    const MAX_YOUTH_AGE_DIFF_MONTHS = 24;

    // Process each gender group separately
    Object.keys(fightersByGender).forEach(gender => {
      const fighters = fightersByGender[gender];
      reportStatus(`⚙️ Processing ${fighters.length} ${gender} fighters`);
      
      // Group fighters by weightclass
      const fightersByWeightclass: { [key: number]: RosterFighter[] } = {};
      
      fighters.forEach(fighter => {
        const weightclass = fighter.weightclass || 0;
        if (weightclass > 0) {
          if (!fightersByWeightclass[weightclass]) {
            fightersByWeightclass[weightclass] = [];
          }
          fightersByWeightclass[weightclass].push(fighter);
        }
      });
      
      reportStatus(`📊 Found ${Object.keys(fightersByWeightclass).length} different weightclasses`);
      
      // For each weightclass, match fighters
      Object.entries(fightersByWeightclass).forEach(([weightclassStr, fightersInClass]) => {
        const weightclass = parseInt(weightclassStr);
        
        reportStatus(`⚖️ Processing weightclass ${weightclass} with ${fightersInClass.length} fighters`);
        
        // We'll use this array to track which fighters have been matched
        const matched = new Array(fightersInClass.length).fill(false);
        
        // For each fighter
        for (let i = 0; i < fightersInClass.length; i++) {
          // Skip if this fighter is already matched
          if (matched[i]) continue;
          
          const fighter1 = fightersInClass[i];
          const fighter1IsYouth = isUnder18(fighter1.dob);
          const fighter1AgeMonths = calculateAgeInMonths(fighter1.dob);
          
          // Find the best match for this fighter
          let bestMatchIndex = -1;
          
          for (let j = i + 1; j < fightersInClass.length; j++) {
            // Skip if this potential opponent is already matched
            if (matched[j]) continue;
            
            const fighter2 = fightersInClass[j];
            const fighter2IsYouth = isUnder18(fighter2.dob);
            const fighter2AgeMonths = calculateAgeInMonths(fighter2.dob);
            
            // Both must be youth or both must be adults
            if (fighter1IsYouth !== fighter2IsYouth) continue;
            
            // If both are youth, check age difference
            if (fighter1IsYouth && fighter2IsYouth) {
              const ageDiffMonths = Math.abs(fighter1AgeMonths - fighter2AgeMonths);
              if (ageDiffMonths > MAX_YOUTH_AGE_DIFF_MONTHS) continue;
            }
            
            // We found a match within the same weightclass!
            bestMatchIndex = j;
            break;
          }
          
          // If we found a match
          if (bestMatchIndex !== -1) {
            const fighter2 = fightersInClass[bestMatchIndex];
            
            proposedMatches.push({
              red: fighter1,
              blue: fighter2,
              weightclass,
              isYouth: fighter1IsYouth
            });
            
            // Mark both fighters as matched
            matched[i] = true;
            matched[bestMatchIndex] = true;
            
            matchesCreated++;
            
            reportStatus(`🤼 Created match: ${fighter1.first} ${fighter1.last} vs ${fighter2.first} ${fighter2.last} at ${weightclass}lbs`);
          }
        }
        
        // Count unmatched fighters in this weightclass
        const unmatchedInClass = matched.filter(m => !m).length;
        unmatchedTotal += unmatchedInClass;
        
        if (unmatchedInClass > 0) {
          reportStatus(`⚠️ ${unmatchedInClass} fighters unmatched in weightclass ${weightclass}`);
        }
      });
      
      reportStatus(`✅ Created ${matchesCreated - totalProcessed} ${gender} matches`);
      totalProcessed = matchesCreated;
    });

    // Final report
    reportStatus(`📊 Match creation summary: ${matchesCreated} matches created by weightclass, ${unmatchedTotal} fighters unmatched`);
    
    if (proposedMatches.length === 0) {
      reportStatus("⚠️ No matches could be created with the current criteria");
      return { 
        success: false, 
        message: "No matches could be created with the current criteria", 
        matches: [] 
      };
    }

    // Sort matches - youth first, then by weightclass (lightest first)
    const sortedMatches = [...proposedMatches].sort((a, b) => {
      // Youth matches come first
      if (a.isYouth && !b.isYouth) return -1;
      if (!a.isYouth && b.isYouth) return 1;
      
      // For matches of the same youth status, sort by weightclass (lightest first)
      return a.weightclass - b.weightclass;
    });
    
    reportStatus(`🔄 Sorted ${sortedMatches.length} matches by youth status and weightclass`);
    
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
      
      let existingBouts: Bout[] = [];
      
      if (boutsDoc.exists()) {
        const data = boutsDoc.data();
        existingBouts = data.bouts || [];
      }
      
      // Find the highest bout number for the specific day and ring
      const highestBoutNum = existingBouts.reduce((highest, bout) => {
        if (bout.dayNum === dayNum && bout.ringNum === ringNum) {
          const boutNum = typeof bout.boutNum === 'number' ? bout.boutNum : parseInt(String(bout.boutNum));
          return Math.max(highest, boutNum);
        }
        return highest;
      }, 0);
      
      // If existing bouts are found, start new bouts after the highest existing bout number
      const actualStartingBoutNum = highestBoutNum > 0 ? highestBoutNum + 1 : startingBoutNum;
      
      reportStatus(`Found highest bout number ${highestBoutNum} for day ${dayNum}, ring ${ringNum}. Starting new bouts at ${actualStartingBoutNum}`);
      
      // Convert proposed matches to Bout objects with sequential bout numbers
      const newBouts: Bout[] = sortedMatches.map((match, index) => {
        const boutNum = actualStartingBoutNum + index;
        return {
          weightclass: match.weightclass, // Use the actual weightclass
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
      
      const combinedBouts = [...existingBouts, ...newBouts];
      
      // Make sure there are no duplicates or gaps in the sequence
      const finalBouts = sequenceBouts(combinedBouts, dayNum, ringNum, startingBoutNum);
      
      await setDoc(boutsRef, { bouts: finalBouts });
      
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
    console.error("Error creating matches from weightclasses:", error);
    toast.error("Failed to create matches from weightclasses");
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

export const moveBout = async ({
  newBoutNum,    
  originalBoutNum,    
  ringNum,
  dayNum,
  promoterId,
  eventId,
  existingBoutId,
}: {
  newBoutNum: number;
  originalBoutNum: number; 
  ringNum: number;
  dayNum: number;
  promoterId: string;
  eventId: string;
  existingBoutId: string;
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
    const originalBouts: Bout[] = [...(data.bouts || [])];
    
    // Log the original bouts array
    console.log(`[MOVE BOUT] Original bouts JSON:`, JSON.stringify(originalBouts, null, 2));
    console.log(`[MOVE BOUT] Starting move operation. Original bouts: ${originalBouts.length}`);
    
    if (originalBouts.length === 0) {
      toast.error("No bouts found to reorder.");
      return false;
    }
    
    // IMPORTANT: Identify any duplicate boutNums in the original data before we start
    const boutsWithSameNum = new Map();
    originalBouts.forEach(bout => {
      const key = `day${bout.dayNum}ring${bout.ringNum}bout${bout.boutNum}`;
      if (!boutsWithSameNum.has(key)) {
        boutsWithSameNum.set(key, []);
      }
      boutsWithSameNum.get(key).push(bout.boutId);
    });
    
    // Log any duplicates found in the original data
    boutsWithSameNum.forEach((boutIds, key) => {
      if (boutIds.length > 1) {
        console.error(`⚠️ ORIGINAL DATA HAS DUPLICATES! Key ${key} has ${boutIds.length} bouts: ${boutIds.join(', ')}`);
      }
    });
    
    // Find the bout to move
    let boutToMove: Bout | undefined;
    if (existingBoutId) {
      boutToMove = originalBouts.find(bout => bout.boutId === existingBoutId);
      
      if (!boutToMove) {
        toast.error(`Could not find bout with ID ${existingBoutId}`);
        return false;
      }
      
      // Log the bout being moved
      console.log(`[MOVE BOUT] Bout being moved:`, JSON.stringify(boutToMove, null, 2));
      console.log(`[MOVE BOUT] Moving bout: ${boutToMove.red?.first} vs ${boutToMove.blue?.first} (Originally at position ${originalBoutNum}, moving to ${newBoutNum})`);
    }
    
    // CRITICAL FIX: Completely separate the bouts
    // 1. Create a NEW array with ALL bouts EXCEPT the one being moved
    const boutsWithoutMoved = originalBouts.filter(bout => 
      !existingBoutId || bout.boutId !== existingBoutId
    );
    
    // 2. Separate by day/ring
    const sameDayRingBouts = boutsWithoutMoved.filter(
      bout => bout.dayNum === dayNum && bout.ringNum === ringNum
    );
    
    const otherBouts = boutsWithoutMoved.filter(
      bout => bout.dayNum !== dayNum || bout.ringNum !== ringNum
    );
    
    // 3. Sort the bouts in the same day/ring by their current boutNum
    sameDayRingBouts.sort((a, b) => {
      const numA = typeof a.boutNum === 'number' ? a.boutNum : parseInt(String(a.boutNum));
      const numB = typeof b.boutNum === 'number' ? b.boutNum : parseInt(String(b.boutNum));
      return numA - numB;
    });
    
    // 4. Calculate insertion point ensuring it's within bounds
    let targetPosition = Math.max(1, Math.min(sameDayRingBouts.length + 1, newBoutNum));
    console.log(`[MOVE BOUT] Target position for insertion: ${targetPosition} (boutNum=${newBoutNum})`);
    
    // Find and log the bout at the target position (if any)
    if (targetPosition <= sameDayRingBouts.length) {
      const boutAtTargetPosition = sameDayRingBouts[targetPosition - 1];
      console.log(`[MOVE BOUT] Bout at target position ${targetPosition}:`, JSON.stringify(boutAtTargetPosition, null, 2));
      console.log(`[MOVE BOUT] This bout will be shifted: ${boutAtTargetPosition.red?.first} vs ${boutAtTargetPosition.blue?.first}`);
    } else {
      console.log(`[MOVE BOUT] No bout at target position ${targetPosition} - will append to end`);
    }
    
    // 5. Create a new array for the reordered bouts
    const reorderedBouts = [...sameDayRingBouts];
    
    // 6. Insert the bout at the specified position if we're moving one
    if (boutToMove) {
      reorderedBouts.splice(targetPosition - 1, 0, {
        ...boutToMove,
        dayNum,
        ringNum
      });
      console.log(`[MOVE BOUT] Inserted bout at position ${targetPosition}`);
    }
    
    // 7. Resequence ALL bouts in this day/ring with NEW boutNum and NEW boutId
    console.log(`[MOVE BOUT] All updated boutNums after resequencing:`);
    
    const resequencedBouts = reorderedBouts.map((bout, index) => {
      // Calculate the new boutNum (1-based) and create a new boutId
      const newBoutNum = index + 1;
      const sanctioning = bout.sanctioning || '';
      const newBoutId = `day${dayNum}ring${ringNum}bout${newBoutNum}${sanctioning}${promoterId}${eventId}`;
      
      const oldBoutNum = bout.boutNum;
      const isMovedBout = bout.boutId === existingBoutId || 
                          (bout.red?.first === boutToMove?.red?.first && 
                           bout.blue?.first === boutToMove?.blue?.first);
      
      // Log each bout's resequencing info
      if (isMovedBout) {
        console.log(`[MOVE BOUT] 🟢 MOVED: ${bout.red?.first} vs ${bout.blue?.first}, old=${oldBoutNum}, new=${newBoutNum}`);
      } else if (newBoutNum >= targetPosition) {
        console.log(`[MOVE BOUT] 🔼 SHIFTED: ${bout.red?.first} vs ${bout.blue?.first}, old=${oldBoutNum}, new=${newBoutNum}`);
      } else {
        console.log(`[MOVE BOUT] ⬜ UNCHANGED: ${bout.red?.first} vs ${bout.blue?.first}, old=${oldBoutNum}, new=${newBoutNum}`);
      }
      
      // Log the ID change
      console.log(`   [BOUT ID] old: ${bout.boutId}`);
      console.log(`   [BOUT ID] new: ${newBoutId}`);
      
      // Create a completely new bout object to avoid any reference issues
      return {
        ...bout,
        boutNum: newBoutNum,
        boutId: newBoutId
      };
    });
    
    // 8. Create the final array with other bouts and resequenced bouts
    const finalBouts = [...otherBouts, ...resequencedBouts];
    
    // 9. Verify there are no duplicates in our final array
    const finalBoutMap = new Map();
    let hasDuplicates = false;
    
    finalBouts.forEach(bout => {
      const key = `day${bout.dayNum}ring${bout.ringNum}bout${bout.boutNum}`;
      if (finalBoutMap.has(key)) {
        hasDuplicates = true;
        console.error(`Duplicate found in FINAL array: ${key}`);
        console.error(`  First: ${finalBoutMap.get(key).red?.first} vs ${finalBoutMap.get(key).blue?.first}`);
        console.error(`  Second: ${bout.red?.first} vs ${bout.blue?.first}`);
      }
      finalBoutMap.set(key, bout);
    });
    
    if (hasDuplicates) {
      console.error("[MOVE BOUT] Duplicates detected in final array, aborting save");
      toast.error("Error: Duplicate bout numbers detected");
      return false;
    }
    
    // 10. Verify that count is preserved when moving a bout
    if (existingBoutId && finalBouts.length !== originalBouts.length) {
      console.error(`[MOVE BOUT] Count mismatch: Original=${originalBouts.length}, Final=${finalBouts.length}`);
      toast.error("Error: Bout count mismatch");
      return false;
    }
    
    // 11. COMPLETELY REPLACE the bouts array in the document
    console.log(`[MOVE BOUT] Saving ${finalBouts.length} bouts with COMPLETE replacement`);
    
    try {
      // Use set with { merge: false } to completely replace the document
      await setDoc(boutsRef, { bouts: finalBouts });
      console.log("[MOVE BOUT] Successfully saved resequenced bouts");
      toast.success("Bout order updated successfully");
      return true;
    } catch (saveError) {
      console.error("[MOVE BOUT] Error saving bouts:", saveError);
      toast.error("Failed to save bout order");
      return false;
    }
  } catch (error) {
    console.error("[MOVE BOUT] Error in moveBout function:", error);
    toast.error("Failed to rearrange bout");
    return false;
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
    
    if (!boutToDelete) {
      toast.error(`Bout ID ${boutId} not found`);
      return;
    }
    
    console.log("🗑️ Deleting bout:", boutToDelete);

    // Filter out the bout to delete
    const updatedBouts = existingBouts.filter((b) => b.boutId !== boutId);
    console.log("✅ Updated bouts after deletion:", updatedBouts);

    // Get the day and ring number from the bout being deleted
    const dayNum = boutToDelete.dayNum;
    const ringNum = boutToDelete.ringNum;

    // Resequence the bouts in the same day and ring
    const resequencedBouts = sequenceBouts(updatedBouts, dayNum, ringNum);

    // Only update the bouts field
    await setDoc(boutsRef, { bouts: resequencedBouts }, { merge: true });
    toast.success(`Bout ${boutId} deleted and bout order resequenced successfully`);
  } catch (error) {
    console.error("Error deleting bout:", error);
    toast.error("Failed to delete bout");
  }
};


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









/////////////////////////////////////////////////
/////////////////////////////////////////////////

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
    
    console.log(`[EDIT BOUT] Editing bout: ${bout.red?.first} vs ${bout.blue?.first}`);
    console.log(`[EDIT BOUT] Original boutNum: ${originalBoutNum}, New boutNum: ${bout.boutNum}`);
    console.log(`[EDIT BOUT] BoutId: ${bout.boutId}`);
    console.log(`[EDIT BOUT] Found at index: ${index}`);

    // Check if bout number has changed and there might be conflicts
    if (originalBoutNum !== undefined && bout.boutNum !== originalBoutNum) {
      console.log(`[EDIT BOUT] Bout number changed from ${originalBoutNum} to ${bout.boutNum}. Moving bout...`);
      
      // Store the fighters for identification after move
      const redFighterId = bout.red?.fighter_id;
      const blueFighterId = bout.blue?.fighter_id;
      
      const moveSuccess = await moveBout({
        newBoutNum: bout.boutNum,
        originalBoutNum: originalBoutNum,
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
      
      // After moveBout, the bout has a new ID. We don't need to perform additional updates
      // as the moveBout function already handles the complete replacement.
      console.log(`[EDIT BOUT] Bout successfully moved. Not performing additional updates.`);
      return;
    }

    // Get fresh data (needed for the case where we didn't move the bout)
    const updatedBoutsDoc = await getDoc(boutsRef);
    const updatedData = updatedBoutsDoc.data();
    const updatedBouts: Bout[] = updatedData?.bouts || [];

    // Find index again
    const updatedIndex = updatedBouts.findIndex((b) => b.boutId === bout.boutId);
    console.log(`[EDIT BOUT] Updated index after getting fresh data: ${updatedIndex}`);
    
    if (updatedIndex === -1) {
      // We couldn't find the bout by its ID
      console.log(`[EDIT BOUT] Bout ID ${bout.boutId} not found in updated data`);
      
      // Check if we can find the bout by fighter IDs instead
      const redFighterId = bout.red?.fighter_id;
      const blueFighterId = bout.blue?.fighter_id;
      
      const fighterMatchIndex = updatedBouts.findIndex(b => 
        (b.red?.fighter_id === redFighterId) && 
        (b.blue?.fighter_id === blueFighterId)
      );
      
      if (fighterMatchIndex !== -1) {
        console.log(`[EDIT BOUT] Found matching bout by fighter IDs at index ${fighterMatchIndex}`);
        console.log(`[EDIT BOUT] Using found bout ID: ${updatedBouts[fighterMatchIndex].boutId}`);
        
        // Update the matched bout instead of adding a new one
        updatedBouts[fighterMatchIndex] = {
          ...bout,
          // Keep the correct boutId and boutNum from the database
          boutId: updatedBouts[fighterMatchIndex].boutId,
          boutNum: updatedBouts[fighterMatchIndex].boutNum
        };
        
        await setDoc(boutsRef, { bouts: updatedBouts });
        toast.success("Bout updated successfully");
        return;
      }
      
      // If no match was found, this is likely a new bout
      console.log(`[EDIT BOUT] No matching fighters found. Treating as a new bout.`);
      
      // Check for duplicate boutNum in same day/ring
      const sameDayRingBouts = updatedBouts.filter(
        b => b.dayNum === bout.dayNum && b.ringNum === bout.ringNum
      );
      
      const existingBoutWithSameNum = sameDayRingBouts.find(
        b => b.boutNum === bout.boutNum
      );
      
      if (existingBoutWithSameNum) {
        console.log(`[EDIT BOUT] Found existing bout with same number ${bout.boutNum}`);
        
        // Generate a new unique boutNum at the end
        const highestBoutNum = Math.max(...sameDayRingBouts.map(b => 
          typeof b.boutNum === 'number' ? b.boutNum : parseInt(String(b.boutNum))
        ), 0);
        
        const newBoutNum = highestBoutNum + 1;
        console.log(`[EDIT BOUT] Assigning new boutNum: ${newBoutNum}`);
        
        // Generate a new boutId
        const sanctioning = bout.sanctioning || '';
        const newBoutId = `day${bout.dayNum}ring${bout.ringNum}bout${newBoutNum}${sanctioning}${promoterId}${eventId}`;
        
        // Add the bout with new boutNum and boutId
        await setDoc(boutsRef, { 
          bouts: [...updatedBouts, {
            ...bout,
            boutNum: newBoutNum,
            boutId: newBoutId
          }] 
        });
      } else {
        // No conflicts, add the bout as is
        await setDoc(boutsRef, { bouts: [...updatedBouts, bout] });
      }
    } else {
      // Update the bout at its existing position
      updatedBouts[updatedIndex] = bout;
      await setDoc(boutsRef, { bouts: updatedBouts });
    }
    
    console.log(`[EDIT BOUT] Bout update completed successfully`);
    toast.success("Bout updated successfully");
    
    // Perform a verification check for duplicates
    const verifyDoc = await getDoc(boutsRef);
    if (verifyDoc.exists()) {
      const verifyData = verifyDoc.data();
      const verifyBouts: Bout[] = verifyData.bouts || [];
      
      // Check for duplicates by fighter pair
      const pairMap = new Map();
      let hasDuplicates = false;
      
      verifyBouts.forEach(b => {
        const redId = b.red?.fighter_id;
        const blueId = b.blue?.fighter_id ;
        const key = `${redId}_vs_${blueId}`;
        
        if (pairMap.has(key)) {
          hasDuplicates = true;
          console.error(`[EDIT BOUT] ⚠️ Found duplicate after save: ${b.red?.first} vs ${b.blue?.first}`);
          console.error(`[EDIT BOUT] First bout: ${pairMap.get(key).boutId}, second bout: ${b.boutId}`);
        }
        
        pairMap.set(key, b);
      });
      
      if (hasDuplicates) {
        console.error(`[EDIT BOUT] Duplicates detected after save! Manual cleanup may be needed.`);
        toast.warning("Bout updated, but duplicates exist. Please check the bout list.");
      }
    }
  } catch (error) {
    console.error("[EDIT BOUT] Error editing bout:", error);
    toast.error("Failed to edit bout");
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


export const getPhotoUrl = (fighter: RosterFighter, defaultPhotoUrl: string = "https://www.techbouts.com/images/techbouts_fighter_icon.png"): string => {
  return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
};


export const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '...';
  }
  return text;
};

/**
 * Generates HTML content for a bout card optimized for Squarespace pasting
 */
export const generateBoutsHtml = (bouts: Bout[], eventData?: EventType) => {
  // Separate bouts into finished and unfinished
  const finishedBouts = bouts.filter(bout => isBoutFinished(bout));
  const unfinishedBouts = bouts.filter(bout => !isBoutFinished(bout));
  
  // Squarespace-friendly CSS using inline styles and simple class names
  const cssStyles = `
    <style>
      .tb-event-header {
        text-align: center;
        margin-bottom: 30px;
      }
      .tb-event-title {
        font-size: 28px;
        font-weight: bold;
      }
      .tb-event-date {
        font-size: 18px;
        color: #666;
      }
      .tb-event-location {
        font-size: 16px;
        color: #666;
        margin-bottom: 10px;
      }
      .tb-bouts-table {
        width: 100%;
        border-collapse: collapse;
        margin-top: 20px;
      }
      .tb-bouts-table th {
        background-color: #f0f0f0;
        padding: 12px;
        text-align: center;
        border: 1px solid #ddd;
      }
      .tb-bouts-table td {
        padding: 12px;
        border: 1px solid #ddd;
        vertical-align: top;
      }
      .tb-bout-number {
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
      .tb-section-header {
        background-color: #e9e9e9;
        text-align: center;
        font-weight: bold;
        padding: 8px;
      }
      .tb-red-fighter {
        position: relative;
        display: flex;
        align-items: flex-start;
      }
      .tb-blue-fighter {
        position: relative;
        display: flex;
        align-items: flex-start;
        justify-content: flex-end;
        text-align: right;
      }
      .tb-fighter-photo {
        width: 60px;
        height: 60px;
        border-radius: 6px;
        object-fit: cover;
      }
      .tb-fighter-info {
        margin: 0 10px;
      }
      .tb-fighter-name {
        font-weight: bold;
        font-size: 16px;
      }
      .tb-fighter-gym {
        color: #666;
        font-size: 14px;
      }
      .tb-fighter-stats {
        font-size: 12px;
        color: #555;
        position: absolute;
        top: 0;
      }
      .tb-fighter-stats-left {
        right: 0;
      }
      .tb-fighter-stats-right {
        left: 0;
      }
      .tb-match-info {
        text-align: center;
      }
      .tb-weightclass {
        margin-bottom: 5px;
      }
      .tb-bout-type {
        margin-bottom: 5px;
      }
      .tb-bout-result {
        font-weight: bold;
        margin-top: 10px;
      }
      .tb-result-red {
        color: #d32f2f;
      }
      .tb-result-blue {
        color: #1976d2;
      }
      .tb-stats-table {
        border-collapse: collapse;
        line-height: 0.8;
        font-size: 12px;
      }
      .tb-stats-label {
        opacity: 0.7;
        width: 40px;
        text-align: center;
        padding: 0;
      }
      .tb-stats-value {
        text-align: center;
        padding: 0 0 0 2px;
      }
    </style>
  `;

  const generateFighterStatsHtml = (fighter: RosterFighter, align: 'left' | 'right') => {
    const alignClass = align === 'left' ? 'tb-fighter-stats-left' : 'tb-fighter-stats-right';
    
    return `
      <div class="tb-fighter-stats ${alignClass}">
        <table class="tb-stats-table">
          <tbody>
            <tr>
              <td class="tb-stats-label">YRS:</td>
              <td class="tb-stats-value">${fighter.years_exp || '-'}</td>
            </tr>
            ${(fighter.mt_win > 0 || fighter.mt_loss > 0) ? `
            <tr>
              <td class="tb-stats-label">MT:</td>
              <td class="tb-stats-value">${fighter.mt_win}-${fighter.mt_loss}</td>
            </tr>` : ''}
            ${(fighter.mma_win > 0 || fighter.mma_loss > 0) ? `
            <tr>
              <td class="tb-stats-label">MMA:</td>
              <td class="tb-stats-value">${fighter.mma_win}-${fighter.mma_loss}</td>
            </tr>` : ''}
            ${(fighter.pmt_win > 0 || fighter.pmt_loss > 0) ? `
            <tr>
              <td class="tb-stats-label">PMT:</td>
              <td class="tb-stats-value">${fighter.pmt_win}-${fighter.pmt_loss}</td>
            </tr>` : ''}
            ${(fighter.pb_win > 0 || fighter.pb_loss > 0) ? `
            <tr>
              <td class="tb-stats-label">PBSC:</td>
              <td class="tb-stats-value">${fighter.pb_win}-${fighter.pb_loss}</td>
            </tr>` : ''}
          </tbody>
        </table>
      </div>
    `;
  };
  
  // Create a single div container for Squarespace
  let boutsHtml = '<div class="techbouts-card-container">';
  
  // Add the CSS
  boutsHtml += cssStyles;
  
  // Add event information
  boutsHtml += `
    <div class="tb-event-header">
      <div class="tb-event-title">${eventData?.event_name || 'Fight Card'}</div>
      <div class="tb-event-date">${eventData?.date || 'TBD'}</div>
      <div class="tb-event-location">${eventData?.venue_name || ''} ${eventData?.state || ''}</div>
    </div>
  `;

  // Build table
  boutsHtml += `
    <table class="tb-bouts-table">
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
        <td colspan="3" class="tb-section-header">Completed Bouts</td>
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
              <div class="tb-red-fighter">
                <div>
                  <img class="tb-fighter-photo" src="${getPhotoUrl(redFighter)}" alt="${redFighter.first} ${redFighter.last}">
                  <div class="tb-fighter-info">
                    <div class="tb-fighter-name">${redFighter.first} ${redFighter.last}</div>
                    <div class="tb-fighter-gym">${redFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(redFighter, 'left')}
              </div>
            </td>
            <td class="tb-match-info">
              <div class="tb-bout-number">${bout.boutNum}</div>
              <div class="tb-weightclass">${bout.weightclass || ''}</div>
              <div class="tb-bout-type">${bout.bout_type || ''}</div>
              ${isBoutFinished(bout) ? `
              <div class="tb-bout-result">
                <div class="tb-result-red">${redFighter.result}</div>
                <div class="tb-result-blue">${blueFighter.result}</div>
              </div>` : ''}
            </td>
            <td>
              <div class="tb-blue-fighter">
                <div>
                  <img class="tb-fighter-photo" src="${getPhotoUrl(blueFighter)}" alt="${blueFighter.first} ${blueFighter.last}">
                  <div class="tb-fighter-info">
                    <div class="tb-fighter-name">${blueFighter.first} ${blueFighter.last}</div>
                    <div class="tb-fighter-gym">${blueFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(blueFighter, 'right')}
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
        <td colspan="3" class="tb-section-header">Upcoming Bouts</td>
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
              <div class="tb-red-fighter">
                <div>
                  <img class="tb-fighter-photo" src="${getPhotoUrl(redFighter)}" alt="${redFighter.first} ${redFighter.last}">
                  <div class="tb-fighter-info">
                    <div class="tb-fighter-name">${redFighter.first} ${redFighter.last}</div>
                    <div class="tb-fighter-gym">${redFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(redFighter, 'left')}
              </div>
            </td>
            <td class="tb-match-info">
              <div class="tb-bout-number">${bout.boutNum}</div>
              <div class="tb-weightclass">${bout.weightclass || ''}</div>
              <div class="tb-bout-type">${bout.bout_type || ''}</div>
            </td>
            <td>
              <div class="tb-blue-fighter">
                <div>
                  <img class="tb-fighter-photo" src="${getPhotoUrl(blueFighter)}" alt="${blueFighter.first} ${blueFighter.last}">
                  <div class="tb-fighter-info">
                    <div class="tb-fighter-name">${blueFighter.first} ${blueFighter.last}</div>
                    <div class="tb-fighter-gym">${blueFighter.gym || ''}</div>
                  </div>
                </div>
                ${generateFighterStatsHtml(blueFighter, 'right')}
              </div>
            </td>
          </tr>
        `;
      }
    });
  }

  // Close the table and container div
  boutsHtml += `
      </tbody>
    </table>
  </div>`;

  return boutsHtml;
};

/**
 * Handles exporting bout information as HTML for Squarespace
 */
export const handleExportHtml = async (bouts: Bout[], eventData?: EventType): Promise<void> => {
  try {
    // Generate the HTML content for the bouts
    const htmlContent = generateBoutsHtml(bouts, eventData);
    
    // Copy the HTML content to clipboard
    await navigator.clipboard.writeText(htmlContent);
    
    // Provide a success message
    toast.success("HTML copied to clipboard! Ready to paste into Squarespace Code Block.");
    
    return Promise.resolve();
  } catch (error) {
    console.error('Error copying HTML to clipboard:', error);
    toast.error("Failed to copy HTML to clipboard. Please try again.");
    
    // Fallback method if clipboard API fails
    try {
      // Create a temporary textarea element
      const textarea = document.createElement('textarea');
      textarea.value = generateBoutsHtml(bouts, eventData);
      
      // Make the textarea out of viewport
      textarea.style.position = 'fixed';
      textarea.style.left = '-999999px';
      textarea.style.top = '-999999px';
      document.body.appendChild(textarea);
      
      // Select and copy the content
      textarea.focus();
      textarea.select();
      document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textarea);
      toast.success("HTML copied to clipboard using fallback method!");
      
      return Promise.resolve();
    } catch (fallbackError) {
      console.error('Fallback clipboard copy failed:', fallbackError);
      toast.error("All clipboard copy methods failed. Please try another approach.");
      return Promise.reject(fallbackError);
    }
  }
};



