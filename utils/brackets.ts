import { Bout, RosterFighter } from '@/utils/types';

/**
 * Determines if a bout is finished based on fighter results
 * @param bout The bout to check
 * @returns boolean indicating if the bout is finished
 */
export const isBoutFinished = (bout: Bout): boolean => {
  if (!bout.red || !bout.blue) return false;
  
  // Check if either fighter has a result
  return Boolean(bout.red.result || bout.blue.result);
};

/**
 * Checks if a bout is part of a bracket
 * @param bout The bout to check
 * @returns boolean indicating if the bout is a bracket bout
 */
export const isBracketBout = (bout: Bout): boolean => {
  return Boolean(
    bout.bracket_bout_type && 
    ['semifinal', 'final', 'quarterfinal'].includes(bout.bracket_bout_type)
  );
};

/**
 * Checks if bouts array contains a final bout
 * @param bouts Array of bouts to check
 * @returns boolean indicating if there's a final bout
 */
export const hasFinalBout = (bouts: Bout[]): boolean => {
  return bouts.some(bout => bout.bracket_bout_type === 'final');
};

/**
 * Finds the bout number for a specific semifinal or quarterfinal bout
 * @param bracketFighters Array of fighter IDs in the bracket
 * @param allBouts All bouts in the event
 * @param position Position to find (1 for first semifinal, 2 for second semifinal)
 * @returns Bout number as a string or undefined if not found
 */
export const findBracketBoutNumber = (
  bracketFighters: Array<{fighter_id: string}>,
  allBouts: Bout[],
  position: number
): string | undefined => {
  // For 4-fighter bracket, position 1 = first semifinal, position 2 = second semifinal
  if (bracketFighters.length === 4) {
    const targetIndices = position === 1 ? [0, 1] : [2, 3];
    
    // Find the bout that contains the two fighters at the specified positions
    const foundBout = allBouts.find(bout => {
      if (!bout.red || !bout.blue) return false;
      
      const redId = bout.red.fighter_id;
      const blueId = bout.blue.fighter_id;
      
      return (
        (redId === bracketFighters[targetIndices[0]]?.fighter_id && 
         blueId === bracketFighters[targetIndices[1]]?.fighter_id) ||
        (blueId === bracketFighters[targetIndices[0]]?.fighter_id && 
         redId === bracketFighters[targetIndices[1]]?.fighter_id)
      );
    });
    
    return foundBout?.boutNum !== undefined ? String(foundBout.boutNum) : undefined;
  }
  
  // For 8-fighter bracket, positions 1-4 represent the four quarterfinals
  if (bracketFighters.length === 8) {
    const targetIndices = 
      position === 1 ? [0, 1] : 
      position === 2 ? [2, 3] : 
      position === 3 ? [4, 5] : 
      [6, 7];
    
    const foundBout = allBouts.find(bout => {
      if (!bout.red || !bout.blue) return false;
      
      const redId = bout.red.fighter_id;
      const blueId = bout.blue.fighter_id;
      
      return (
        (redId === bracketFighters[targetIndices[0]]?.fighter_id && 
         blueId === bracketFighters[targetIndices[1]]?.fighter_id) ||
        (blueId === bracketFighters[targetIndices[0]]?.fighter_id && 
         redId === bracketFighters[targetIndices[1]]?.fighter_id)
      );
    });
    
    return foundBout?.boutNum !== undefined ? String(foundBout.boutNum) : undefined;
  }
  
  return undefined;
};

/**
 * Finds the bout number that contains fighters at specific positions in the bracket_bout_fighters array
 * @param bracketFighters Array of fighter IDs in the bracket
 * @param allBouts All bouts in the event
 * @param redPosition Index position in the bracketFighters array for the red fighter (0-based)
 * @param bluePosition Index position in the bracketFighters array for the blue fighter (0-based)
 * @returns Bout number as a string or "TBD" if not found
 */
export const findBoutNumberByFighterPositions = (
  bracketFighters: Array<{fighter_id: string}>,
  allBouts: Bout[],
  redPosition: number = 0,
  bluePosition: number = 2
): string => {
  if (!bracketFighters || bracketFighters.length === 0 || !allBouts) {
    return "TBD";
  }
  
  // Get the fighter IDs at the specified positions
  const redFighterId = bracketFighters[redPosition]?.fighter_id;
  const blueFighterId = bracketFighters[bluePosition]?.fighter_id;
  
  // If either fighter ID is missing, return TBD
  if (!redFighterId || !blueFighterId) {
    return "TBD";
  }
  
  // Find the bout that contains both fighters
  const foundBout = allBouts.find(bout => {
    if (!bout.red || !bout.blue) return false;
    
    const boutRedId = bout.red.fighter_id;
    const boutBlueId = bout.blue.fighter_id;
    
    // Check if this bout has the two fighters we're looking for
    return (
      (boutRedId === redFighterId && boutBlueId === blueFighterId) ||
      (boutRedId === blueFighterId && boutBlueId === redFighterId)
    );
  });
  
  return foundBout?.boutNum ? String(foundBout.boutNum) : "TBD";
};

/**
 * Finds the bout number for the red corner in the final bout
 * @param bracketFighters Array of fighter IDs in the bracket
 * @param allBouts All bouts in the event
 * @returns Bout number as a string or "TBD" if not found
 */
export const findBoutNumRedFinal = (
  bracketFighters: Array<{fighter_id: string}>,
  allBouts: Bout[]
): string => {
  // For 3-fighter bracket, semifinal is between positions 0 and 1
  if (bracketFighters.length === 3) {
    return findBoutNumberByFighterPositions(bracketFighters, allBouts, 0, 1);
  }
  
  // For 4+ fighter bracket, red corner in final comes from first semifinal (positions 0 and 2)
  return findBoutNumberByFighterPositions(bracketFighters, allBouts, 0, 2);
};



/**
 * Finds the bout number for the blue corner in the final bout
 * @param bracketFighters Array of fighter IDs in the bracket
 * @param allBouts All bouts in the event
 * @returns Bout number as a string or "TBD" if not found
 */
export const findBoutNumBlueFinal = (
  bracketFighters: Array<{fighter_id: string}>,
  allBouts: Bout[]
): string => {
  // Blue corner in final comes from second semifinal (positions 1 and 3)
  return findBoutNumberByFighterPositions(bracketFighters, allBouts, 1, 3);
};

/**
 * Gets the text to display for a semifinal winner (for final bout display)
 * @param bracketFighters Array of fighter IDs in the bracket
 * @param allBouts All bouts in the event
 * @param semifinalPosition Which semifinal (1 or 2)
 * @returns Text to display
 */
export const getSemifinalWinnerText = (
  bracketFighters: Array<{fighter_id: string}>,
  allBouts: Bout[],
  semifinalPosition: number
): string => {
  const boutNum = findBracketBoutNumber(bracketFighters, allBouts, semifinalPosition);
  
  if (!boutNum) {
    return `SF${semifinalPosition}`;
  }
  
  return `Bout ${boutNum}`;
};