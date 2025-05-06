// components/matches/SimpleBracketDisplay.tsx

import React from 'react';
import { RosterFighter, Bout, Bracket } from '@/utils/types';
import Image from 'next/image';

// Helper functions 
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
      <div className="border border-gray-300 p-2 rounded-md h-12 w-36 flex items-center justify-center">
        <p className="text-gray-400 text-xs">TBD</p>
      </div>
    );
  }

  return (
    <div 
      className={`
        border p-1 rounded-md h-12 w-36 flex items-center cursor-pointer 
        ${corner === 'red' ? 'border-red-500' : 'border-blue-500'}
        ${isBye ? 'border-dashed border-yellow-500 bg-yellow-50' : ''}
      `}
      onClick={() => onClick && onClick()}
    >
      <div className="flex-shrink-0">
        <Image
          src={getPhotoUrl(fighter)}
          alt={`${fighter.first} ${fighter.last}`}
          width={24}
          height={24}
          className="rounded-full"
        />
      </div>
      <div className="ml-2 overflow-hidden">
        <p className="text-xs font-medium truncate">
          {fighter.first} {fighter.last}
        </p>
        <p className="text-xxs text-gray-500 truncate">
          {fighter.gym || 'No gym'}
        </p>
      </div>
    </div>
  );
}

// Interface for a match within the bracket
interface BracketMatchProps {
  bout: Bout;
  handleFighterClick: (fighter: RosterFighter) => void;
  isSemiFinal?: boolean;
}

// Component for displaying a single match in the bracket
export function SimpleBracketMatch({ 
  bout, 
  handleFighterClick,
}: BracketMatchProps) {
  if (!bout || !bout.red || !bout.blue) {
    return (
      <div className="flex flex-col items-center space-y-2 my-2">
        <div className="flex space-x-2 items-center">
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
      <div className="flex space-x-2 items-center">
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

// Full bracket display component
interface SimpleBracketDisplayProps {
  bracket: Bracket;
  handleFighterClick: (fighter: RosterFighter) => void;
  onClearBracket?: () => void;
}

export function SimpleBracketDisplay({
  bracket,
  handleFighterClick,
  onClearBracket
}: SimpleBracketDisplayProps) {
  // Check if we have a 3-fighter bracket (with bye)
  const hasThirdFighterBye = bracket && bracket.bye && bracket.bouts.length === 1;
  
  // Check if we have a 4-fighter bracket (two semifinals)
  const hasFourFighterBracket = bracket && bracket.bouts.length >= 2 && !bracket.bye;

  if (hasThirdFighterBye) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-center mb-4">3-Fighter Bracket</h3>
        
        {/* Semifinal */}
        <div className="flex flex-col items-center mb-6">
          <h4 className="text-sm font-medium mb-1">Semifinal</h4>
          <SimpleBracketMatch 
            bout={bracket.bouts[0]}
            handleFighterClick={handleFighterClick}
            isSemiFinal={true}
          />
        </div>
        
        {/* Connection line */}
        <div className="flex justify-center">
          <div className="h-6 border-l border-gray-300"></div>
        </div>
        
        {/* Final */}
        <div className="flex flex-col items-center mt-2">
          <h4 className="text-sm font-medium mb-1">Final</h4>
          <div className="flex items-center space-x-4">
            <div className="text-xs border border-gray-300 rounded-md p-2 bg-gray-50">
              Winner of Semifinal
            </div>
            <div className="text-xs">vs</div>
            <div 
              className="border border-dashed border-yellow-500 rounded-md p-2 bg-yellow-50 flex items-center space-x-2 cursor-pointer"
              onClick={() => bracket.bye && handleFighterClick(bracket.bye)}
            >
              <div className="text-xs font-medium">
                Bye: {bracket.bye?.first || 'Unknown'} {bracket.bye?.last || 'Unknown'}
              </div>
            </div>
          </div>
        </div>
        
        {onClearBracket && (
          <div className="flex justify-center mt-4">
            <button 
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
              onClick={onClearBracket}
            >
              Clear Bracket
            </button>
          </div>
        )}
      </div>
    );
  }
  
  if (hasFourFighterBracket) {
    return (
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold text-center mb-4">4-Fighter Bracket</h3>
        
        {/* Semifinals */}
        <div className="flex justify-around">
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-medium mb-1">Semifinal 1</h4>
            <SimpleBracketMatch 
              bout={bracket.bouts[0]}
              handleFighterClick={handleFighterClick}
              isSemiFinal={true}
            />
          </div>
          
          <div className="flex flex-col items-center">
            <h4 className="text-sm font-medium mb-1">Semifinal 2</h4>
            <SimpleBracketMatch 
              bout={bracket.bouts[1]}
              handleFighterClick={handleFighterClick}
              isSemiFinal={true}
            />
          </div>
        </div>
        
        {/* Connection lines */}
        <div className="flex w-full justify-center items-center h-8">
          <div className="w-1/4 border-b border-gray-300"></div>
          <div className="w-1/2 flex justify-center">
            <div className="h-8 border-l border-gray-300"></div>
          </div>
          <div className="w-1/4 border-b border-gray-300"></div>
        </div>
        
        {/* Final */}
        <div className="flex flex-col items-center">
          <h4 className="text-sm font-medium mb-1">Final</h4>
          <div className="flex items-center space-x-4">
            <div className="text-xs border border-gray-300 rounded-md p-2 bg-gray-50">
              Winner of Semifinal 1
            </div>
            <div className="text-xs">vs</div>
            <div className="text-xs border border-gray-300 rounded-md p-2 bg-gray-50">
              Winner of Semifinal 2
            </div>
          </div>
        </div>
        
        {onClearBracket && (
          <div className="flex justify-center mt-4">
            <button 
              className="text-sm px-3 py-1 border border-gray-300 rounded hover:bg-gray-100"
              onClick={onClearBracket}
            >
              Clear Bracket
            </button>
          </div>
        )}
      </div>
    );
  }
  
  // Default case - invalid bracket structure
  return (
    <div className="p-4 border border-dashed rounded-lg bg-gray-50 text-center">
      <p className="text-sm text-gray-500">
        Invalid bracket structure. Please select at least 3 fighters to create a tournament bracket.
      </p>
    </div>
  );
}