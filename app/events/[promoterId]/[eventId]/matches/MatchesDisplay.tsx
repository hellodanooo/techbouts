'use client';

import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

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
                <TableHead>Bout</TableHead>
                <TableHead>Ring</TableHead>
                <TableHead>Red Corner</TableHead>
                <TableHead>Blue Corner</TableHead>
                <TableHead>Weight</TableHead>
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
                    <TableCell>{redFighter.bout}</TableCell>
                    <TableCell>{redFighter.ring}</TableCell>
                    <TableCell>{`${redFighter.first || ''} ${redFighter.last || ''}`}</TableCell>
                    <TableCell>{`${blueFighter.first || ''} ${blueFighter.last || ''}`}</TableCell>
                    <TableCell>
                      {redFighter.weightclass === blueFighter.weightclass 
                        ? redFighter.weightclass 
                        : `${redFighter.weightclass} / ${blueFighter.weightclass}`}
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