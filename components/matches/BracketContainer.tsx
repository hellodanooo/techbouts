// components/matches/BracketContainer.tsx

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Bout, RosterFighter, Bracket } from '@/utils/types';
import { Trophy, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ByeBracketDisplay } from '@/components/matches/ByeBracketDisplay';
import { FullBracketDisplay } from '@/components/matches/FullBracketDisplay';
import { TbTournament } from "react-icons/tb";
import { findBoutNumberByFighterPositions } from '@/utils/brackets';


// Modal component for bracket display
export const BracketModal = ({ 
  isOpen, 
  onClose, 
  children 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children: React.ReactNode 
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Tournament Bracket</h3>
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={onClose} 
            className="h-8 w-8 p-0 rounded-full"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        <div className="mt-2">
          {children}
        </div>
      </div>
    </div>
  );
};

// Utility functions for bracket operations
// Calculate the number of fighters in bracket bouts
export const calculateBracketFighters = (bracketBouts: Bout[]): number => {
  if (!bracketBouts || bracketBouts.length === 0) return 0;
  
  // Create a set to track unique fighters
  const uniqueFighters = new Set<string>();
  
  // Loop through each bout and add fighters to the set
  bracketBouts.forEach(bout => {
    if (bout.red && bout.red.fighter_id) uniqueFighters.add(bout.red.fighter_id);
    if (bout.blue && bout.blue.fighter_id) uniqueFighters.add(bout.blue.fighter_id);
  });
  
  return uniqueFighters.size;
};

// Find which fighter has a bye in a 3-fighter bracket
export const findByeFighter = (bracketBouts: Bout[]): RosterFighter | null => {
  // This only applies to 3-fighter brackets
  if (calculateBracketFighters(bracketBouts) !== 3) return null;
  
  // Get all fighters
  const allFighters = new Map<string, RosterFighter>();
  bracketBouts.forEach(bout => {
    if (bout.red && bout.red.fighter_id) allFighters.set(bout.red.fighter_id, bout.red);
    if (bout.blue && bout.blue.fighter_id) allFighters.set(bout.blue.fighter_id, bout.blue);
  });
  
  // Get fighters in semifinals
  const semifinalFighters = new Set<string>();
  const semiFinalBouts = bracketBouts.filter(bout => 
    bout.bracket_bout_type === 'semifinal' || bout.bracket_bout_type === 'qualifier'
  );
  
  semiFinalBouts.forEach(bout => {
    if (bout.red && bout.red.fighter_id) semifinalFighters.add(bout.red.fighter_id);
    if (bout.blue && bout.blue.fighter_id) semifinalFighters.add(bout.blue.fighter_id);
  });
  
  // Find the fighter that's not in semifinals
  for (const [id, fighter] of allFighters.entries()) {
    if (!semifinalFighters.has(id)) {
      return fighter;
    }
  }
  
  return null;
};

// Create a bracket object from bouts using bracket_bout_fighters array
export const createBracket = (bracketBouts: Bout[]): Bracket | null => {
  if (!bracketBouts || bracketBouts.length === 0) return null;
  
  // Find a bout with bracket_bout_fighters array
  const boutWithFighters = bracketBouts.find(bout => 
    Array.isArray(bout.bracket_bout_fighters) && bout.bracket_bout_fighters.length > 0
  );
  
  // If we have bracket_bout_fighters array, use it to determine bracket structure
  if (boutWithFighters && boutWithFighters.bracket_bout_fighters) {
    const bracketFighters = boutWithFighters.bracket_bout_fighters;
    const numFighters = bracketFighters.length;
    
    // For 3-fighter bracket with bye
    if (numFighters === 3) {
      // In a 3-fighter bracket, the top seed (first fighter) gets a bye
      const byeFighter = bracketFighters[0];
      
      const semifinals = bracketBouts.filter(bout => 
        bout.bracket_bout_type === 'semifinal' || bout.bracket_bout_type === 'qualifier'
      );
      
      const finals = bracketBouts.filter(bout => bout.bracket_bout_type === 'final');
      
      return {
        bouts: [...semifinals, ...(finals.length > 0 ? finals : [])],
        bye: byeFighter
      };
    }
    
    // For 4-fighter bracket or larger
    if (numFighters >= 4) {
      const semifinals = bracketBouts.filter(bout => 
        bout.bracket_bout_type === 'semifinal' || bout.bracket_bout_type === 'qualifier'
      );
      
      const finals = bracketBouts.filter(bout => bout.bracket_bout_type === 'final');
      
      // Make sure we have semifinals
      if (semifinals.length > 0) {
        return {
          bouts: [...semifinals, ...(finals.length > 0 ? finals : [])]
        };
      }
    }
  }
  
  // Fallback to original logic if bracket_bout_fighters is not available
  const numFighters = calculateBracketFighters(bracketBouts);
  
  // For 3-fighter bracket with bye
  if (numFighters === 3) {
    const byeFighter = findByeFighter(bracketBouts);
    if (!byeFighter) return null;
    
    const semifinals = bracketBouts.filter(bout => 
      bout.bracket_bout_type === 'semifinal' || bout.bracket_bout_type === 'qualifier'
    );
    
    const finals = bracketBouts.filter(bout => bout.bracket_bout_type === 'final');
    
    if (semifinals.length > 0) {
      return {
        bouts: [...semifinals, ...(finals.length > 0 ? finals : [])],
        bye: byeFighter
      };
    }
  }
  
  // For 4-fighter bracket
  if (numFighters === 4) {
    const semifinals = bracketBouts.filter(bout => 
      bout.bracket_bout_type === 'semifinal' || bout.bracket_bout_type === 'qualifier'
    );
    
    const finals = bracketBouts.filter(bout => bout.bracket_bout_type === 'final');
    
    if (semifinals.length >= 2) {
      return {
        bouts: [...semifinals, ...(finals.length > 0 ? finals : [])]
      };
    }
  }
  
  // If we have just a final bout, create a minimal bracket
  const finalBouts = bracketBouts.filter(bout => bout.bracket_bout_type === 'final');
  if (finalBouts.length > 0) {
    return {
      bouts: bracketBouts
    };
  }
  
  return null;
};

