// app/events/[promoterId]/[eventId]/matches/MatchesDisplay.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import Image from 'next/image';
import { RosterFighter, Bout, EventType } from '@/utils/types';
import { FaEdit } from "react-icons/fa";

interface MatchesDisplayProps {
  bouts: Bout[];
  promoterId: string;
  eventId: string;
  isAdmin?: boolean;
  eventData: EventType;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
}

export default function MatchesDisplay({
  bouts,
  isAdmin,
  eventData,
  handleFighterClick,
  onBoutSelect
}: MatchesDisplayProps) {
  const [showCompletedBouts, setShowCompletedBouts] = useState(() => {
    if (eventData && eventData.date) {
      const eventDate = new Date(eventData.date);
      const currentDate = new Date();
      
      // Reset time components to compare just the dates
      eventDate.setHours(0, 0, 0, 0);
      currentDate.setHours(0, 0, 0, 0);
      
      // Calculate difference in days
      const diffTime = currentDate.getTime() - eventDate.getTime();
      const diffDays = diffTime / (1000 * 60 * 60 * 24);
      
      // Return true if event date is at least 1 day in the past
      return diffDays >= 1;
    }
    return false;
  });


  const [selectedRing, setSelectedRing] = useState<number | null>(null);

  const ringNumbers = useMemo(() => {
    const rings = new Set<number>();
    bouts.forEach(bout => {
      // Check both ringNum and ringNumber properties since your data shows ringNum
      const ring = bout.ringNum || bout.ringNum || 1;
      rings.add(ring);
    });
    return Array.from(rings).sort((a, b) => a - b);
  }, [bouts]);

  const filteredBouts = useMemo(() => {
    if (selectedRing === null) return bouts;
    return bouts.filter(bout => {
      // Check both ringNum and ringNumber properties
      const ring = bout.ringNum || bout.ringNum || 1;
      return ring === selectedRing;
    });
  }, [bouts, selectedRing]);



  // Function to check if a bout is finished
  const isBoutFinished = (bout: Bout): boolean => {
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



  // Separate filtered bouts into finished and unfinished
  const { finishedBouts, unfinishedBouts } = useMemo(() => {
    return filteredBouts.reduce((acc, bout) => {
      if (isBoutFinished(bout)) {
        acc.finishedBouts.push(bout);
      } else {
        acc.unfinishedBouts.push(bout);
      }
      return acc;
    }, { finishedBouts: [] as Bout[], unfinishedBouts: [] as Bout[] });
  }, [filteredBouts]);




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
    if (text.length > maxLength) {
      return text.substring(0, maxLength) + '.';
    }
    return text;
  };

  // Component to render fighter stats
  const FighterStats = ({ fighter, align }: { fighter: RosterFighter, align: 'left' | 'right' }) => (
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

  // Component to render a bout row
  const BoutRow = ({ bout, index }: { bout: Bout, index: number }) => {
    const redFighter = bout.red;
    const blueFighter = bout.blue;

    if (!redFighter || !blueFighter) return null;

    return (
      <TableRow key={index}>
        {/* RED FIGHTER */}
        <TableCell>
          <div className="flex items-center justify-start relative">
            <FighterStats fighter={redFighter} align="left" />
            
            <div
              className="cursor-pointer flex-shrink-0"
              onClick={() => handleFighterClick(redFighter)}
            >
              <Image
          src={getPhotoUrl(redFighter)}
          alt="Red Fighter"
          width={40}
          height={40}
          className="rounded-md mr-auto -mb-1"
              />
     <div className="flex justify-start bg-gray-100 border border-black rounded-md mr-auto ml-1 pl-1 pr-1"
                   style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
                   >
         
        
          
           <div className="text-center pl-0.5"
           
           >
             {redFighter.gender?.startsWith('F') ? (
               <span className="text-pink-500">F</span>
             ) : redFighter.gender?.startsWith('M') ? (
               <span className="text-blue-500">M</span>
             ) : (
              redFighter.gender
             )}
           </div>
           <div className="text-center pl-0.5">{redFighter.age}</div>

           {redFighter.weighin > 0 && <div className='ml-1'>{redFighter.weighin} lbs</div>}

               </div>
              <div className="text-left">
          <div
            className="font-medium"
            style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
          >
            {truncateText(redFighter.first, 8)} {truncateText(redFighter.last, 8)}
          </div>
          <div className="text-sm text-gray-500"
            style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
          >
            {truncateText(redFighter.gym, 15)}
          </div>
              </div>
            </div>
          </div>
        </TableCell>
      {/* CENTER CONTENT */}
        <TableCell className="text-center">
        {isAdmin && (
        <div
          className="p-1 cursor-pointer hover:bg-gray-100 mb-2 flex justify-center items-center"
          onClick={() => {
            if (onBoutSelect) {
        onBoutSelect(bout);
            } else {
        console.log('Bout selected:', bout.boutId || 'bout has no ID');
            }
          }}
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
          <div>{bout.bout_type}</div>
          {/* Show result if bout is finished */}
          {isBoutFinished(bout) && (
            <div className="mt-2 font-bold">
              <div className="text-red-600">{redFighter.result}</div>
              <div className="text-blue-600">{blueFighter.result}</div>
            </div>
          )}
        </TableCell>
      {/* BLUE FIGHTER */}
        <TableCell>
          <div className="flex items-center justify-end relative">
            <FighterStats fighter={blueFighter} align="right" />

            <div
              className="cursor-pointer flex-shrink-0 text-right"
              onClick={() => handleFighterClick(blueFighter)}
            >
              <Image
          src={getPhotoUrl(blueFighter)}
          alt="Blue Fighter"
          width={40}
          height={40}
          className="rounded-md ml-auto -mb-1"
              />

                <div className="flex justify-end bg-gray-100 border border-black rounded-md ml-auto mr-1 pl-1 pr-1"
                   style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
                >
               
              {blueFighter.weighin > 0 && <div className='mr-1'>{blueFighter.weighin} lbs</div>}
               
                <div className="text-center pl-0.5">
                {blueFighter.gender?.startsWith('F') ? (
                <span className="text-pink-500">F</span>
                ) : blueFighter.gender?.startsWith('M') ? (
                <span className="text-blue-500">M</span>
                ) : (
                blueFighter.gender
                )}
                </div>
                <div className="text-center pl-0.5">{blueFighter.age}</div>
                </div>

              <div className="text-right">



          <div
            className="font-medium"
            style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
          >
            {truncateText(blueFighter.first, 8)} {truncateText(blueFighter.last, 8)}
          </div>
          <div
            className="text-sm text-gray-500"
            style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)', lineHeight: '1.1' }}
          >
            {truncateText(blueFighter.gym, 15)}
          </div>
              </div>
            </div>
          </div>
        </TableCell>
      </TableRow>
    );
  };

  return (
    <Card className="w-full">
      <CardHeader>

      {ringNumbers.length > 1 && (
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => setSelectedRing(null)}
              variant={selectedRing === null ? "default" : "outline"}
              size="sm"
              className="min-w-[80px]"
            >
              All Rings
            </Button>
            {ringNumbers.map(ringNum => (
              <Button
                key={ringNum}
                onClick={() => setSelectedRing(ringNum)}
                variant={selectedRing === ringNum ? "default" : "outline"}
                size="sm"
                className="min-w-[80px]"
              >
                Ring {ringNum}
              </Button>
            ))}
          </div>
        )}


        {finishedBouts.length > 0 && (
          <Button
            onClick={() => setShowCompletedBouts(!showCompletedBouts)}
            variant="outline"
            className="mb-4"
          >
            {showCompletedBouts ? 'Hide' : 'Show'} Completed Bouts ({finishedBouts.length})
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {bouts.length === 0 ? (
          <p className="text-muted-foreground">No matches created yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell className="text-center">Red Corner</TableCell>
                <TableCell className="text-center">Match Info</TableCell>
                <TableCell className="text-center">Blue Corner</TableCell>
              </TableRow>
            </TableHeader>
            <TableBody>
              {/* Completed bouts section - toggleable */}
              {showCompletedBouts && finishedBouts.length > 0 && (
                <>
                  <TableRow>
                    <TableCell colSpan={3} className="bg-gray-100 font-bold text-center">
                      Completed Bouts
                    </TableCell>
                  </TableRow>
                  {finishedBouts.map((bout, index) => (
                    <BoutRow key={`finished-${index}`} bout={bout} index={index} />
                  ))}
                  <TableRow>
                    <TableCell colSpan={3} className="bg-gray-100 font-bold text-center">
                      Upcoming Bouts
                    </TableCell>
                  </TableRow>
                </>
              )}

              {/* Unfinished bouts section - always shown */}
              {unfinishedBouts.map((bout, index) => (
                <BoutRow key={`unfinished-${index}`} bout={bout} index={index} />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}