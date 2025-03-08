'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import Link from 'next/link';

interface Fighter {
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

    // Convert map to array and sort by bout number
    return Array.from(pairsByBoutAndRing.values())
      .filter(pair => pair.length === 2) // Only include complete pairs
      .sort((a, b) => (a[0].bout || 0) - (b[0].bout || 0));
  }, [matchedFighters]);

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

              </TableRow>
            </TableHeader>
            <TableBody>
              {matchedPairs.map((pair, index) => {
                // Sort the pair so red corner is first, blue corner is second (if possible)
                const redFighter = pair.find((f: Fighter) => f.opponent_id && f.bout && f.ring);
                const blueFighter = pair.find((f: Fighter) => f.id === redFighter?.opponent_id || f.fighter_id === redFighter?.opponent_id);

                if (!redFighter || !blueFighter) return null;

                return (
                  <TableRow key={index}>


                    <TableCell>
                      <div
                        className='flex flex-col justify-center items-center'
                      >
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/fighter/${redFighter.fighter_id}`}
                        >
                          <div
                            className='custom-font-megapunch text-xl tracking-[.1em] text-center'
                          >

                            {`${redFighter.first || ''} ${redFighter.last || ''}`}
                          </div>
                        </Link>

                        <div>
                          {redFighter.gym}
                        </div>

                      </div>
                    </TableCell>

                    <TableCell
                      className='flex flex-col justify-center items-center text-center '
                    >

                      <div>Bout {redFighter.bout}</div>
                      <div
                        className='custom-font-megapunch text-xl text-center'
                      >
                        VS
                      </div>
                      <div>
                        {redFighter.weightclass} lbs
                      </div>
                    </TableCell>

                    <TableCell>
                      <div
                        className='flex flex-col justify-center items-center'
                      >
                        <Link
                          target="_blank"
                          rel="noopener noreferrer"
                          href={`/fighter/${blueFighter.fighter_id}`}
                        >
                          <div
                            className='custom-font-megapunch text-xl tracking-[.1em] text-center'

                          > {`${blueFighter.first || ''} ${blueFighter.last || ''}`}
                          </div>
                        </Link>

                        <div
                        className='text-center'
                        >
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