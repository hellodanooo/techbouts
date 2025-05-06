// components/matches/BracketDisplay.tsx

import React from 'react';
import { Bracket, Bout, RosterFighter } from '@/utils/types';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";


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

const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  if (text.length > maxLength) {
    return text.substring(0, maxLength) + '.';
  }
  return text;
};



// BracketFighter Component
interface BracketFighterProps {
  fighter: RosterFighter | null;
  corner: 'red' | 'blue';
  onClick?: () => void;
  isWinner?: boolean;
  isInSemiFinal?: boolean;
}

export function BracketFighter({ 
  fighter, 
  corner, 
  onClick,
  isWinner = false,
  isInSemiFinal = false
}: BracketFighterProps) {
  if (!fighter) {
    return (
      <div 
        className={`border border-gray-300 p-2 rounded-md h-16 flex items-center justify-center ${isInSemiFinal ? 'w-40' : 'w-32'}`}
        style={{ 
          backgroundColor: isInSemiFinal ? '#f0f0f0' : 'white'
        }}
      >
        <p className="text-gray-400 text-xs">TBD</p>
      </div>
    );
  }

  return (
    <div 
      className={`
        border p-1 rounded-md flex items-center cursor-pointer 
        ${corner === 'red' ? 'border-red-500' : 'border-blue-500'} 
        ${isWinner ? 'ring-2 ring-yellow-400' : ''}
        ${isInSemiFinal ? 'w-40' : 'w-32'}
      `}
      style={{ 
        backgroundColor: isWinner ? corner === 'red' ? 'rgba(254, 226, 226, 0.3)' : 'rgba(219, 234, 254, 0.3)' : 'white'
      }}
      onClick={onClick}
    >
      <div className="flex-shrink-0 relative">
        <Image
          src={getPhotoUrl(fighter)}
          alt={`${fighter.first} ${fighter.last}`}
          width={30}
          height={30}
          className="rounded-md mr-1"
        />
        {fighter.result && fighter.result !== '-' && (
          <div className={`absolute -top-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-white text-xs font-bold 
            ${fighter.result === 'W' ? 'bg-green-500' : fighter.result === 'L' ? 'bg-red-500' : 'bg-yellow-500'}`}
          >
            {fighter.result === 'W' ? 'W' : fighter.result === 'L' ? 'L' : 'D'}
          </div>
        )}
      </div>
      <div className="flex flex-col overflow-hidden">
        <p className="text-xs font-medium truncate">
          {truncateText(`${fighter.first} ${fighter.last}`, 12)}
        </p>
        <p className="text-xxs text-gray-500 truncate">
          {truncateText(fighter.gym || '', 15)}
        </p>
      </div>
    </div>
  );
}

// BracketMatch Component
interface BracketMatchProps {
  bout: Bout | null;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
  isSemiFinal?: boolean;
}

export function BracketMatch({ 
  bout, 
  handleFighterClick, 
  onBoutSelect,
  isSemiFinal = false
}: BracketMatchProps) {
  if (!bout) {
    return (
      <div className="flex flex-col items-center space-y-2 my-2">
        <div className="flex space-x-2 items-center">
          <BracketFighter fighter={null} corner="red" isInSemiFinal={isSemiFinal} />
          <div className="text-xs bg-gray-200 px-2 py-1 rounded-md">vs</div>
          <BracketFighter fighter={null} corner="blue" isInSemiFinal={isSemiFinal} />
        </div>
        <div className="text-xs text-gray-400">#TBD</div>
      </div>
    );
  }



  return (
    <div className="flex flex-col items-center space-y-2 my-2">
      <div className="flex space-x-2 items-center">
        <BracketFighter 
          fighter={bout.red} 
          corner="red" 
          onClick={() => bout.red && handleFighterClick(bout.red)}
          isWinner={bout.red?.result === 'W'}
          isInSemiFinal={isSemiFinal}
        />
        
        <div 
          className="text-xs bg-gray-200 px-2 py-1 rounded-md cursor-pointer"
          onClick={() => onBoutSelect && bout && onBoutSelect(bout)}
        >
          {bout.boutNum}
        </div>
        
        <BracketFighter 
          fighter={bout.blue} 
          corner="blue" 
          onClick={() => bout.blue && handleFighterClick(bout.blue)}
          isWinner={bout.blue?.result === 'W'}
          isInSemiFinal={isSemiFinal}
        />
      </div>
      
      <div className="text-xs text-gray-500">
        {bout.weightclass}lbs • {bout.bout_ruleset || 'Match'}
      </div>
    </div>
  );
}

// ChampionDisplay Component
interface ChampionDisplayProps {
  fighter: RosterFighter | null;
  handleFighterClick: (fighter: RosterFighter) => void;
}

export function ChampionDisplay({ fighter, handleFighterClick }: ChampionDisplayProps) {
  return (
    <div className="flex flex-col items-center mt-4">
      <div className="text-sm font-bold text-center mb-2">Champion</div>
      
      {fighter ? (
        <div 
          className="border-2 border-yellow-400 p-2 rounded-md cursor-pointer flex items-center space-x-2 bg-yellow-50"
          onClick={() => fighter && handleFighterClick(fighter)}
        >
          <Image
            src={getPhotoUrl(fighter)}
            alt={`${fighter.first} ${fighter.last}`}
            width={50}
            height={50}
            className="rounded-md"
          />
          <div className="flex flex-col">
            <p className="font-medium">{`${fighter.first} ${fighter.last}`}</p>
            <p className="text-xs text-gray-500">{fighter.gym || ''}</p>
          </div>
        </div>
      ) : (
        <div className="border border-gray-300 p-4 rounded-md h-16 w-40 flex items-center justify-center bg-gray-50">
          <p className="text-gray-400 text-sm">Awaiting Final</p>
        </div>
      )}
    </div>
  );
}

