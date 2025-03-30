'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Image from 'next/image';
import { FullContactFighter, Bout } from '@/utils/types';


interface MatchesDisplayProps {
  bouts: Bout[] ;
  promoterId: string;
  eventId: string;

}

export default function MatchesDisplay({
  bouts
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

  const getPhotoUrl = (fighter: FullContactFighter): string => {
    return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
  };

  // const getGymId = (gym: string | undefined): string => {
  //   if (!gym) return '';
  //   return gym.toUpperCase().replace(/[^A-Z0-9]/g, '_');
  // };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Existing Matches</CardTitle>
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
      </CardContent>
    </Card>
  );
}