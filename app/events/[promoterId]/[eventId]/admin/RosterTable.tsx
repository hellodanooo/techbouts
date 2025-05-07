// components/RosterTable.tsx
'use client'
import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import FindPotentialMatchesModal from './PotentialMatchesModal';
import { RefreshCw, Save, CheckCircle, Plus, Loader2 } from "lucide-react";
import AddFighterModal from '../../../../../components/database/AddFighterModal';
import { toast } from 'sonner';
import { RosterFighter, EventType, Bout } from '@/utils/types';
import { refreshOneFighterData, saveTechBoutsWeighin, fetchTechBoutsRoster } from '@/utils/apiFunctions/techboutsRoster';
import { fetchPmtRoster, savePmtWeighin } from '@/utils/apiFunctions/pmtRoster';

import { checkFighterExistsInDatabase, addFighterToDatabase } from "@/utils/records/database";



import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";

interface RosterTableProps {
  roster: RosterFighter[];
  eventId: string;
  promoterId: string;
  isAdmin: boolean;
  eventData: EventType;
  bouts: Bout[];
  handleFighterClick: (fighter: RosterFighter) => void;
  onBoutsRefresh?: () => void;

}

const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";

export default function RosterTable({ 
  roster, 
  eventId, 
  promoterId, 
  isAdmin,
  eventData, 
  bouts, 
  handleFighterClick, 
}: RosterTableProps) {
  const [openPotentialMatchesModal, setOpenPotentialMatchesModal] = React.useState(false);
  const [isRefreshing, setIsRefreshing] = useState<{ [key: string]: boolean }>({});
  const [openAddFighterModal, setOpenAddFighterModal] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<RosterFighter | null>(null);
  const [rosterData, setRosterData] = useState<RosterFighter[]>(roster);

  // NEW: filter & sorting states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof RosterFighter | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // WEIGHINS
  const [conductWeighins, setConductWeighins] = useState(false);
  const [weighinValues, setWeighinValues] = useState<{ [key: string]: string }>({});
  const [savingWeights, setSavingWeights] = useState<{ [key: string]: boolean }>({});
  const [unsavedChanges, setUnsavedChanges] = useState<Set<string>>(new Set());
  
  const [showUnmatchedOnly, setShowUnmatchedOnly] = useState(false);

  const [fightersInDatabase, setFightersInDatabase] = useState<{ [key: string]: boolean }>({});
  const [addingToDatabase, setAddingToDatabase] = useState<{ [key: string]: boolean }>({});


  const handleAddToDatabase = async (fighter: RosterFighter) => {
    if (!fighter.fighter_id) return;
    
    // Set loading state
    setAddingToDatabase(prev => ({ ...prev, [fighter.fighter_id!]: true }));
    
    try {
      const success = await addFighterToDatabase(fighter);
      
      if (success) {
        // Update the status in our state
        setFightersInDatabase(prev => ({ 
          ...prev, 
          [fighter.fighter_id!]: true 
        }));
        
        toast.success(`${fighter.first} ${fighter.last} added to database`);
      } else {
        toast.error("Failed to add fighter to database");
      }
    } catch (error) {
      console.error("Error adding fighter to database:", error);
      toast.error("Error adding fighter to database");
    } finally {
      // Clear loading state
      setAddingToDatabase(prev => ({ ...prev, [fighter.fighter_id!]: false }));
    }
  };


  const matchedFighterIds = useMemo(() => {
    const ids = new Set<string>();
    bouts.forEach((bout) => {
      if (bout.red?.fighter_id) ids.add(bout.red.fighter_id);
      if (bout.blue?.fighter_id) ids.add(bout.blue.fighter_id);
    });
    return ids;
  }, [bouts]);

  // Initialize weighin values from roster data
  useEffect(() => {
    if (rosterData?.length) {
      const initialValues: { [key: string]: string } = {};
      rosterData.forEach(fighter => {
        if (fighter.fighter_id) {
          initialValues[fighter.fighter_id] = fighter.weighin?.toString() || '';
        }
      });
      setWeighinValues(initialValues);
    }
  }, [rosterData]);

  // Handle sorting when a header is clicked
  const handleSort = (key: keyof RosterFighter) => {
    if (sortKey === key) {
      // toggle the sort direction
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDirection('asc');
    }
  };

  const displayedRoster = useMemo(() => {
    let filtered = rosterData.filter((fighter) => {
      const name = `${fighter.first || ''} ${fighter.last || ''}`.toLowerCase();
      const gym = (fighter.gym || '').toLowerCase();
      return (
        name.includes(searchTerm.toLowerCase()) ||
        gym.includes(searchTerm.toLowerCase())
      );
    });

    if (showUnmatchedOnly) {
      filtered = filtered.filter((fighter) => !matchedFighterIds.has(fighter.fighter_id));
    }

    if (sortKey) {
      filtered.sort((a, b) => {
        let aVal = a[sortKey] ?? '';
        let bVal = b[sortKey] ?? '';
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();
        return aVal < bVal ? (sortDirection === 'asc' ? -1 : 1)
          : aVal > bVal ? (sortDirection === 'asc' ? 1 : -1)
            : 0;
      });
    }

    return filtered;
  }, [rosterData, searchTerm, sortKey, sortDirection, showUnmatchedOnly, matchedFighterIds]);

  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getPhotoUrl = (fighter: RosterFighter): string => {
    return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
  };

  const handleWeighinChange = (fighterId: string, value: string) => {
    setWeighinValues(prev => ({
      ...prev,
      [fighterId]: value
    }));
    
    // Mark this fighter as having unsaved changes
    setUnsavedChanges(prev => {
      const newSet = new Set(prev);
      newSet.add(fighterId);
      return newSet;
    });
  };

  useEffect(() => {
    const hasWeighin = rosterData.some(fighter => fighter.weighin !== undefined && fighter.weighin !== 0);
    if (hasWeighin) {
      setConductWeighins(true);
    }
  }, [rosterData]);


  const refreshRosterData = async () => {
    try {
      let updatedRoster;
      if (eventData.sanctioning === "PMT") {
        updatedRoster = await fetchPmtRoster(eventId);
      } else {
        updatedRoster = await fetchTechBoutsRoster(promoterId, eventId);
      }
      
      if (updatedRoster) {
        setRosterData(updatedRoster);
        toast.success("Roster updated successfully");
      }
    } catch (error) {
      console.error("Error refreshing roster data", error);
      toast.error("Failed to refresh roster data");
    }
  };

  const handleFighterAdded = async () => {
    setOpenAddFighterModal(false);
    await refreshRosterData();
  };


  useEffect(() => {
    const checkFightersExistence = async () => {
      const existenceMap: { [key: string]: boolean } = {};
      
      // Check existence for each fighter in the roster
      for (const fighter of rosterData) {
        if (fighter.fighter_id) {
          const exists = await checkFighterExistsInDatabase(fighter.fighter_id);
          existenceMap[fighter.fighter_id] = exists;
        }
      }
      
      setFightersInDatabase(existenceMap);
    };
    
    if (rosterData?.length) {
      checkFightersExistence();
    }
  }, [rosterData]);


  if (!rosterData?.length) {
    return (
      <Card className="w-full mt-2">
        <CardHeader>
          <CardTitle>Event Roster</CardTitle>

          <div className="flex justify-start">
            <Button
              onClick={() => setOpenAddFighterModal(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Fighter
            </Button>
          </div>

          {openAddFighterModal && eventId && (
  <AddFighterModal
    eventId={eventId}
    savesTo="roster"
    promoterId={promoterId}
    isOpen={openAddFighterModal}
    onClose={() => setOpenAddFighterModal(false)}
    onRosterUpdated={handleFighterAdded}
    sanctioning={eventData.sanctioning}
  />
)}
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground">No roster data available</p>
        </CardContent>
      </Card>
    );
  }

  const handleSaveWeight = async (fighterId: string) => {
    const newWeight = parseFloat(weighinValues[fighterId]);
    if (isNaN(newWeight)) {
      toast.error("Invalid weight");
      return;
    }
    
    // Don't save if already saving
    if (savingWeights[fighterId]) return;
    
    setSavingWeights((prev) => ({ ...prev, [fighterId]: true }));
    
    try {
      // Check if event sanctioning is PMT
      if (eventData.sanctioning === "PMT") {
        // Use the Firebase function to update the weighin.
        await savePmtWeighin(fighterId, eventId, newWeight);
        // After saving, re-fetch the updated PMT roster (if desired).
        const updatedPmtRoster = await fetchPmtRoster(eventId);
        if (updatedPmtRoster) {
          setRosterData(updatedPmtRoster);
        }
      } else {
        console.log(`Saving fighter's weight: ${newWeight}lbs`);
        // Save the weight to TechBouts database
        await saveTechBoutsWeighin(fighterId, eventId, newWeight, promoterId);
        
        // Fetch the fresh data from Firebase instead of updating locally
        const updatedRoster = await fetchTechBoutsRoster(promoterId, eventId);
        setRosterData(updatedRoster);
      }
      
      // Remove from unsaved changes
      setUnsavedChanges(prev => {
        const newSet = new Set(prev);
        newSet.delete(fighterId);
        return newSet;
      });
      
      toast.success("Weight saved");
    } catch (error) {
      console.error("Error saving weight", error);
      toast.error("Error saving weight");
    } finally {
      setSavingWeights((prev) => ({ ...prev, [fighterId]: false }));
    }
  };

  return (
    <div className="mt-2">
      <Card className="w-full">
        <CardHeader>
        <div className="flex items-center justify-center gap-2">
  Roster {showUnmatchedOnly ? (
    <div>{displayedRoster.length} Unmatched</div>
  ) : (
    <div>All {rosterData.length} Fighters</div>
  )}
</div>
          <CardTitle className="flex items-center justify-center gap-2">
           


           {            isAdmin && (
            
       <div className='flex'>

       
            <Button
              onClick={() => setOpenAddFighterModal(true)}
              className="flex items-center gap-1 text-xs sm:text-sm w-full sm:w-auto"
              >
              <Plus className="h-4 w-4" /> Add
            </Button>

            <Button
              variant={conductWeighins ? 'default' : 'outline'}
              onClick={() => setConductWeighins(prev => !prev)}
              className="flex items-center gap-1 text-xs sm:text-sm w-full sm:w-auto"
            >
              {conductWeighins ? 'Weighins On' : 'Weighins'}
            </Button>

            </div>

          )}






            <Button
              variant={showUnmatchedOnly ? 'default' : 'outline'}
              onClick={() => setShowUnmatchedOnly(prev => !prev)}
              className="flex items-center gap-1 text-xs sm:text-sm w-full sm:w-auto"
            >
              {showUnmatchedOnly ? 'All' : 'Unmatched'}
            </Button>
          </CardTitle>

          <div className="flex items-center justify-center gap-3">
            <input
              type="text"
              className="border rounded p-2 w-full sm:w-1/2"
              placeholder="Search by fighter name or gym..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </CardHeader>

        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  {conductWeighins && 
                  <TableHead
                  className="cursor-pointer select-none"
                  onClick={() => handleSort('weighin')}
                  >Weighin
                  </TableHead>
                  }

                  <TableHead>Photo</TableHead>

                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('first')}
                  >
                    Stats
                    {sortKey === 'first' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>


                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('first')}
                  >
                    Name
                    {sortKey === 'first' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('gym')}
                  >
                    Gym
                    {sortKey === 'gym' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('weightclass')}
                  >
                    Weightclass
                    {sortKey === 'weightclass' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('age')}
                  >
                    Age
                    {sortKey === 'age' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('gender')}
                  >
                    Gender
                    {sortKey === 'gender' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  <TableHead>Records</TableHead>
                  {isAdmin && (
                    <TableHead>Refresh</TableHead>
                  )  
                }
                  {isAdmin && (

                    <TableHead>Search</TableHead>
                  )}
              {isAdmin && (
                    <TableHead>Database</TableHead>
                  )}
                
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedRoster.map((fighter, index) => {
                  // console.log("map log", fighter.fighter_id, fighter.weightclass);
                  const fighterId = fighter.fighter_id || '';
                  const name = `${fighter.first || ''} ${fighter.last || ''}`;
                  const hasUnsavedChanges = unsavedChanges.has(fighterId);

                  return (
                    <TableRow key={index}>
                      {conductWeighins && (
                        <TableCell>
                            <div className="flex items-center">
                            <input
                              className="no-zoom"
                              style={{ width: '50px' }}
                              type="number"
                              value={weighinValues[fighterId] || ''}
                              onChange={(e) => handleWeighinChange(fighterId, e.target.value)}
                              onClick={(e) => {
                              e.stopPropagation();
                              e.currentTarget.select();
                              }}
                              disabled={!isAdmin}
                            />
                            
                            {isAdmin && hasUnsavedChanges && !savingWeights[fighterId] && (
                              <button 
                              className="ml-1 bg-green-500 text-white p-1 rounded hover:bg-blue-600"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleSaveWeight(fighterId);
                              }}
                              >
                              <Save className="h-4 w-4" />
                              </button>
                            )}
                            
                            {savingWeights[fighterId] && (
                              <div className="ml-1">
                              <Loader2 className="h-4 w-4 animate-spin text-primary" />
                              </div>
                            )}
                            </div>
                        </TableCell>
                      )}




                      <TableCell
                      className='relative'
                      >

                        <div className="relative h-10 w-10 overflow-hidden rounded-full">
                          <Image
                            src={getPhotoUrl(fighter)}
                            alt={name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        
                        <div className="flex justify-start bg-gray-100 border border-black rounded-md mr-auto ml-auto pl-1 pr-1 -mt-1"
              style={{ fontSize: 'clamp(0.6rem, 1vw, 1.5rem)', width: 'fit-content', height: 'fit-content' }}
            >
              <div className="text-center pl-0.5">
                {fighter && fighter.gender?.startsWith('F') ? (
                  <span className="text-pink-500">F</span>
                ) : fighter?.gender?.startsWith('M') ? (
                  <span className="text-blue-500">M</span>
                ) : (
                  fighter ? fighter.gender : null
                                  )}
              </div>
              <div className="text-center pl-0.5">{fighter ? fighter.age : null}</div>
            </div>



      

                      </TableCell>

                        <TableCell
                        className='relative mr-2'
                        >
         <div
  id='statsTabs'
  className="absolute inset-y-0 -left-3 flex flex-col items-center justify-center leading-tight"
  style={{ fontSize: 'clamp(0.6rem, 0.6rem, 1.5rem)' }}
>
                {fighter && (fighter.mt_win > 0 || fighter.mt_loss > 0) && (
                <div className="text-left pl-0.5 rounded-sm bg-red-100 whitespace-nowrap">
                  <span className="text-black-500">MT: ({fighter.mt_win} - {fighter.mt_loss})</span>
                </div>
                )}

                {fighter && (fighter.mma_win > 0 || fighter.mma_loss > 0) && (
                <div className="text-left pl-0.5 rounded-sm bg-red-100 whitespace-nowrap">
                  <span className="text-black-500">MMA: ({fighter.mma_win} - {fighter.mma_loss})</span>
                </div>
                )}

                {fighter && fighter.pmt_win > 0 || fighter.pmt_loss > 0 && (
                <div className="text-left pl-0.5 rounded-sm bg-green-100 whitespace-nowrap">
                  <span className="text-black-500">PMT: ({fighter.pmt_win} - {fighter.pmt_loss})</span>
                </div>
                )}
                </div>
                        </TableCell>





                      <TableCell
                        onClick={() => handleFighterClick(fighter)}
                        className="cursor-pointer hover:text-blue-600 hover:underline"
                      >
                        {name}
                      </TableCell>
                      <TableCell>{fighter.gym || '-'}</TableCell>
                      <TableCell>{fighter.weightclass || '-'}</TableCell>
                      <TableCell>{fighter.age || '-'}</TableCell>
                      <TableCell>{fighter.gender || '-'}</TableCell>
                        <TableCell>
                        <div>
                          {fighter.mt_win > 0 || fighter.mt_loss > 0 ? `${fighter.mt_win || 0}-${fighter.mt_loss || 0}` : ''}
                          {fighter.mma_win > 0 || fighter.mma_loss > 0 ? ` ${fighter.mma_win || 0}-${fighter.mma_loss || 0}` : ''}
                        </div>
                        </TableCell>
                      
                      {isAdmin && (
                             <TableCell>
                             <span
                               className={`
           cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
           ${isRefreshing[fighterId] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
         `}
                               onClick={() =>
                                 refreshOneFighterData(fighter, promoterId, eventId, setIsRefreshing, setRosterData)
                               }
                             >
                               <RefreshCw
                                 className={`h-3 w-3 mr-1 ${isRefreshing[fighterId] ? 'animate-spin' : ''
                                   }`}
                               />
                               {isRefreshing[fighterId] ? 'Updating...' : 'Refresh'}
                             </span>
                           </TableCell>
                      )}
                 
                 {isAdmin && (
                      <TableCell>
                        <span
                          className="cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedFighter(fighter);
                            setOpenPotentialMatchesModal(true);
                          }}
                        >
                          Search
                        </span>
                      </TableCell>
                    )}

 {isAdmin && (
  <TableCell className="text-center">
    {fightersInDatabase[fighterId] !== undefined ? (
      fightersInDatabase[fighterId] ? (
        <CheckCircle className="h-5 w-5 text-green-500" />
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="px-2 py-1 text-xs h-8"
          onClick={(e) => {
            e.stopPropagation();
            handleAddToDatabase(fighter);
          }}
          disabled={addingToDatabase[fighterId]}
        >
          {addingToDatabase[fighterId] ? (
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
          ) : (
            <Plus className="h-3 w-3 mr-1" />
          )}
          Add
        </Button>
      )
    ) : (
      <span className="text-xs text-gray-400">Checking...</span>
    )}
  </TableCell>
)}

                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {openAddFighterModal && eventId && (
        <AddFighterModal
          eventId={eventId}
          savesTo="roster"
          promoterId={promoterId}
          isOpen={openAddFighterModal}
          onClose={() => setOpenAddFighterModal(false)}
        />
      )}

      {openPotentialMatchesModal && (
        <FindPotentialMatchesModal
          fighter={selectedFighter as RosterFighter}
          onClose={() => setOpenPotentialMatchesModal(false)}
        />
      )}
    </div>
  );
}