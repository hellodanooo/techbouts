// components/matches/FullBracketDisplay.tsx

import React from 'react';
import { RosterFighter, Bout, Bracket } from '@/utils/types';
import { BoutRow } from './BoutDisplay';
import { Button } from "@/components/ui/button";
import { Table, TableBody } from "@/components/ui/table";
import { findBoutNumberByFighterPositions } from '@/utils/brackets';

interface FullBracketDisplayProps {
  bracket: Bracket;
  handleFighterClick?: (fighter: RosterFighter) => void;
  onClearBracket?: () => void;
  isAdmin?: boolean;
  onBoutSelect?: (bout: Bout) => void;
  allBouts?: Bout[]; // Add allBouts prop to get bout numbers
}

export function FullBracketDisplay({
  bracket,
  handleFighterClick = () => {},
  onClearBracket,
  isAdmin,
  onBoutSelect,
  allBouts = []
}: FullBracketDisplayProps) {
  if (!bracket || !bracket.bouts || bracket.bouts.length < 2) {
    return (
      <div className="border border-dashed rounded-lg bg-gray-50 text-center">
        <p className="text-sm text-gray-500">
          Invalid bracket structure. Please select 4 fighters to create a full bracket.
        </p>
      </div>
    );
  }
  
  // Get semifinals (first two bouts) and final (third bout if exists)
  const semiFinal1 = bracket.bouts[0];
  const semiFinal2 = bracket.bouts.length > 1 ? bracket.bouts[1] : null;
  const final = bracket.bouts.length > 2 ? bracket.bouts[2] : null;
  
  // Get actual bout numbers from the event bouts if available
  let semifinal1BoutNum = semiFinal1?.boutNum || "?";
  let semifinal2BoutNum = semiFinal2?.boutNum || "?";
  
  // If we have a final bout with bracket_bout_fighters and allBouts
  if (final?.bracket_bout_fighters && allBouts && allBouts.length > 0) {
    const bracketFighters = final.bracket_bout_fighters;
    
    // Try to get actual bout numbers
    if (bracketFighters.length >= 4) {
      // Get the bout numbers for each semifinal
      const calculatedSF1 = findBoutNumberByFighterPositions(bracketFighters, allBouts, 0, 2);
      const calculatedSF2 = findBoutNumberByFighterPositions(bracketFighters, allBouts, 1, 3);
      
      if (calculatedSF1 !== "TBD") semifinal1BoutNum = calculatedSF1;
      if (calculatedSF2 !== "TBD") semifinal2BoutNum = calculatedSF2;
    }
  }
  
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <h3 className="text-lg font-semibold text-center mb-4">4-Fighter Bracket</h3>
      
      {/* Semifinals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
          {isAdmin && onBoutSelect && semiFinal1 && (
            <Button 
              variant="outline"
              className="mb-2"
              onClick={() => onBoutSelect(semiFinal1)}
            >
              Select Bout
            </Button>
          )}
          <h4 className="text-sm font-medium text-center mb-1">Semifinal 1 (Bout {semifinal1BoutNum})</h4>
          <div className="bg-white rounded-md overflow-hidden">
            {semiFinal1 && (
              <Table>
                <TableBody>
                  <BoutRow 
                    bout={semiFinal1}
                    allBouts={allBouts}
                    index={0}
                    isAdmin={false}
                    handleFighterClick={handleFighterClick}
                    onBoutSelect={onBoutSelect}
                    source='BracketDisplay'
                  />
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        
        <div className="flex flex-col">
          {isAdmin && onBoutSelect && semiFinal2 && (
            <Button 
              variant="outline"
              className="mb-2"
              onClick={() => onBoutSelect(semiFinal2)}
            >
              Select Bout
            </Button>
          )}
          <h4 className="text-sm font-medium text-center mb-1">Semifinal 2 (Bout {semifinal2BoutNum})</h4>
          <div className="bg-white rounded-md overflow-hidden">
            {semiFinal2 && (
              <Table>
                <TableBody>
                  <BoutRow 
                    bout={semiFinal2}
                    allBouts={allBouts}
                    index={1}
                    isAdmin={false}
                    handleFighterClick={handleFighterClick}
                    onBoutSelect={onBoutSelect}
                     source='BracketDisplay'
                  />
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </div>
      
      {/* Connection lines */}
      <div className="flex w-full justify-center items-center h-12 mb-4">
        <div className="w-1/4 border-b border-gray-300"></div>
        <div className="w-1/2 flex justify-center">
          <div className="h-12 border-l border-gray-300"></div>
        </div>
        <div className="w-1/4 border-b border-gray-300"></div>
      </div>
      
      {/* Final */}
      <div className="flex flex-col mb-4">
        <h4 className="text-sm font-medium text-center mb-1">
          Final (Bout {final?.boutNum || "?"})
        </h4>
        <div className="bg-white rounded-md overflow-hidden">
          {final ? (
            <Table>
              <TableBody>
                <BoutRow 
                  bout={final}
                  allBouts={allBouts}
                  index={2}
                  isAdmin={false}
                  handleFighterClick={handleFighterClick}
                  onBoutSelect={onBoutSelect}
                   source='BracketDisplay'
                />
              </TableBody>
            </Table>
          ) : (
            <div className="text-center text-sm text-gray-500">
              Final match will be created between the winners of the semifinal matches
            </div>
          )}
        </div>
      </div>
      
      {onClearBracket && (
        <div className="flex justify-center mt-4">
          <Button 
            variant="outline" 
            onClick={onClearBracket}
            size="sm"
          >
            Clear Bracket
          </Button>
        </div>
      )}
    </div>
  );
}