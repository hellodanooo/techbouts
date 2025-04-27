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
  onBoutSelect: (bout: Bout) => void;
}

export default function MatchesDisplay({
  bouts,
  isAdmin,
  handleFighterClick,
  onBoutSelect
}: MatchesDisplayProps) {
  const [showCompletedBouts, setShowCompletedBouts] = useState(false);

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

  // Separate bouts into finished and unfinished
  const { finishedBouts, unfinishedBouts } = useMemo(() => {
    return bouts.reduce((acc, bout) => {
      if (isBoutFinished(bout)) {
        acc.finishedBouts.push(bout);
      } else {
        acc.unfinishedBouts.push(bout);
      }
      return acc;
    }, { finishedBouts: [] as Bout[], unfinishedBouts: [] as Bout[] });
  }, [bouts]);

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
      return text.substring(0, maxLength) + '...';
    }
    return text;
  };

  // Component to render fighter stats
  const FighterStats = ({ fighter, align }: { fighter: RosterFighter, align: 'left' | 'right' }) => (
    <div className={`absolute top-0 ${align === 'left' ? 'right-0' : 'left-0'} text-xs`}
      style={{ fontSize: 'clamp(0.5rem, 1vw, 1.5rem)' }}
    >
      <table className="border-collapse" style={{ lineHeight: '0.8' }}>
        <tbody>
         
            <tr>
              <td className="custom-font-megapunch opacity-30 w-10 text-center py-0 pr-0">YRS:</td>
              <td className="text-center py-0 pl-0.5">{fighter.years_exp}</td>
            </tr>
       
          {(fighter.mt_win > 0 || fighter.mt_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 w-10 text-center py-0 pr-0">MT:</td>
              <td className="text-center py-0 pl-0.5">{fighter.mt_win}-{fighter.mt_loss}</td>
            </tr>
          )}
          {(fighter.mma_win > 0 || fighter.mma_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 w-10 text-center py-0 pr-0">MMA:</td>
              <td className="text-center py-0 pl-0.5">{fighter.mma_win}-{fighter.mma_loss}</td>
            </tr>
          )}
          {(fighter.pmt_win > 0 || fighter.pmt_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 w-10 text-center py-0 pr-0">PMT:</td>
              <td className="text-center py-0 pl-0.5">{fighter.pmt_win}-{fighter.pmt_loss}</td>
            </tr>
          )}
          {(fighter.pb_win > 0 || fighter.pb_loss > 0) && (
            <tr>
              <td className="custom-font-megapunch opacity-30 w-10 text-center py-0 pr-0">PBSC:</td>
              <td className="text-center py-0 pl-0.5">{fighter.pb_win}-{fighter.pb_loss}</td>
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
                className="rounded-md"
              />

              <div className="text-left">
                <div
                  className="font-medium"
                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}
                >
                  {truncateText(redFighter.first, 8)} {truncateText(redFighter.last, 8)}
                </div>
                <div className="text-sm text-gray-500"
                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}
                >
                  {truncateText(redFighter.gym, 15)}
                </div>
              </div>
            </div>
          </div>
        </TableCell>

        <TableCell className="text-center">
          {isAdmin && (
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
          <div>{bout.bout_type}</div>
          {/* Show result if bout is finished */}
          {isBoutFinished(bout) && (
            <div className="mt-2 font-bold">
              <div className="text-red-600">{redFighter.result}</div>
              <div className="text-blue-600">{blueFighter.result}</div>
            </div>
          )}
        </TableCell>

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
                className="rounded-md ml-auto"
              />
              <div className="text-right">
                <div
                  className="font-medium"
                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}
                >
                  {truncateText(blueFighter.first, 8)} {truncateText(blueFighter.last, 8)}
                </div>
                <div
                  className="text-sm text-gray-500"
                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}
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