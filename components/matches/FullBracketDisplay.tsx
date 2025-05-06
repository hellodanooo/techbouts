// components/matches/FullBracketDisplay.tsx

import React from 'react';
import { RosterFighter, Bout, Bracket } from '@/utils/types';
import { BoutRow } from './BoutDisplay';
import { Button } from "@/components/ui/button";
import { Table, TableBody } from "@/components/ui/table";

interface FullBracketDisplayProps {
  bracket: Bracket;
  handleFighterClick: (fighter: RosterFighter) => void;
  onClearBracket?: () => void;
  isAdmin?: boolean;
  onBoutSelect?: (bout: Bout) => void;
}

export function FullBracketDisplay({
  bracket,
  handleFighterClick,
  onClearBracket,
  isAdmin,
  onBoutSelect
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
  
  return (
    <div className="bg-gray-50 rounded-lg overflow-hidden">
      <h3 className="text-lg font-semibold text-center mb-4">4-Fighter Bracket</h3>
      
      {/* Semifinals */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="flex flex-col">
            <Button 
            variant="outline"
            className="mb-2"
            onClick={() => onBoutSelect && onBoutSelect(semiFinal1)}
            >
              Select Bout
            </Button>
          <h4 className="text-sm font-medium text-center mb-1">Semifinal 1</h4>
          <div className="bg-white rounded-md overflow-hidden">
            {semiFinal1 && (
              <Table>
                <TableBody>
                  <BoutRow 
                    bout={semiFinal1}
                    index={0}
                    isAdmin={isAdmin}
                    handleFighterClick={handleFighterClick}
                    onBoutSelect={onBoutSelect}
                  />
                </TableBody>
              </Table>
            )}
          </div>
        </div>
        
        <div className="flex flex-col">
          <h4 className="text-sm font-medium text-center mb-1">Semifinal 2</h4>
          <div className="bg-white rounded-md overflow-hidden">
            {semiFinal2 && (
              <Table>
                <TableBody>
                  <BoutRow 
                    bout={semiFinal2}
                    index={1}
                    isAdmin={isAdmin}
                    handleFighterClick={handleFighterClick}
                    onBoutSelect={onBoutSelect}
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
        <h4 className="text-sm font-medium text-center mb-1">Final</h4>
        <div className="bg-white rounded-md overflow-hidden">
          {final ? (
            <Table>
              <TableBody>
                <BoutRow 
                  bout={final}
                  index={2}
                  isAdmin={isAdmin}
                  handleFighterClick={handleFighterClick}
                  onBoutSelect={onBoutSelect}
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