// Get bracket for a specific bout
export const getBracketForBout = (bouts: Bout[], bout: Bout): Bracket | null => {
  // Early return if no weightclass
  if (!bout.weightclass) return null;
  
  // Find all bouts that belong to the same bracket based on weightclass
  const bracketBouts = bouts.filter(b => 
    b.weightclass === bout.weightclass && 
    b.bracket_bout_type // Only include bouts that are part of the bracket
  );
  
  // Special handling for final bouts to always return a valid bracket
  if (bout.bracket_bout_type === 'final') {
    // Check if this bout has bracket_bout_fighters array
    if (bout.bracket_bout_fighters && bout.bracket_bout_fighters.length > 0) {
      // Try to create a proper bracket
      let bracket = createBracket(bracketBouts);
      
      // If we couldn't create a proper bracket, create a minimal one
      if (!bracket) {
        bracket = {
          bouts: bracketBouts.length > 0 ? bracketBouts : [bout]
        };
      }
      
      return bracket;
    }
  }
  
  // Standard bracket creation
  return createBracket(bracketBouts);
};

// Create a bracket from an array of fighters
// Updated version of createBracketFromFighters
export const createBracketFromFighters = (
  bout: Bout,
  bracketFighters: RosterFighter[],
  allBouts: Bout[] = []
): Bracket | null => {
  if (!bracketFighters || bracketFighters.length < 3) {
    console.error('Need at least 3 fighters for a bracket');
    return null;
  }
  
  // Find actual bout numbers for semifinals if possible
  let semifinal1BoutNum: string | number = 1;
  let semifinal2BoutNum: string | number = 2;
  
  if (allBouts && allBouts.length > 0 && bracketFighters.length >= 4) {
    // Try to get the actual bout numbers from the event
    const sf1BoutNum = findBoutNumberByFighterPositions(bracketFighters, allBouts, 0, 2);
    const sf2BoutNum = findBoutNumberByFighterPositions(bracketFighters, allBouts, 1, 3);
    
    // Use the found bout numbers or fall back to defaults
    if (sf1BoutNum !== "TBD") semifinal1BoutNum = sf1BoutNum;
    if (sf2BoutNum !== "TBD") semifinal2BoutNum = sf2BoutNum;
  }
  
  // For a 3-fighter bracket with bye
  if (bracketFighters.length === 3) {
    // Create semifinal bout with first two fighters
    const semifinalBout: Bout = {
      boutNum: semifinal1BoutNum as number,
      red: bracketFighters[0],
      blue: bracketFighters[1],
      weightclass: bout.weightclass,
      bout_ruleset: bout.bout_ruleset,
      bracket_bout_type: 'semifinal',
      boutId: bout.boutId,
      ringNum: bout.ringNum,
      methodOfVictory: bout.methodOfVictory,
      eventId: bout.eventId,
      bracket_bout_fighters: bracketFighters,
      eventName: bout.eventName,
      url: bout.url,
      date: bout.date,
      promotionId: bout.promotionId,
      promotionName: bout.promotionName,
      sanctioning: bout.sanctioning,
      dayNum: bout.dayNum,
      class: bout.class,
    };
    
    // The third fighter gets a bye
    return {
      bouts: [semifinalBout],
      bye: bracketFighters[2]
    };
  }
  
  // For a 4-fighter bracket
  if (bracketFighters.length >= 4) {
    // Create first semifinal: fighter[0] vs fighter[2]
    const semifinal1: Bout = {
      ...bout,
      boutNum: semifinal1BoutNum as number,
      red: bracketFighters[0],
      blue: bracketFighters[2],
      bracket_bout_type: 'semifinal'
    };
    
    // Create second semifinal: fighter[1] vs fighter[3]
    const semifinal2: Bout = {
      ...bout,
      boutNum: semifinal2BoutNum as number,
      red: bracketFighters[1],
      blue: bracketFighters[3],
      bracket_bout_type: 'semifinal'
    };
    
    // Create final bout (empty, will be filled with semifinal winners)
    const finalBout: Bout = {
      ...bout,
      boutNum: bout.boutNum, // Keep the original bout number for the final
      bracket_bout_type: 'final',
      red: null,
      blue: null
    };
    
    return {
      bouts: [semifinal1, semifinal2, finalBout]
    };
  }
  
  return null;
};

