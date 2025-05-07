// components/matches/BoutDisplay.tsx

import React from 'react';
import { TableRow, TableCell } from "@/components/ui/table";
import { Bout, RosterFighter } from '@/utils/types';
import Image from 'next/image';
import { FaEdit } from "react-icons/fa";
import { Button } from "@/components/ui/button";
import { isBoutFinished } from '@/utils/events/matches';
import { 
  BracketButton,
  isBracketBout as bracketIsBracketBout,
  hasFinalBout as bracketHasFinalBout
} from '@/components/matches/BracketContainer';
import { 
  findBoutNumRedFinal,
  findBoutNumBlueFinal
} from '@/utils/brackets';

// Re-export the imported functions
export const isBracketBout = bracketIsBracketBout;
export const hasFinalBout = bracketHasFinalBout;

// FighterStats Component
interface FighterStatsProps {
  fighter: RosterFighter;
  align: 'left' | 'right';
}

// Define FighterStats component without using 'export' keyword here
function FighterStats({ fighter, align }: FighterStatsProps) {
  return (
    <div className={`absolute flex top-0 ${align === 'left' ? 'right-0' : 'left-0'} text-xs`}
      style={{ fontSize: 'clamp(0.5rem, 1vw, 1.5rem)' }}
    >
      <table className="border-collapse" style={{ lineHeight: '0.8', borderSpacing: '0px' }}>
        <tbody>
          <tr>
            <td className="custom-font-megapunch opacity-30 text-right">YRS:</td>
            <td className="text-left">{fighter.years_exp}</td>
          </tr>
          
          {(fighter.mt_win > 0 || fighter.mt_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 text-right">MT:</td>
              <td className="text-left ">{fighter.mt_win}-{fighter.mt_loss}</td>
            </tr>
          )}
          
          {(fighter.mma_win > 0 || fighter.mma_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 w-5 text-right">MMA:</td>
              <td className="text-left ">{fighter.mma_win}-{fighter.mma_loss}</td>
            </tr>
          )}
          
          {(fighter.pmt_win > 0 || fighter.pmt_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 w-10 text-right">PMT:</td>
              <td className="text-left">{fighter.pmt_win}-{fighter.pmt_loss}</td>
            </tr>
          )}
          
          {(fighter.pb_win > 0 || fighter.pb_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 w-10 text-right">PBSC:</td>
              <td className="text-left">{fighter.pb_win}-{fighter.pb_loss}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

// FighterDisplay Component for single fighter display
interface FighterDisplayProps {
  fighter: RosterFighter | null;
  corner: 'red' | 'blue';
  handleFighterClick?: (fighter: RosterFighter) => void;
  handleEditFighter?: (fighter: RosterFighter) => void;
  handleDeleteFighter?: (fighter: RosterFighter) => void;
  showControls?: boolean;
}

// Define FighterDisplay component without using 'export' keyword here
function FighterDisplay({ 
    fighter, 
    corner, 
    handleFighterClick,
    handleEditFighter,
    handleDeleteFighter,
    showControls = false
  }: FighterDisplayProps) {
    if (!fighter) {
      return (
        <div className={`border border-${corner === 'red' ? 'red-500' : 'blue-500'} p-2 rounded-md`}>
          <p className="text-muted-foreground">
            {corner === 'red' ? "No Red Fighter Selected" : "Select Another Fighter to Create Match"}
          </p>
        </div>
      );
    }
  
    const isValidUrl = (url: string | undefined): boolean => {
      if (!url) return false;
      try {
        new URL(url);
        return true;
      } catch {
        return false;
      }
    };
  
    const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";
  
    const getPhotoUrl = (fighter: RosterFighter): string => {
      return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
    };
  
    return (
      <div className={`border border-${corner === 'red' ? 'red-500' : 'blue-500'} p-2 rounded-md w-full`}>
        <p className="font-medium mb-2">{corner === 'red' ? 'Red Corner' : 'Blue Corner'}</p>
        
        <div className="flex flex-col w-full">
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center">
              {handleFighterClick && (
                <div className="mr-2 cursor-pointer" onClick={() => handleFighterClick(fighter)}>
                  <Image
                    src={getPhotoUrl(fighter)}
                    alt={`${corner} Fighter`}
                    width={40}
                    height={40}
                    className="rounded-md"
                  />
                </div>
              )}
              
              <div>
                <p className="font-semibold">{`${fighter.first || ''} ${fighter.last || ''}`}</p>
                <p className="text-sm">{fighter.gym || 'No gym'}</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center">
                {fighter.age && (
                  <p className="text-sm mr-2">
                    Age: {fighter.age}
                  </p>
                )}
                {fighter.weighin && (
                  <p className="text-sm">
                    Weigh-in: {fighter.weighin} lbs
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col items-end">
              <p>{fighter.weightclass || 'No Weight'}</p>
              <p>{fighter.gender || 'No Gender'}</p>
            </div>
          </div>
          
          {showControls && (
            <div className="flex items-center justify-end w-full mt-2">
              {handleEditFighter && (
                <Button
                  variant="outline"
                  size="sm"
                  className="mr-2"
                  onClick={() => handleEditFighter(fighter)}
                >
                  Edit
                </Button>
              )}
              
              {handleDeleteFighter && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => handleDeleteFighter(fighter)}
                >
                  Delete
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

// BoutRow Component with built-in bracket handling
interface BoutRowProps {
  bout: Bout;
  allBouts: Bout[];
  index: number;
  isAdmin?: boolean;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
  source?: 'MatchesDisplay' | 'BracketDisplay';
}

// Define BoutRow component without using 'export' keyword here
function BoutRow({ 
  bout, 
  allBouts,
  index, 
  isAdmin, 
  handleFighterClick,
  onBoutSelect,
  source

}: BoutRowProps) {
 
  
  // Use the bracket context
  const isFinalBout = bout.bracket_bout_type === 'final';

  if (!isFinalBout && (!bout.red || !bout.blue)) return null;
  const redFighter = bout.red;
  const blueFighter = bout.blue;


  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";

  const getPhotoUrl = (fighter: RosterFighter): string => {
    return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
  };

  const truncateText = (text: string, maxLength: number) => {
    if (!text) return '';
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '.';
    }
    return text;
  };


//////////////////////////////////////////////////////////////////
///////////////////////// FINAL BOUT RENDERING
if (isFinalBout) {
  // For 3-fighter bracket, show the 3rd fighter (bye fighter) in blue corner
  const is3FighterBracket = bout.bracket_bout_fighters && bout.bracket_bout_fighters.length === 3;
  const byeFighter = is3FighterBracket ? (bout.bracket_bout_fighters ?? [])[2] : null;
  
  return (
    <TableRow key={index}>
      {/* RED FIGHTER - with 40% opacity for placeholder */}
      <TableCell>
        <div className="flex items-center justify-start relative opacity-40">
          {/* Placeholder stats for red corner */}
          <div
            className="cursor-pointer flex-shrink-0"
          >
            <Image
              src={defaultPhotoUrl}
              alt="Red Fighter"
              width={40}
              height={40}
              className="rounded-md mr-auto -mb-1"
            />
            <div className="flex justify-start bg-gray-100 border border-black rounded-md mr-auto ml-1 pl-1 pr-1"
              style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
            >
              <div className="text-center pl-0.5">
                <span className="text-blue-500">TBD</span>
              </div>
            </div>
            
            <div className="text-left">
              <div className="font-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}>
            
                  `Winner Bout {findBoutNumRedFinal(bout.bracket_bout_fighters || [], allBouts)}`
               
              </div>
              <div className="text-sm text-gray-500"
                style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
              >
                TBD
              </div>
            </div>
          </div>
        </div>
      </TableCell>

      {/* CENTER CONTENT */}
      <TableCell className="text-center">
        {/* Admin edit button - same as regular bouts */}
        {isAdmin && onBoutSelect && (
          <div
            className="p-1 cursor-pointer hover:bg-gray-100 mb-2 flex justify-center items-center"
            onClick={() => onBoutSelect(bout)}
          >
            <FaEdit style={{ fontSize: '1.2rem' }} />
          </div>
        )}
        
        {/* Bout details - same as regular bouts */}
        <div
          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-400 mx-auto"
          style={{ fontSize: '0.9rem' }}
        >
          {bout.boutNum}
        </div>
        <div>{bout.weightclass}</div>
        <div>{bout.bout_ruleset}</div>
        
        {/* Bracket button */}
        {source !== 'BracketDisplay' && (
          <BracketButton 
            bout={bout}
            allBouts={allBouts} 
            bracketFighters={bout.bracket_bout_fighters || []}
          />
        )}
      </TableCell>

      {/* BLUE FIGHTER */}
      <TableCell>
        {is3FighterBracket && byeFighter ? (
          // Show actual bye fighter for 3-fighter bracket
          <div className="flex items-center justify-end relative">
            {byeFighter && <FighterStats fighter={byeFighter} align="right" />}

            <div
              className="cursor-pointer flex-shrink-0 text-right"
              onClick={() => byeFighter && handleFighterClick(byeFighter)}
            >
              <Image
                src={getPhotoUrl(byeFighter)}
                alt="Blue Fighter"
                width={40}
                height={40}
                className="rounded-md ml-auto -mb-1"
              />
              <div className="flex justify-end bg-gray-100 border border-black rounded-md ml-auto mr-1 pl-1 pr-1"
                style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
              >
                {byeFighter && byeFighter.weighin > 0 && <div className='mr-1'>{byeFighter.weighin} lbs</div>}
                <div className="text-center pl-0.5">
                  {byeFighter && byeFighter.gender?.startsWith('F') ? (
                    <span className="text-pink-500">F</span>
                  ) : byeFighter?.gender?.startsWith('M') ? (
                    <span className="text-blue-500">M</span>
                  ) : (
                    byeFighter ? byeFighter.gender : null
                  )}
                </div>
                <div className="text-center pl-0.5">{byeFighter ? byeFighter.age : null}</div>
              </div>

              <div className="text-right">
                <div
                  className="font-medium"
                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
                >
                  {byeFighter && truncateText(byeFighter.first, 8)} {byeFighter && truncateText(byeFighter.last, 8)}
                </div>
                <div
                  className="text-sm text-gray-500"
                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
                >
                  {byeFighter ? truncateText(byeFighter.gym, 15) : null}
                </div>
              </div>
            </div>
          </div>
        ) : (
          // Show placeholder for 4-fighter bracket
          <div className="flex items-center justify-end relative opacity-40">
            <div
              className="cursor-pointer flex-shrink-0 text-right"
            >
              <Image
                src={defaultPhotoUrl}
                alt="Blue Fighter"
                width={40}
                height={40}
                className="rounded-md ml-auto -mb-1"
              />
              <div className="flex justify-end bg-gray-100 border border-black rounded-md ml-auto mr-1 pl-1 pr-1"
                style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
              >
                <div className="text-center pl-0.5">
                  <span className="text-blue-500">TBD</span>
                </div>
              </div>
  
              <div className="text-right">
                <div className="font-medium" style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}>
                  Winner Bout {findBoutNumBlueFinal(bout.bracket_bout_fighters || [], allBouts)}
                </div>
                <div
                  className="text-sm text-gray-500"
                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
                >
                  TBD
                </div>
              </div>
            </div>
          </div>
        )}
      </TableCell>
    </TableRow>
  );
}
//////////////////////////////////////////////////////////////////
//////////////////////////////////////////////////////////////////

  // Standard bout row display 
  return (
    <TableRow key={index}>
      {/* RED FIGHTER */}
      <TableCell>
        <div className="flex items-center justify-start relative">
          {redFighter && <FighterStats fighter={redFighter} align="left" />}
          
          <div
            className="cursor-pointer flex-shrink-0"
            onClick={() => redFighter && handleFighterClick(redFighter)}
          >
            <Image
              src={redFighter ? getPhotoUrl(redFighter) : defaultPhotoUrl}
              alt="Red Fighter"
              width={40}
              height={40}
              className="rounded-md mr-auto -mb-1"
            />
            <div className="flex justify-start bg-gray-100 border border-black rounded-md mr-auto ml-1 pl-1 pr-1"
              style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
            >
              <div className="text-center pl-0.5">
                {redFighter && redFighter.gender?.startsWith('F') ? (
                  <span className="text-pink-500">F</span>
                ) : redFighter?.gender?.startsWith('M') ? (
                  <span className="text-blue-500">M</span>
                ) : (
                  redFighter ? redFighter.gender : null
                                  )}
              </div>
              <div className="text-center pl-0.5">{redFighter ? redFighter.age : null}</div>
              {redFighter && redFighter.weighin > 0 && <div className='ml-1'>{redFighter.weighin} lbs</div>}
            </div>
            
            <div className="text-left">
              <div
                className="font-medium"
                style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
              >
                {redFighter && truncateText(redFighter.first, 8)} {redFighter && truncateText(redFighter.last, 8)}
              </div>
              <div className="text-sm text-gray-500"
                style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
              >
                {redFighter ? truncateText(redFighter.gym, 15) : null}
              </div>
            </div>
          </div>
        </div>
      </TableCell>

      {/* CENTER CONTENT */}
      <TableCell className="text-center">
        
        {isAdmin && onBoutSelect && (
          <div
            className="p-1 cursor-pointer hover:bg-gray-100 mb-2 flex justify-center items-center"
            onClick={() => onBoutSelect(bout)}
          >
            <FaEdit style={{ fontSize: '1.2rem' }} />
          </div>
        )}




        <div
          className="flex items-center justify-center w-8 h-8 rounded-full border border-gray-400 mx-auto"
          style={{ fontSize: '0.9rem' }}
        >
          {bout.boutNum}
        </div>
        <div>{bout.weightclass}</div>
        <div>{bout.bout_ruleset}</div>
        {/* Show result if bout is finished */}
        {isBoutFinished(bout) && (
          <div className="mt-2 font-bold">
            {redFighter && <div className="text-red-600">{redFighter.result}</div>}
            {blueFighter && <div className="text-blue-600">{blueFighter.result}</div>}
          </div>
        )}


        {(bout.bracket_bout_type === 'semifinal') && (source !== 'BracketDisplay') && (
          <BracketButton 
          bout={bout} 
          allBouts={allBouts} 
          bracketFighters={bout.bracket_bout_fighters || []} 
        />

)}
      </TableCell>

      {/* BLUE FIGHTER */}
      <TableCell>
        <div className="flex items-center justify-end relative">
          {blueFighter && <FighterStats fighter={blueFighter} align="right" />}

          <div
            className="cursor-pointer flex-shrink-0 text-right"
            onClick={() => blueFighter && handleFighterClick(blueFighter)}
          >
            <Image
              src={blueFighter ? getPhotoUrl(blueFighter) : defaultPhotoUrl}
              alt="Blue Fighter"
              width={40}
              height={40}
              className="rounded-md ml-auto -mb-1"
            />
            <div className="flex justify-end bg-gray-100 border border-black rounded-md ml-auto mr-1 pl-1 pr-1"
              style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
            >
              {blueFighter && blueFighter.weighin > 0 && <div className='mr-1'>{blueFighter.weighin} lbs</div>}
              <div className="text-center pl-0.5">
                {blueFighter && blueFighter.gender?.startsWith('F') ? (
                  <span className="text-pink-500">F</span>
                ) : blueFighter?.gender?.startsWith('M') ? (
                  <span className="text-blue-500">M</span>
                ) : (
                  blueFighter ? blueFighter.gender : null
                )}
              </div>
              <div className="text-center pl-0.5">{blueFighter ? blueFighter.age : null}</div>
            </div>

            <div className="text-right">
              <div
                className="font-medium"
                style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
              >
                {blueFighter && truncateText(blueFighter.first, 8)} {blueFighter && truncateText(blueFighter.last, 8)}
              </div>
              <div
                className="text-sm text-gray-500"
                style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
              >
                {blueFighter ? truncateText(blueFighter.gym, 15) : null}
              </div>
            </div>
          </div>
        </div>
      </TableCell>
    </TableRow>
  );
}

// Export all components and functions in a single export statement
export {
  FighterStats,
  FighterDisplay,
  BoutRow
};