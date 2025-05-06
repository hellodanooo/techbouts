// components/matches/ByeBracketDisplay.tsx

import React from 'react';
import { RosterFighter, Bout, Bracket } from '@/utils/types';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { BoutRow } from './BoutDisplay';
import { Table, TableBody } from "@/components/ui/table";

// Helper functions - keep these for the BracketFighterCard
const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const getPhotoUrl = (fighter: RosterFighter): string => {
  const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";
  return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
};

// Simple Fighter Card for Bracket View
interface BracketFighterCardProps {
  fighter: RosterFighter | null;
  corner: 'red' | 'blue';
  onClick?: () => void;
  isBye?: boolean;
}

export function BracketFighterCard({
  fighter,
  corner,
  onClick,
  isBye = false
}: BracketFighterCardProps) {
  if (!fighter) {
    return (
      <div className="border border-gray-300 rounded-md h-12 flex items-center justify-center">
        <p className="text-gray-400 text-xs">TBD</p>
      </div>
    );
  }

  return (
    <div 
      className={`
        border p-1 rounded-md h-12 flex items-center cursor-pointer 
        ${corner === 'red' ? 'border-red-500' : 'border-blue-500'}
        ${isBye ? 'border-dashed border-yellow-500 bg-yellow-50' : ''}
      `}
      onClick={() => onClick && onClick()}
    >
      <div className="mr-2">
        <Image
          src={getPhotoUrl(fighter)}
          alt={`${fighter.first} ${fighter.last}`}
          width={24}
          height={24}
          className="rounded-full"
        />
      </div>
      <div>
        <p className="text-xs font-medium truncate">
          {fighter.first} {fighter.last}
        </p>
        <p className="text-xs text-gray-500 truncate">
          {fighter.gym || 'No gym'}
        </p>
      </div>
    </div>
  );
}

// We keep the original BracketMatch component for compatibility
export function BracketMatch({ 
  bout, 
  handleFighterClick,
}: {
  bout: Bout;
  handleFighterClick: (fighter: RosterFighter) => void;
  isSemiFinal?: boolean;
}) {
  if (!bout || !bout.red || !bout.blue) {
    return (
      <div className="flex flex-col items-center space-y-2 my-2">
        <div className="flex items-center">
          <BracketFighterCard fighter={null} corner="red" />
          <div className="text-xs bg-gray-200 px-2 py-1 rounded-md">vs</div>
          <BracketFighterCard fighter={null} corner="blue" />
        </div>
        <div className="text-xs text-gray-400">#TBD</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center space-y-2 my-2">
      <div className="flex items-center space-x-2">
        <BracketFighterCard 
          fighter={bout.red} 
          corner="red" 
          onClick={() => bout.red && handleFighterClick(bout.red)}
        />
        <div className="text-xs bg-gray-200 px-2 py-1 rounded-md cursor-pointer">
          {bout.boutNum}
        </div>
        <BracketFighterCard 
          fighter={bout.blue} 
          corner="blue" 
          onClick={() => bout.blue && handleFighterClick(bout.blue)}
        />
      </div>
      <div className="text-xs text-gray-500">
        {bout.weightclass}lbs • {bout.bout_ruleset || 'Match'}
      </div>
    </div>
  );
}

interface ByeBracketDisplayProps {
  bracket: Bracket;
  handleFighterClick: (fighter: RosterFighter) => void;
  onClearBracket?: () => void;
  isAdmin?: boolean;
  onBoutSelect?: (bout: Bout) => void;
}

export function ByeBracketDisplay({
  bracket,
  handleFighterClick,
  onClearBracket,
  isAdmin,
  onBoutSelect
}: ByeBracketDisplayProps) {
  if (!bracket || !bracket.bye || !bracket.bouts || bracket.bouts.length < 1) {
    return (
      <div className="p-4 border border-dashed rounded-lg bg-gray-50 text-center">
        <p className="text-sm text-gray-500">
          Invalid bracket structure. Please select 3 fighters to create a bracket with bye.
        </p>
      </div>
    );
  }
  
  // Get the semifinal bout and create a final bout if it exists
  const semifinalBout = bracket.bouts[0];
  const finalBout = bracket.bouts.length > 1 ? bracket.bouts[1] : null;
  
  return (
    <div className="bg-gray-50 p-4 rounded-lg overflow-hidden">
      <h3 className="text-lg font-semibold text-center mb-4">3-Fighter Bracket</h3>
      
      {/* Semifinal */}
      <div className="flex flex-col items-center mb-6">
        <h4 className="text-sm font-medium mb-1">Semifinal</h4>
        <div className="bg-white rounded-md overflow-hidden w-full max-w-3xl">
          {semifinalBout && (
            <Table>
              <TableBody>
                <BoutRow 
                  bout={semifinalBout}
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
      
      {/* Connection line */}
      <div className="flex justify-center">
        <div className="h-6 border-l border-gray-300"></div>
      </div>
      
      {/* Final */}
      <div className="flex flex-col items-center mt-2">
        <h4 className="text-sm font-medium mb-1">Final</h4>
        
        {finalBout ? (
          <div className="bg-white rounded-md overflow-hidden w-full max-w-3xl">
            <Table>
              <TableBody>
                <BoutRow 
                  bout={finalBout}
                  index={1}
                  isAdmin={isAdmin}
                  handleFighterClick={handleFighterClick}
                  onBoutSelect={onBoutSelect}
                />
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex items-center space-x-4 bg-white p-3 rounded-md">
            <div className="text-xs border border-gray-300 rounded-md p-2 bg-gray-50">
              Winner of Semifinal
            </div>
            <div className="text-xs">vs</div>
            <div 
              className="border border-dashed border-yellow-500 rounded-md p-2 bg-yellow-50 flex items-center cursor-pointer"
              onClick={() => bracket.bye && handleFighterClick(bracket.bye)}
            >
              <div className="text-xs font-medium">
                Bye: {bracket.bye?.first || 'Unknown'} {bracket.bye?.last || 'Unknown'}
              </div>
            </div>
          </div>
        )}
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