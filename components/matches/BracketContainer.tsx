// components/matches/BracketContainer.tsx

import React, { useState, useMemo, useContext, useCallback, createContext } from 'react';
import { Button } from "@/components/ui/button";
import { Bout, RosterFighter, Bracket } from '@/utils/types';
import { Trophy, GitMerge, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ByeBracketDisplay } from '@/components/matches/ByeBracketDisplay';
import { FullBracketDisplay } from '@/components/matches/FullBracketDisplay';

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

// BracketContext for managing bracket modal state across components
interface BracketContextType {
  openBracketModal: (bracket: Bracket) => void;
  currentBracket: Bracket | null;
  isModalOpen: boolean;
  closeBracketModal: () => void;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
}

// Create context with default values
const BracketContext = createContext<BracketContextType>({
  openBracketModal: () => {},
  currentBracket: null,
  isModalOpen: false,
  closeBracketModal: () => {},
  handleFighterClick: () => {},
  onBoutSelect: undefined
});

// Provider component for the bracket context
export function BracketProvider({ 
  children, 
  handleFighterClick,
  onBoutSelect
}: { 
  children: React.ReactNode;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
}) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentBracket, setCurrentBracket] = useState<Bracket | null>(null);
  
  const openBracketModal = useCallback((bracket: Bracket) => {
    setCurrentBracket(bracket);
    setIsModalOpen(true);
  }, []);
  
  const closeBracketModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);
  
  const contextValue = useMemo(() => ({
    openBracketModal,
    currentBracket,
    isModalOpen,
    closeBracketModal,
    handleFighterClick,
    onBoutSelect
  }), [openBracketModal, currentBracket, isModalOpen, closeBracketModal, handleFighterClick, onBoutSelect]);
  
  return (
    <BracketContext.Provider value={contextValue}>
      {children}
      
      {/* Bracket modal */}
      <BracketModal 
        isOpen={isModalOpen}
        onClose={closeBracketModal}
      >
        {currentBracket && (
          currentBracket.bye ? (
            <ByeBracketDisplay 
              bracket={currentBracket}
              handleFighterClick={handleFighterClick}
              onBoutSelect={onBoutSelect}
            />
          ) : (
            <FullBracketDisplay 
              bracket={currentBracket}
              handleFighterClick={handleFighterClick}
              onBoutSelect={onBoutSelect}
            />
          )
        )}
      </BracketModal>
    </BracketContext.Provider>
  );
}

// Hook to use the bracket context
export function useBracketContext() {
  return useContext(BracketContext);
}

// Helper function to check if bout is part of a bracket
export function isBracketBout(bout: Bout): boolean {
  return !!bout.bracket_bout_type; // If bracket_bout_type exists and isn't empty
}

// Helper function to check if a bout has final bracket type
export function hasFinalBout(bouts: Bout[]): boolean {
  return bouts.some(bout => bout.bracket_bout_type === 'final');
}

// Helper function to check if bout is finished
export function isBoutFinished(bout: Bout): boolean {
  const redResult = bout.red?.result;
  const blueResult = bout.blue?.result;
  
  return (
    redResult && 
    redResult !== '-' &&
    blueResult && 
    blueResult !== '-'
  );
}

// Component to create a bracket button for a final bout
export function BracketButton({ 
  bout, 
  allBouts 
}: { 
  bout: Bout;
  allBouts: Bout[];
}) {
  const { openBracketModal } = useBracketContext();
  
  // Get bracket for the bout
  const bracket = useMemo(() => {
    if (bout.bracket_bout_type === 'final') {
      return getBracketForBout(allBouts, bout);
    }
    return null;
  }, [bout, allBouts]);
  
  if (!bracket) return null;
  
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={() => openBracketModal(bracket)}
      className="mt-2"
    >
      <GitMerge className="h-4 w-4 mr-2" />
      View Bracket
    </Button>
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