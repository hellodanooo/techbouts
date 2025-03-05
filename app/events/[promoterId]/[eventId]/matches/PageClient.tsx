'use client';

import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from 'sonner';
import MatchesDisplay from './MatchesDisplay';

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

interface PageClientProps {
  eventId: string;
  promoterId: string;
  initialRoster: Fighter[];
}

// Function to calculate weight difference
const getWeightDifference = (weight1: string | number | undefined, weight2: string | number | undefined): number => {
  if (!weight1 || !weight2) return 999; // Large number for undefined weights
  
  // Convert to numbers if they're strings
  const w1 = typeof weight1 === 'string' ? parseFloat(weight1) : weight1;
  const w2 = typeof weight2 === 'string' ? parseFloat(weight2) : weight2;
  
  if (isNaN(Number(w1)) || isNaN(Number(w2))) return 999;
  
  return Math.abs(Number(w1) - Number(w2));
};

// Calculate opacity based on weight difference (closer = more opaque)
const getOpacityByWeightDifference = (difference: number): string => {
  if (difference === 0) return '1';
  if (difference <= 5) return '0.9';
  if (difference <= 10) return '0.7';
  if (difference <= 15) return '0.5';
  if (difference <= 20) return '0.3';
  return '0.2';
};

export default function PageClient({ 
  eventId, 
  promoterId,
  initialRoster = [],
}: PageClientProps) {
  const router = useRouter();
  const [roster, setRoster] = useState<Fighter[]>(initialRoster);
  const [red, setRed] = useState<Fighter | null>(null);
  const [blue, setBlue] = useState<Fighter | null>(null);
  const [boutNumber, setBoutNumber] = useState<number>(() => {
    // Find the highest bout number in the roster
    const highestBout = Math.max(...initialRoster
      .filter(fighter => fighter.bout !== undefined)
      .map(fighter => fighter.bout || 0), 0);
    
    return highestBout + 1;
  });
  const [ringNumber, setRingNumber] = useState<number>(1);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  
  // Filter unmatched fighters
  const unmatchedFighters = useMemo(() => {
    return roster.filter(fighter => fighter.bout === undefined || fighter.ring === undefined);
  }, [roster]);
  
  // Sort unmatched fighters by weight class
  const sortedUnmatchedFighters = useMemo(() => {
    return [...unmatchedFighters].sort((a, b) => {
      const weightA = typeof a.weightclass === 'string' ? parseFloat(a.weightclass) : (a.weightclass || 0);
      const weightB = typeof b.weightclass === 'string' ? parseFloat(b.weightclass) : (b.weightclass || 0);
      
      if (isNaN(Number(weightA)) || isNaN(Number(weightB))) {
        // Handle non-numeric weight classes by string comparison
        return String(a.weightclass || '').localeCompare(String(b.weightclass || ''));
      }
      
      return Number(weightA) - Number(weightB);
    });
  }, [unmatchedFighters]);
  
  const handleSelectFighter = (fighter: Fighter, position: 'red' | 'blue') => {
    if (position === 'red') {
      setRed(fighter);
      
      // If the same fighter is selected as blue, deselect blue
      if (blue && (fighter.id === blue.id || fighter.fighter_id === blue.fighter_id)) {
        setBlue(null);
      }
    } else {
      setBlue(fighter);
      
      // If the same fighter is selected as red, deselect red
      if (red && (fighter.id === red.id || fighter.fighter_id === red.fighter_id)) {
        setRed(null);
      }
    }
  };
  
  const createMatch = async () => {
    if (!red || !blue || !eventId || !promoterId) {
      toast.error("Please select two fighters first");
      return;
    }
    
    setIsCreatingMatch(true);
    
    try {
      // Prepare fighter data with bout and ring numbers
      const redId = red.fighter_id || red.id;
      const blueId = blue.fighter_id || blue.id;
      
      if (!redId || !blueId) {
        toast.error("Fighter IDs are missing");
        setIsCreatingMatch(false);
        return;
      }
      
      const redUpdate = {
        ...red,
        bout: boutNumber,
        ring: ringNumber,
        opponent_id: blueId,
        opponent_name: `${blue.first || ''} ${blue.last || ''}`
      };
      
      const blueUpdate = {
        ...blue,
        bout: boutNumber,
        ring: ringNumber,
        opponent_id: redId,
        opponent_name: `${red.first || ''} ${red.last || ''}`
      };
      
      // Find the path to the roster document
      const pathsToTry = [
        { path: `events/promotions/${promoterId}/${eventId}/roster_json/fighters` },
        { path: `events/${promoterId}/${eventId}/roster_json/fighters` },
        { path: `promotions/${promoterId}/events/${eventId}/roster_json/fighters` }
      ];
      
      let rosterUpdated = false;
      let errorMsg = "";
      
      for (const { path } of pathsToTry) {
        try {
          // First check if the document exists
          const rosterRef = doc(db, path);
          const rosterDoc = await getDoc(rosterRef);
          
          if (rosterDoc.exists()) {
            // Get the current fighters array
            const data = rosterDoc.data();
            const fighters = data.fighters || [];
            
            // Replace the fighters in the array
            const updatedFighters = fighters.map((fighter: Fighter) => {
              if (fighter.id === redId || fighter.fighter_id === redId) {
                return redUpdate;
              }
              if (fighter.id === blueId || fighter.fighter_id === blueId) {
                return blueUpdate;
              }
              return fighter;
            });
            
            // Update the document with the new fighters array
            await setDoc(rosterRef, { fighters: updatedFighters });
            rosterUpdated = true;
            
            // Update local state
            setRoster(updatedFighters);
            console.log(`Roster updated at path: ${path}`);
            break;
          }
        } catch (e) {
          const error = e instanceof Error ? e.message : String(e);
          errorMsg += (errorMsg ? " | " : "") + error;
          console.log(`Failed to update roster at path: ${path} - ${error}`);
        }
      }
      
      if (rosterUpdated) {
        toast.success(`Match created: ${red.first} ${red.last} vs ${blue.first} ${blue.last}`);
        
        // Reset selected fighters
        setRed(null);
        setBlue(null);
        
        // Increment bout number for next match
        setBoutNumber(prev => prev + 1);
      } else {
        toast.error(`Failed to create match: ${errorMsg}`);
      }
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error("Failed to create match");
    } finally {
      setIsCreatingMatch(false);
    }
  };
  
  if (!roster || roster.length === 0) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Create Matches</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No roster data available. Please add fighters to the roster first.</p>
          <Button 
            className="mt-4"
            onClick={() => router.push(`/events/${promoterId}/${eventId}`)}
          >
            Go to Event Page
          </Button>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-6">
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Selected Fighters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="space-y-4">
              <div className="border rounded-md p-4 h-full">
                <h3 className="font-medium mb-2">Red Corner</h3>
                {red ? (
                  <div>
                    <p className="text-lg font-semibold">{`${red.first || ''} ${red.last || ''}`}</p>
                    <p>{red.gym || 'No gym'}</p>
                    <p>Weight: {red.weightclass || 'Not specified'}</p>
                    <p>Gender: {red.gender || 'Not specified'}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setRed(null)}
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No fighter selected</p>
                )}
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border rounded-md p-4">
                <h3 className="font-medium mb-2">Bout Settings</h3>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="boutNumber">Bout Number</Label>
                    <Input 
                      id="boutNumber"
                      type="number" 
                      min="1"
                      value={boutNumber}
                      onChange={(e) => setBoutNumber(parseInt(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="ringNumber">Ring Number</Label>
                    <Select
                      value={ringNumber.toString()}
                      onValueChange={(value) => setRingNumber(parseInt(value))}
                    >
                      <SelectTrigger id="ringNumber">
                        <SelectValue placeholder="Select Ring" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">Ring 1</SelectItem>
                        <SelectItem value="2">Ring 2</SelectItem>
                        <SelectItem value="3">Ring 3</SelectItem>
                        <SelectItem value="4">Ring 4</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <Button 
                  onClick={createMatch} 
                  disabled={!red || !blue || isCreatingMatch}
                  className="w-full mt-4"
                >
                  {isCreatingMatch ? "Creating Match..." : "Create Match"}
                </Button>
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="border rounded-md p-4 h-full">
                <h3 className="font-medium mb-2">Blue Corner</h3>
                {blue ? (
                  <div>
                    <p className="text-lg font-semibold">{`${blue.first || ''} ${blue.last || ''}`}</p>
                    <p>{blue.gym || 'No gym'}</p>
                    <p>Weight: {blue.weightclass || 'Not specified'}</p>
                    <p>Gender: {blue.gender || 'Not specified'}</p>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="mt-2" 
                      onClick={() => setBlue(null)}
                    >
                      Clear
                    </Button>
                  </div>
                ) : (
                  <p className="text-muted-foreground">No fighter selected</p>
                )}
              </div>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Available Fighters</CardTitle>
              <p className="text-sm text-muted-foreground">
                Fighters are shown with opacity based on weight class compatibility. More compatible matches appear darker.
              </p>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Weight</TableHead>
                      <TableHead>Gender</TableHead>
                      <TableHead>Gym</TableHead>
                      <TableHead>Select As</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedUnmatchedFighters.map((fighter, index) => {
                      // Calculate weight difference if a fighter is selected
                      const redWeightDiff = red 
                        ? getWeightDifference(red.weightclass, fighter.weightclass) 
                        : 0;
                      
                      const blueWeightDiff = blue
                        ? getWeightDifference(blue.weightclass, fighter.weightclass)
                        : 0;
                      
                      // Get opacity based on weight difference with the selected fighter
                      const opacity = red || blue
                        ? getOpacityByWeightDifference(Math.min(redWeightDiff, blueWeightDiff))
                        : '1';
                      
                      // Check if this fighter is already selected
                      const isSelected = (red && (red.id === fighter.id || red.fighter_id === fighter.fighter_id)) || 
                                         (blue && (blue.id === fighter.id || blue.fighter_id === fighter.fighter_id));
                      
                      // Determine which fighter positions this fighter is already selected for
                      const isSelectedAsRed = red && (red.id === fighter.id || red.fighter_id === fighter.fighter_id);
                      const isSelectedAsBlue = blue && (blue.id === fighter.id || blue.fighter_id === fighter.fighter_id);
                      
                      return (
                        <TableRow 
                          key={`fighter-${index}`}
                          style={{ opacity }}
                          className={`
                            ${isSelected ? 'bg-primary/10' : ''}
                          `}
                        >
                          <TableCell>{`${fighter.first || ''} ${fighter.last || ''}`}</TableCell>
                          <TableCell>{fighter.weightclass || '-'}</TableCell>
                          <TableCell>{fighter.gender || '-'}</TableCell>
                          <TableCell>{fighter.gym || '-'}</TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button 
                                variant={isSelectedAsRed ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSelectFighter(fighter, 'red')}
                                disabled={!!isSelectedAsBlue}
                              >
                                Red
                              </Button>
                              <Button 
                                variant={isSelectedAsBlue ? "default" : "outline"}
                                size="sm"
                                onClick={() => handleSelectFighter(fighter, 'blue')}
                                disabled={!!isSelectedAsRed}
                              >
                                Blue
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
      
      {/* Using the separate MatchesDisplay component */}
      <MatchesDisplay roster={roster} promoterId={promoterId} eventId={eventId} />
    </div>
  );
}