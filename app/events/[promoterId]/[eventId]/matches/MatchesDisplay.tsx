'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { RosterFighter, Bout, EventType } from '@/utils/types';
import CreateBout from './CreateBout';

interface MatchesDisplayProps {
  bouts: Bout[] ;
  promoterId: string;
  eventId: string;
  isAdmin?: boolean;
  eventData: EventType;
}

export default function MatchesDisplay({
  bouts,
  promoterId,
  eventId,
  isAdmin,
  eventData

}: MatchesDisplayProps) {
  console.log('Matching Display', bouts);
  const [selectedBout, setSelectedBout] = useState<Bout | null>(null);

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

  // const getGymId = (gym: string | undefined): string => {
  //   if (!gym) return '';
  //   return gym.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  // };


  const handleRowClick = (bout: Bout) => {
    if (isAdmin) {
      setSelectedBout(bout);
    }
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
                  <TableRow key={index}
                  onClick={() => handleRowClick(bout)}
                  className={isAdmin ? "cursor-pointer hover:bg-gray-100" : ""}
                  >
                    <TableCell className="text-center">
                      <Image
                        src={getPhotoUrl(redFighter)}
                        alt="Red Fighter"
                        width={80}
                        height={80}
                        className="rounded-md mx-auto"
                      />
                      <div>{`${redFighter.first} ${redFighter.last}`}</div>
                      <div>{redFighter.gym}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div>Bout {bout.boutNum}</div>
                      <div>{bout.weightclass} lbs</div>
                      <div>{bout.bout_type}</div>
                    </TableCell>
                    <TableCell className="text-center">
                      <Image
                        src={getPhotoUrl(blueFighter)}
                        alt="Blue Fighter"
                        width={80}
                        height={80}
                        className="rounded-md mx-auto"
                      />
                      <div>{`${blueFighter.first} ${blueFighter.last}`}</div>
                      <div>{blueFighter.gym}</div>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}

{isAdmin && selectedBout && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold mb-2">Edit Selected Bout</h2>
            {/* 
                Pass the selected bout data in to CreateBout. 
                If your CreateBout has separate "red" and "blue" props, you can do something like:
            */}
            <CreateBout
              // Provide full roster if needed or however you fetch it
              roster={[]}
              promoterId={promoterId}
              eventId={eventId}
              isAdmin={isAdmin}

              // Pre-populate from the selected bout
              red={selectedBout.red || null}
              blue={selectedBout.blue || null}
              boutNum={selectedBout.boutNum ?? 1}
              setBoutNum={() => { } }
              weightclass={selectedBout.weightclass ?? 0}
              setWeightclass={() => { } }
              ringNum={selectedBout.ringNum ?? 1}
              setRingNum={() => { } }
              dayNum={selectedBout.dayNum ?? 1}
              setDayNum={() => { } }
              bout_type={selectedBout.bout_type ?? "MT"}
              setBoutType={() => { } }
              boutConfirmed={false}
              setBoutConfirmed={() => { } }
              isCreatingMatch={false}
              setIsCreatingMatch={() => { } }
              setRed={() => { } }
              setBlue={() => { } }
              eventData={eventData}
              action="edit"
              existingBoutId={selectedBout.boutId} onClose={function (): void {
                throw new Error('Function not implemented.');
              } }
            
            />
          </div>
        )}

      </CardContent>
    </Card>
  );
}