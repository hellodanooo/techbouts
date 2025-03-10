'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
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
  
  // Only keep necessary UI state variables, not roster state
  const [red, setRed] = useState<Fighter | null>(null);
  const [blue, setBlue] = useState<Fighter | null>(null);
  const [ringNumber, setRingNumber] = useState<number>(1);
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);
  const [isDeletingMatch, setIsDeletingMatch] = useState<{[key: string]: boolean}>({});
  const [isResequencing, setIsResequencing] = useState(false);
  const [rosterData, setRosterData] = useState<Fighter[]>(initialRoster);
  const [rosterPath, setRosterPath] = useState<string | null>(null);
  const [boutNumber, setBoutNumber] = useState<number>(1);
  
  // Find the active path to the roster document and set up listener
  useEffect(() => {
    if (!eventId || !promoterId) return;
    
    const pathsToTry = [
      `events/promotions/${promoterId}/${eventId}/roster_json/fighters`,
      `events/${promoterId}/${eventId}/roster_json/fighters`,
      `promotions/${promoterId}/events/${eventId}/roster_json/fighters`
    ];
    
    // Function to check if a path exists
    const checkPath = async (path: string): Promise<boolean> => {
      const docRef = doc(db, path);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    };
    
    // Find the first valid path
    const findValidPath = async () => {
      for (const path of pathsToTry) {
        if (await checkPath(path)) {
          setRosterPath(path);
          return path;
        }
      }
      return null;
    };
    
    // Initialize
    findValidPath().then(validPath => {
      if (validPath) {
        // Set up a listener for real-time updates
        const unsubscribe = onSnapshot(
          doc(db, validPath),
          (docSnapshot) => {
            if (docSnapshot.exists()) {
              const data = docSnapshot.data();
              if (data && Array.isArray(data.fighters)) {
                setRosterData(data.fighters);
                
                // Calculate next bout number based on current data
                const highestBout = Math.max(
                  ...data.fighters
                    .filter((fighter: Fighter) => fighter.bout !== undefined)
                    .map((fighter: Fighter) => fighter.bout || 0),
                  0
                );
                setBoutNumber(highestBout + 1);
              }
            }
          },
          (error) => {
            console.error("Error listening to roster changes:", error);
          }
        );
        
        // Clean up the listener when component unmounts
        return () => unsubscribe();
      }
    });
  }, [eventId, promoterId]);
  
  // Filter unmatched fighters directly from rosterData
  const unmatchedFighters = useMemo(() => {
    return rosterData.filter(fighter => fighter.bout === undefined || fighter.ring === undefined);
  }, [rosterData]);
  
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
  
  // Group matched fighters by bout and ring
  const matchedPairs = useMemo(() => {
    const matches: { [key: string]: Fighter[] } = {};
    
    // Get all fighters with bout and ring numbers
    const matchedFighters = rosterData.filter(fighter => 
      fighter.bout !== undefined && 
      fighter.ring !== undefined
    );
    
    // Group them by bout and ring
    matchedFighters.forEach(fighter => {
      const key = `bout${fighter.bout}-ring${fighter.ring}`;
      if (!matches[key]) {
        matches[key] = [];
      }
      matches[key].push(fighter);
    });
    
    // Convert to array and sort by bout number
    return Object.entries(matches)
      .map(([key, fighters]) => ({
        key,
        bout: fighters[0].bout as number,
        ring: fighters[0].ring as number,
        fighters
      }))
      .sort((a, b) => {
        // First sort by ring number
        if (a.ring !== b.ring) {
          return a.ring - b.ring;
        }
        // Then by bout number
        return a.bout - b.bout;
      });
  }, [rosterData]);
  
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
    if (!red || !blue || !eventId || !promoterId || !rosterPath) {
      toast.error(rosterPath ? "Please select two fighters first" : "No valid roster path found");
      return;
    }
    
    setIsCreatingMatch(true);
    
    try {
      // Prepare fighter data with bout and ring numbers
      const redId = red.fighter_id || red.id;
      const blueId = blue.fighter_id || blue.id;
      
      if (!redId || !blueId) {
        toast.error("Fighter IDs are missing");
        return;
      }
      
      const redUpdate = {
        ...red,
        bout: boutNumber,
        ring: ringNumber,
        opponent_id: blueId,
        opponent_name: `${blue.first || ''} ${blue.last || ''}`,
        corner: 'red'
      };
      
      const blueUpdate = {
        ...blue,
        bout: boutNumber,
        ring: ringNumber,
        opponent_id: redId,
        opponent_name: `${red.first || ''} ${red.last || ''}`,
        corner: 'blue'
      };
      
      // Get current fighters array
      const rosterRef = doc(db, rosterPath);
      const rosterDoc = await getDoc(rosterRef);
      
      if (rosterDoc.exists()) {
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
        
        toast.success(`Match created: ${red.first} ${red.last} vs ${blue.first} ${blue.last}`);
        
        // Reset selected fighters
        setRed(null);
        setBlue(null);
      } else {
        toast.error("Roster document not found");
      }
    } catch (error) {
      console.error('Error creating match:', error);
      toast.error("Failed to create match");
    } finally {
      setIsCreatingMatch(false);
    }
  };
  
  const deleteMatch = async (bout: number, ring: number) => {
    if (!rosterPath) {
      toast.error("No valid roster path found");
      return;
    }
    
    const matchKey = `bout${bout}-ring${ring}`;
    setIsDeletingMatch(prev => ({ ...prev, [matchKey]: true }));
    
    try {
      // Find fighters in this match
      const fightersToUpdate = rosterData.filter(fighter => 
        fighter.bout === bout && fighter.ring === ring
      );
      
      if (fightersToUpdate.length === 0) {
        toast.error("No fighters found for this match");
        return;
      }
      
      // Get fighter IDs to identify them in the update
      const fighterIds = fightersToUpdate.map(fighter => fighter.fighter_id || fighter.id);
      
      // Get current roster from Firebase
      const rosterRef = doc(db, rosterPath);
      const rosterDoc = await getDoc(rosterRef);
      
      if (rosterDoc.exists()) {
        const data = rosterDoc.data();
        const fighters = data.fighters || [];
        
        // Update the fighters in the array by removing match info
        const updatedFighters = fighters.map((fighter: Fighter) => {
          if (fighterIds.includes(fighter.fighter_id || fighter.id)) {
            // Create a shallow copy of the fighter object
            const updatedFighter = { ...fighter };
            
            // Delete the match-related properties
            delete updatedFighter.bout;
            delete updatedFighter.ring;
            delete updatedFighter.opponent_id;
            delete updatedFighter.opponent_name;
            delete updatedFighter.corner;
            
            return updatedFighter;
          }
          return fighter;
        });
        
        // Update the document with the new fighters array
        await setDoc(rosterRef, { fighters: updatedFighters });
        
        toast.success(`Match deleted: Bout ${bout}, Ring ${ring}`);
        
        // Automatically resequence bouts after successful deletion
        await resequenceBouts(false);
      } else {
        toast.error("Roster document not found");
      }
    } catch (error) {
      console.error('Error deleting match:', error);
      toast.error("Failed to delete match");
    } finally {
      setIsDeletingMatch(prev => ({ ...prev, [matchKey]: false }));
    }
  };
  
  // Resequence bout numbers by ring
  const resequenceBouts = async (showToast = true) => {
    if (!rosterPath) {
      if (showToast) toast.error("No valid roster path found");
      return;
    }
    
    setIsResequencing(true);
    
    try {
      // Get current roster from Firebase
      const rosterRef = doc(db, rosterPath);
      const rosterDoc = await getDoc(rosterRef);
      
      if (!rosterDoc.exists()) {
        if (showToast) toast.error("Roster document not found");
        return;
      }
      
      const data = rosterDoc.data();
      const fighters = data.fighters || [];
      
      // Group fighters by ring
      const ringGroups: { [key: number]: Fighter[] } = {};
      
      // Get all fighters with bout and ring numbers
      const matchedFighters = fighters.filter((fighter: Fighter) => 
        fighter.bout !== undefined && 
        fighter.ring !== undefined
      );
      
      if (matchedFighters.length === 0) {
        if (showToast) toast.error("No matches to resequence");
        return;
      }
      
      // Group fighters by ring number
      matchedFighters.forEach((fighter: Fighter) => {
        const ring = fighter.ring as number;
        if (!ringGroups[ring]) {
          ringGroups[ring] = [];
        }
        ringGroups[ring].push(fighter);
      });
      
      // For each ring, sort the bouts by their current number and reassign sequential numbers
      const updatedFighterMap: { [key: string]: Fighter } = {};
      
      // Process each ring
      Object.entries(ringGroups).forEach(([ringStr, ringFighters]) => {
        const ringNumber = parseInt(ringStr);
        console.log(`Processing ring ${ringNumber}`);
        
        // Group fighters in the same ring by bout number (to keep pairs together)
        const boutGroups: { [key: number]: Fighter[] } = {};
        
        // Make sure you're actually using ringFighters here
        ringFighters.forEach(fighter => {
          const bout = fighter.bout as number;
          if (!boutGroups[bout]) {
            boutGroups[bout] = [];
          }
          boutGroups[bout].push(fighter);
        });
  
        
        // Sort the bout groups by their current bout number
        const sortedBoutNumbers = Object.keys(boutGroups)
          .map(Number)
          .sort((a, b) => a - b);
        
        // Assign new sequential bout numbers starting from 1
        let newBoutNumber = 1;
        sortedBoutNumbers.forEach(oldBoutNumber => {
          boutGroups[oldBoutNumber].forEach(fighter => {
            const id = fighter.fighter_id || fighter.id;
            if (id) {
              updatedFighterMap[id] = {
                ...fighter,
                bout: newBoutNumber
              };
            }
          });
          newBoutNumber++;
        });
      });
      
      // Create updated roster with resequenced bout numbers
      const updatedFighters = fighters.map((fighter: Fighter) => {
        const id = fighter.fighter_id || fighter.id;
        if (id && updatedFighterMap[id]) {
          return {
            ...fighter,
            bout: updatedFighterMap[id].bout
          };
        }
        return fighter;
      });
      
      // Update the document with the new fighters array
      await setDoc(rosterRef, { fighters: updatedFighters });
      
      if (showToast) {
        toast.success("Bouts successfully resequenced");
      }
    } catch (error) {
      console.error('Error resequencing bouts:', error);
      if (showToast) {
        toast.error("Failed to resequence bouts");
      }
    } finally {
      setIsResequencing(false);
    }
  };
  
  if (!rosterData || rosterData.length === 0) {
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
                  disabled={!red || !blue || isCreatingMatch || !rosterPath}
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
          
          {/* Matched Pairs Section */}
          {matchedPairs.length > 0 && (
            <Card className="mb-6">
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Paired Fighters</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    Fighters that have been paired in matches. Delete a match to return fighters to the available pool.
                  </p>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => resequenceBouts(true)}
                  disabled={isResequencing || !rosterPath}
                >
                  {isResequencing ? "Resequencing..." : "Resequence Bouts"}
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-[500px] overflow-y-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Bout</TableHead>
                        <TableHead>Ring</TableHead>
                        <TableHead>Red Corner</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Blue Corner</TableHead>
                        <TableHead>Weight</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {matchedPairs.map(({ key, bout, ring, fighters }) => {
                        // Find red and blue fighters by checking if they have opponent_id
                        // This makes it more reliable than just assuming first is red and second is blue
                        const redFighter = fighters.find(f => f.opponent_id);
                        const blueFighter = fighters.find(f => 
                          f.id !== redFighter?.id && 
                          f.fighter_id !== redFighter?.fighter_id
                        );
                        
                        return (
                          <TableRow key={key}>
                            <TableCell>{bout}</TableCell>
                            <TableCell>{ring}</TableCell>
                            <TableCell className="font-medium text-red-600">
                              {redFighter ? `${redFighter.first || ''} ${redFighter.last || ''}` : 'Missing'}
                            </TableCell>
                            <TableCell>{redFighter?.weightclass || '-'}</TableCell>
                            <TableCell className="font-medium text-blue-600">
                              {blueFighter ? `${blueFighter.first || ''} ${blueFighter.last || ''}` : 'Missing'}
                            </TableCell>
                            <TableCell>{blueFighter?.weightclass || '-'}</TableCell>
                            <TableCell>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => deleteMatch(bout, ring)}
                                disabled={isDeletingMatch[key] || !rosterPath}
                              >
                                {isDeletingMatch[key] ? "Deleting..." : "Delete Match"}
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
          
          {/* Available Fighters Section */}
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
      
      {/* Keep the existing MatchesDisplay component */}
      <MatchesDisplay roster={rosterData} promoterId={promoterId} eventId={eventId} />
    </div>
  );
}