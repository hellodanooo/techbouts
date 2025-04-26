// app/events/[promoterId]/[eventId]/matches/MatchesDisplay.tsx
'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
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
  console.log('Matching Display', bouts);

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
    <Card className="w-full">
      <CardHeader>
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
              {bouts.map((bout, index) => {
                const redFighter = bout.red;
                const blueFighter = bout.blue;

                if (!redFighter || !blueFighter) return null;

                return (
                  <TableRow key={index}>
                    <TableCell className="text-center">
                      <div className="flex items-center gap-2 relative">

                        <div className="absolute right-5 top-0 text-xs flex flex-col gap-1">

                          {/* MT Record */}
                          <div className="flex items-center justify-center text-center"

                          >
                            <div className="custom-font-megapunch opacity-30 w-12 text-center"
                              style={{ fontSize: 'clamp(0.7rem, 1vw, 1.5rem)' }}
                              >MT:</div>
                            <div className="text-center">{redFighter.mt_win}-{redFighter.mt_loss}</div>
                          </div>

                          {/* MMA Record */}
                          <div className="flex items-center justify-center text-center">
                            <div className="custom-font-megapunch opacity-30 w-12 text-center" 
                              style={{ fontSize: 'clamp(0.7rem, 1vw, 1.5rem)' }}
                              >MMA:</div>
                            <div className="text-center">{redFighter.mma_win}-{redFighter.mma_loss}</div>
                          </div>

                          <div className="flex items-center justify-center text-center">
                            <div className="custom-font-megapunch opacity-30 w-12 text-center"
                              style={{ fontSize: 'clamp(0.7rem, 1vw, 1.5rem)' }}
                              >PMT:</div>
                            <div className="text-center">{redFighter.pmt_win}-{redFighter.pmt_loss}</div>
                          </div>

                        </div>


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
                              {`${redFighter.first} ${redFighter.last}`}
                            </div>
                            <div className="text-sm text-gray-500"
                              style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}

                            >{redFighter.gym}</div>
                          </div>

                        </div>

                      </div>
                    </TableCell>

                    {/* Match Info */}
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
                      <div

                      >{bout.weightclass}</div>
                      <div>{bout.bout_type}</div>
                    </TableCell>

                    {/* Blue Corner - Fighter Image & Info combined */}
                    <TableCell>
                      <div className="flex items-center justify-end gap-4 relative">
                        {/* MT Record in Top Left */}
                        <div className="absolute top-0 left-2 text-xs flex flex-col gap-1">
                          {/* MT Record */}
                          <div className="flex items-center justify-center text-center">
                            <div className="custom-font-megapunch opacity-30 w-12 text-center" 
                              style={{ fontSize: 'clamp(0.7rem, 1vw, 1.5rem)' }}
                              >MT:</div>
                            <div className="text-center">{blueFighter.mt_win}-{blueFighter.mt_loss}</div>
                          </div>

                          {/* MMA Record */}
                          <div className="flex items-center justify-center text-center">
                            <div className="custom-font-megapunch opacity-30 w-12 text-center"
                              style={{ fontSize: 'clamp(0.7rem, 1vw, 1.5rem)' }}
                              >MMA:</div>
                            <div className="text-center">{blueFighter.mma_win}-{blueFighter.mma_loss}</div>
                          </div>
                          

                          {/* PMT Record */}
                          <div className="flex items-center justify-center text-center">
                            <div className="custom-font-megapunch opacity-30 w-12 text-center" 
                              style={{ fontSize: 'clamp(0.7rem, 1vw, 1.5rem)' }}
                              >PMT:</div>
                            <div className="text-center">{blueFighter.pmt_win}-{blueFighter.pmt_loss}</div>
                          </div>




                        </div>



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
                              {`${blueFighter.first} ${blueFighter.last}`}
                            </div>
                            <div
                              className="text-sm text-gray-500"
                              style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}
                            >
                              {blueFighter.gym}
                            </div>
                          </div>


                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                );

              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}