// BracketDisplay Component
interface BracketDisplayProps {
  bracket: Bracket;
  eventId: string;
  promoterId: string;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
  title?: string;
}

export function BracketDisplay({
  bracket,
 //eventId,
  //promoterId,
  handleFighterClick,
  onBoutSelect,
  title = 'Tournament Bracket'
}: BracketDisplayProps) {
  // Helper function to find a specific bout by position in the bracket
  const findBout = (position: 'semi1' | 'semi2' | 'final'): Bout | null => {
    if (!bracket || !bracket.bouts || bracket.bouts.length === 0) return null;
    
    // Sort bouts by boutNum to ensure correct ordering
    const sortedBouts = [...bracket.bouts].sort((a, b) => {
      const numA = typeof a.boutNum === 'number' ? a.boutNum : parseInt(String(a.boutNum));
      const numB = typeof b.boutNum === 'number' ? b.boutNum : parseInt(String(b.boutNum));
      return numA - numB;
    });
    
    // For a standard 4-person bracket:
    // First two bouts are semi-finals, last bout is the final
    if (position === 'semi1' && sortedBouts.length > 0) return sortedBouts[0];
    if (position === 'semi2' && sortedBouts.length > 1) return sortedBouts[1];
    if (position === 'final' && sortedBouts.length > 2) return sortedBouts[2];
    
    return null;
  };
  
  // Find the champion (winner of the final bout)
  const findChampion = (): RosterFighter | null => {
    const finalBout = findBout('final');
    if (!finalBout) return null;
    
    // If the final bout has a winner
    if (finalBout.red?.result === 'W') return finalBout.red;
    if (finalBout.blue?.result === 'W') return finalBout.blue;
    
    return null;
  };
  
  // Get bouts for each position
  const semiFinal1 = findBout('semi1');
  const semiFinal2 = findBout('semi2');
  const final = findBout('final');
  const champion = findChampion();
  
  // Handle display when fewer than 4 fighters
  const hasBye = bracket && bracket.bye;
  
  return (
    <Card className="w-full mb-4 overflow-hidden">
      <CardContent className="p-4">
        <h3 className="text-xl font-bold text-center mb-4">{title}</h3>
        
        <div className="flex flex-col items-center">
          {/* Semi-finals row */}
          <div className="flex justify-around w-full">
            <div className="flex-1">
              <BracketMatch 
                bout={semiFinal1} 
                handleFighterClick={handleFighterClick}
                onBoutSelect={onBoutSelect}
                isSemiFinal={true}
              />
            </div>
            
            <div className="flex-1">
              <BracketMatch 
                bout={semiFinal2} 
                handleFighterClick={handleFighterClick}
                onBoutSelect={onBoutSelect}
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
          
          {/* Finals row */}
          <div className="flex justify-center w-full">
            <BracketMatch 
              bout={final} 
              handleFighterClick={handleFighterClick}
              onBoutSelect={onBoutSelect}
            />
          </div>
          
          {/* Champion */}
          <div className="mt-4">
            <ChampionDisplay fighter={champion} handleFighterClick={handleFighterClick} />
          </div>
          
          {/* Bye fighter if exists */}
          {hasBye && (
            <div className="mt-6 p-2 border border-dashed border-gray-300 rounded-md">
              <p className="text-sm font-medium mb-1">Bye (advances directly):</p>
              <div className="flex items-center space-x-2">
                <Image
                  src={bracket.bye ? getPhotoUrl(bracket.bye) : "/images/techbouts_fighter_icon.png"}
                  alt={`${bracket.bye?.first ?? 'Unknown'} ${bracket.bye?.last ?? 'Fighter'}`}
                  width={30}
                  height={30}
                  className="rounded-md"
                />
                <p className="text-sm">
                  {bracket.bye?.first ?? 'Unknown'} {bracket.bye?.last ?? 'Fighter'} ({bracket.bye?.gym || 'No gym'})
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// MultipleWeightclassBrackets Component (for displaying multiple brackets organized by weightclass)
interface MultipleWeightclassBracketsProps {
  brackets: Bracket[];
  eventId: string;
  promoterId: string;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
}

export function MultipleWeightclassBrackets({
  brackets,
  eventId,
  promoterId,
  handleFighterClick,
  onBoutSelect
}: MultipleWeightclassBracketsProps) {
  // Group brackets by weightclass
  const groupedBrackets: {[key: string]: Bracket[]} = {};
  
  brackets.forEach(bracket => {
    // Use the first bout's weightclass as the bracket's weightclass
    const weightclass = bracket.bouts && bracket.bouts.length > 0 ? 
      bracket.bouts[0].weightclass : 0;
      
    const key = weightclass ? `${weightclass}` : 'Unspecified';
    
    if (!groupedBrackets[key]) {
      groupedBrackets[key] = [];
    }
    
    groupedBrackets[key].push(bracket);
  });
  
  return (
    <div className="space-y-8">
      {Object.entries(groupedBrackets).map(([weightclass, brackets]) => (
        <div key={weightclass} className="border border-gray-200 rounded-md overflow-hidden">
          <div className="bg-gray-100 p-2 font-bold">
            {weightclass === 'Unspecified' ? 'Open Weight' : `${weightclass} lbs Weightclass`}
          </div>
          
          <div className="p-2">
            {brackets.map((bracket, index) => (
              <BracketDisplay
                key={index}
                bracket={bracket}
                eventId={eventId}
                promoterId={promoterId}
                handleFighterClick={handleFighterClick}
                onBoutSelect={onBoutSelect}
                title={brackets.length > 1 ? `Bracket ${index + 1}` : undefined}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}