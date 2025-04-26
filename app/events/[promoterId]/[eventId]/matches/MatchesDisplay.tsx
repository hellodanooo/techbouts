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
                    <div className="flex items-center gap-2">
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
                      </div>
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
                    <div>Bout {bout.boutNum}</div>
                    <div
                    
                    >{bout.weightclass} lbs</div>
                    <div>{bout.bout_type}</div>
                  </TableCell>
              
                  {/* Blue Corner - Fighter Image & Info combined */}
                  <TableCell className="text-center">
                    <div className="flex items-center justify-end gap-4">
                      <div className="text-right">
                        <div className="font-medium"
                                                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}

                        >{`${blueFighter.first} ${blueFighter.last}`}</div>
                        <div className="text-sm text-gray-500"
                                                  style={{ fontSize: 'clamp(0.7rem, 2vw, 1.5rem)' }}

                        >{blueFighter.gym}</div>
                      </div>
                      <div 
                        className="cursor-pointer flex-shrink-0" 
                        onClick={() => handleFighterClick(blueFighter)}
                      >
                        <Image
                          src={getPhotoUrl(blueFighter)}
                          alt="Blue Fighter"
                          width={40}
                          height={40}
                          className="rounded-md"
                        />
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