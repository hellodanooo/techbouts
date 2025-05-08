// app/events/[promoterId]/[eventId]/matches/MatchesDisplay.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RosterFighter, Bout, EventType } from '@/utils/types';
import { BoutRow } from '@/components/matches/BoutDisplay';
import { Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isBoutFinished } from "@/utils/events/matches";


interface MatchesDisplayProps {
  bouts: Bout[];
  promoterId?: string;
  eventId?: string;
  isAdmin?: boolean;
  eventData: EventType;
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutSelect?: (bout: Bout) => void;
}

export default function MatchesDisplay({
  bouts,
  //promoterId,
  //eventId,
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
      // Check ringNum property
      const ring = bout.ringNum || 1;
      rings.add(ring);
    });
    return Array.from(rings).sort((a, b) => a - b);
  }, [bouts]);




  // Filter bouts based on ring number and bracket filter
  const filteredBouts = useMemo(() => {
    return bouts.filter(bout => {
      // Apply ring filter if selected
      const ringFilter = selectedRing === null || bout.ringNum === selectedRing;
      
      // Apply bracket filter if needed
      
      return ringFilter;
    });
  }, [bouts, selectedRing]);

  // Sort bouts by bout number and then by ring number
  const sortedBouts = useMemo(() => {
    return [...filteredBouts].sort((a, b) => {
      // First sort by day number (if available)
      if (a.dayNum !== b.dayNum) {
        return (a.dayNum || 1) - (b.dayNum || 1);
      }
      
      // Then sort by ring number
      if (a.ringNum !== b.ringNum) {
        return (a.ringNum || 1) - (b.ringNum || 1);
      }
      
      // Finally sort by bout number
      return (a.boutNum || 0) - (b.boutNum || 0);
    });
  }, [filteredBouts]);

  // Separate filtered bouts into finished and unfinished
  const { finishedBouts, unfinishedBouts } = useMemo(() => {
    return sortedBouts.reduce((acc, bout) => {
      if (isBoutFinished(bout)) {
        acc.finishedBouts.push(bout);
      } else {
        acc.unfinishedBouts.push(bout);
      }
      return acc;
    }, { finishedBouts: [] as Bout[], unfinishedBouts: [] as Bout[] });
  }, [sortedBouts]);


  return (
    <Card className="w-full">

<h2 className="text-lg text-center font-bold mb-4">
        {eventData.name} - Fight Card
      </h2>

      <CardHeader>
        <div className="flex flex-wrap justify-between items-center mb-2">
          <div className="flex space-x-2">
            {ringNumbers.length > 1 && (
              <div className="flex flex-wrap gap-2">
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
          </div>
        </div>

        {finishedBouts.length > 0 && (
          <Button
            onClick={() => setShowCompletedBouts(!showCompletedBouts)}
            variant="outline"
            className="mt-2"
          >
            {showCompletedBouts ? 'Hide' : 'Show'} Completed Bouts ({finishedBouts.length})
          </Button>
        )}
      </CardHeader>
      <CardContent className="overflow-x-auto">
        {/* Bracket Modal */}
    
      
        {sortedBouts.length === 0 ? (
          <p className="text-muted-foreground text-center">No Matches Found</p>
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
                  <TableRow className="bg-gray-100">
                    <TableCell colSpan={3} className="font-bold text-center py-2">
                      Completed Bouts
                    </TableCell>
                  </TableRow>
                  
                  {finishedBouts.map((bout, index) => {
                    // If this is a tournament bout, display the badge header
                   
                    if (bout.bracket_bout_type) {
                      return (
                        <React.Fragment key={`finished-${index}`}>
                          <TableRow className="bg-amber-50 border-0">
                            <TableCell colSpan={3} className="py-1 text-center">
                              <Badge 
                                variant={bout.bracket_bout_type === 'final' ? "default" : "outline"} 
                                className="flex items-center mx-auto"
                              >
                                {bout.bracket_bout_type === 'final' && <Trophy className="h-3 mr-1" />}
                                {bout.bracket_bout_type === 'final' ? 'Tournament Final' : 
                                 bout.bracket_bout_type === 'semifinal' ? 'Tournament Semifinal' : 
                                 bout.bracket_bout_type === 'qualifier' ? 'Tournament Qualifier' : 
                                 'Tournament Bout'}
                              </Badge>
                            </TableCell>
                          </TableRow>
                          
                            <BoutRow 
                              key={`finished-${index}`}
                              bout={bout} 
                              allBouts={sortedBouts}
                              index={index}
                              isAdmin={isAdmin}
                              handleFighterClick={handleFighterClick}
                              onBoutSelect={onBoutSelect}
                            />
                       
                        </React.Fragment>
                      );
                    }
                    
                    // Standard bout row
                    return (
                      <BoutRow 
                        key={`finished-${index}`}
                        bout={bout} 
                        allBouts={sortedBouts}
                        index={index}
                        isAdmin={isAdmin}
                        handleFighterClick={handleFighterClick}
                        onBoutSelect={onBoutSelect}
                      />
                    );
                  })}
                  



                  <TableRow className="bg-gray-100">
                    <TableCell colSpan={3} className="font-bold text-center py-2">
                      Upcoming Bouts
                    </TableCell>
                  </TableRow>
                </>
              )}

              {/* Unfinished bouts section - always shown */}
              {unfinishedBouts.map((bout, index) => {
                // If this is a tournament bout, display the badge header
                if (bout.bracket_bout_type) {
                  return (
                    <React.Fragment key={`unfinished-${index}`}>
                      <TableRow className="bg-amber-50 border-0">
                        <TableCell colSpan={3} className="py-1 text-center">
                          <Badge 
                            variant={bout.bracket_bout_type === 'final' ? "default" : "outline"} 
                            className="flex items-center mx-auto"
                          >
                            {bout.bracket_bout_type === 'final' && <Trophy className="h-3 mr-1" />}
                            {bout.bracket_bout_type === 'final' ? 'Tournament Final' : 
                             bout.bracket_bout_type === 'semifinal' ? 'Tournament Semifinal' : 
                             bout.bracket_bout_type === 'qualifier' ? 'Tournament Qualifier' : 
                             'Tournament Bout'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                      
                  
                        <BoutRow 
                          key={`unfinished-${index}`}
                          bout={bout} 
                          allBouts={sortedBouts}
                          index={index}
                          isAdmin={isAdmin}
                          handleFighterClick={handleFighterClick}
                          onBoutSelect={onBoutSelect}
                        />
                 
                    </React.Fragment>
                  );
                }
                
                // Standard bout row
                return (
                  <BoutRow 
                    key={`unfinished-${index}`}
                    bout={bout} 
                    allBouts={sortedBouts}
                    index={index}
                    isAdmin={isAdmin}
                    handleFighterClick={handleFighterClick}
                    onBoutSelect={onBoutSelect}
                  />
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}