// Helper function to check if bout is part of a bracket
export function isBracketBout(bout: Bout): boolean {
  return !!bout.bracket_bout_type; // If bracket_bout_type exists and isn't empty
}

// Helper function to check if a bout has final bracket type
export function hasFinalBout(bouts: Bout[]): boolean {
  return bouts.some(bout => bout.bracket_bout_type === 'final');
}


// Updated BracketButton Component for BracketContainer.tsx
export function BracketButton({ 
  bout, 
  allBouts,
  bracketFighters,

}: { 
  bout: Bout;
  allBouts: Bout[];
  bracketFighters: Array<RosterFighter>;

}) {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  
  if (!bracketFighters || bracketFighters.length < 3) return null;
  


  // Get bout numbers for each semifinal match
  const semifinal1BoutNum = findBoutNumberByFighterPositions(bracketFighters, allBouts, 0, 2);
  const semifinal2BoutNum = findBoutNumberByFighterPositions(bracketFighters, allBouts, 1, 3);
  

  const handleFighterClick = (fighter: RosterFighter) => {
    if (fighter.fighter_id) {
      window.open(`https://www.techbouts.com/fighter/${fighter.fighter_id}`, '_blank');
    }
  };

  const openBracketModal = () => {
    // Log fighters array positions
    console.log('Bracket Fighters Array:');
    bracketFighters.forEach((fighter, index) => {
      console.log(`Fighter ${index}: ${fighter.first} ${fighter.last} (${fighter.fighter_id})`);
    });
    
    // For 3-fighter bracket
    if (bracketFighters.length === 3) {
      console.log('3-Fighter Bracket Structure:');
      console.log(`Semifinal: ${bracketFighters[0].first} ${bracketFighters[0].last} vs ${bracketFighters[1].first} ${bracketFighters[1].last}`);
      console.log(`Bye Fighter: ${bracketFighters[2].first} ${bracketFighters[2].last}`);
    }
    
    // For 4-fighter bracket
    if (bracketFighters.length >= 4) {
      console.log('4-Fighter Bracket Structure:');
      console.log(`Semifinal 1 (Bout ${semifinal1BoutNum}): ${bracketFighters[0].first} ${bracketFighters[0].last} vs ${bracketFighters[2].first} ${bracketFighters[2].last}`);
      console.log(`Semifinal 2 (Bout ${semifinal2BoutNum}): ${bracketFighters[1].first} ${bracketFighters[1].last} vs ${bracketFighters[3].first} ${bracketFighters[3].last}`);
    }
    
    setIsModalOpen(true);
  };
  
  const closeBracketModal = () => {
    setIsModalOpen(false);
  };
  
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={openBracketModal}
        className="mt-2"
      >
        <TbTournament className="h-4 w-4 mr-2" />
        {bracketFighters.length >= 4 ? (
          `Bouts ${semifinal1BoutNum}, ${semifinal2BoutNum}`
        ) : (
          `(${bracketFighters.length}-Fighter)`
        )}
      </Button>
      
      <BracketModal isOpen={isModalOpen} onClose={closeBracketModal}>
        {bracketFighters.length === 3 ? (
          // 3-fighter bracket with bye
          <ByeBracketDisplay 
            bracket={createBracketFromFighters(bout, bracketFighters, allBouts) || { bouts: [] }}
            handleFighterClick={handleFighterClick}
          />
        ) : (
          // 4-fighter or more bracket
          <FullBracketDisplay 
            bracket={createBracketFromFighters(bout, bracketFighters, allBouts) || { bouts: [] }}
            handleFighterClick={handleFighterClick}
          />
        )}
      </BracketModal>
    </>
  );
}

// Final bracket badge component
export function FinalBracketBadge() {
  return (
    <Badge className="mt-2" variant="outline">
      <Trophy className="h-3 w-3 mr-1" />
      Tournament Final
    </Badge>
  );
}