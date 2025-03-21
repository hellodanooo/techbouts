'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';
import Image from 'next/image';



export type Fighter = {
  first?: string;
  last?: string;
  gym?: string;
  weightclass?: string | number;
  age?: string | number;
  experience?: string | number;
  status?: string;
  gender: string;
  fighter_id?: string;
  id?: string;
  bout?: number;
  ring?: number;
  opponent_id?: string;
  opponent_name?: string;
  corner?: 'red' | 'blue'; // Using the corner field
  photo?: string;
  [key: string]: string | number | undefined;
}

interface MatchesDisplayProps {
  roster: Fighter[];
  promoterId: string;
  eventId: string;
}

export default function MatchesDisplay({
  roster
}: MatchesDisplayProps) {
  // Separate matched fighters
  const matchedFighters = useMemo(() => {
    return roster.filter(fighter => fighter.bout !== undefined && fighter.ring !== undefined);
  }, [roster]);

  // Group matched fighters by bout and ring
  const matchedPairs = useMemo(() => {
    const pairsByBoutAndRing = new Map();

    matchedFighters.forEach(fighter => {
      const key = `${fighter.bout}-${fighter.ring}`;
      if (!pairsByBoutAndRing.has(key)) {
        pairsByBoutAndRing.set(key, []);
      }
      pairsByBoutAndRing.get(key).push(fighter);
    });

    // Convert map to array, sort by ring first, then bout number
    return Array.from(pairsByBoutAndRing.values())
      .filter(pair => pair.length === 2) // Only include complete pairs
      .sort((a, b) => {
        // First sort by ring
        const ringA = a[0].ring || 0;
        const ringB = b[0].ring || 0;
        if (ringA !== ringB) {
          return ringA - ringB;
        }
        // Then sort by bout number
        return (a[0].bout || 0) - (b[0].bout || 0);
      });
  }, [matchedFighters]);

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
  
  const getPhotoUrl = (fighter: Fighter): string => {
    return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Existing Matches</CardTitle>
      </CardHeader>
      <CardContent>
        {matchedPairs.length === 0 ? (
          <p className="text-muted-foreground">No matches created yet</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <th className="text-center">Red Corner</th>
                <th></th>
                <th className="text-center">Match Info</th>
                <th></th>
                <th className="text-center">Blue Corner</th>
              </TableRow>
            </TableHeader>
            <TableBody>
              {matchedPairs.map((pair, index) => {
                // Find red and blue fighters using the corner property first
                let redFighter = pair.find((f: Fighter) => f.corner === 'red');
                let blueFighter = pair.find((f: Fighter) => f.corner === 'blue');
                
                // Fallback methods if corner property isn't set
                if (!redFighter || !blueFighter) {
                  // Try to find pairs by opponent_id relationships
                  const firstFighter = pair[0];
                  const secondFighter = pair[1];
                  
                  if (firstFighter && secondFighter) {
                    // If we can't find by corner, just assign the first fighter as red and second as blue
                    redFighter = firstFighter;
                    blueFighter = secondFighter;
                  } else {
                    // Skip this pair if incomplete
                    return null;
                  }
                }

                if (!redFighter || !blueFighter) return null;

                return (
                  <TableRow key={index}>
                    <TableCell>
                      <div className="flex flex-col justify-center items-center">
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/fighter/${redFighter.fighter_id}`}
                        >
                          <div className="custom-font-megapunch text-xl tracking-[.1em] text-center">
                            {`${redFighter.first || ''} ${redFighter.last || ''}`}
                          </div>
                        </Link>
                        <div>
                          {redFighter.gym}
                        </div>
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="relative h-24 w-24 mx-auto overflow-hidden rounded-md">
                        <Image 
                          src={getPhotoUrl(redFighter)} 
                          alt={`${redFighter.first} ${redFighter.last}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>

                    <TableCell className="flex flex-col justify-center items-center text-center">
                      <div>Bout {redFighter.bout}</div>
                      <div className="custom-font-megapunch text-xl text-center">
                        VS
                      </div>
                      <div>
                        {redFighter.weightclass} lbs
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="relative h-24 w-24 mx-auto overflow-hidden rounded-md">
                        <Image 
                          src={getPhotoUrl(blueFighter)} 
                          alt={`${blueFighter.first} ${blueFighter.last}`}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col justify-center items-center">
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/fighter/${blueFighter.fighter_id}`}
                        >
                          <div className="custom-font-megapunch text-xl tracking-[.1em] text-center">
                            {`${blueFighter.first || ''} ${blueFighter.last || ''}`}
                          </div>
                        </Link>
                        <div className="text-center">
                          {blueFighter.gym}
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