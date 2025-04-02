// components/RosterTable.tsx
'use client'
import React, { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FindPotentialMatchesModal from './PotentialMatchesModal';
import { RefreshCw } from "lucide-react";
import AddFighterModal from '../../../../../components/database/AddFighterModal';
import { toast } from 'sonner';
import { RosterFighter, EventType, Bout } from '@/utils/types';
import CreateEditBout from '@/app/events/[promoterId]/[eventId]/matches/CreateEditBout';
import {fetchTechBoutsRoster} from '@/utils/apiFunctions/fetchTechBoutsRoster';


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
import { Plus } from "lucide-react";

interface RosterTableProps {
  roster: RosterFighter[];
  eventId: string;
  promoterId: string;
  isAdmin?: boolean;
  eventData: EventType;
  bouts: Bout[];
  onFighterSelect?: (fighter: RosterFighter) => void;
}

const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";

export default function RosterTable({ roster, eventId, promoterId, isAdmin, eventData, onFighterSelect, bouts }: RosterTableProps) {
  const router = useRouter();
  const [openPotentialMatchesModal, setOpenPotentialMatchesModal] = React.useState(false);
  const [isRefreshing] = useState<{ [key: string]: boolean }>({});
  const [openAddFighterModal, setOpenAddFighterModal] = useState(false);
  const [selectedFighter, setSelectedFighter] = useState<RosterFighter | null>(null);
  const [rosterData, setRosterData] = useState<RosterFighter[]>(roster);
  const [red, setRed] = useState<RosterFighter | null>(null);
  const [blue, setBlue] = useState<RosterFighter | null>(null);

  // NEW: filter & sorting states
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<keyof RosterFighter | null>(null);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

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
    // 1. Filter
    const filtered = rosterData.filter((fighter) => {
      const name = `${fighter.first || ''} ${fighter.last || ''}`.toLowerCase();
      const gym = (fighter.gym || '').toLowerCase();
      return (
        name.includes(searchTerm.toLowerCase()) ||
        gym.includes(searchTerm.toLowerCase())
      );
    });

    // 2. Sort
    if (sortKey) {
      filtered.sort((a, b) => {
        let aVal = a[sortKey] ?? '';
        let bVal = b[sortKey] ?? '';

        // Convert to lowerCase string for consistent sorting
        // If you need numeric sorting, handle that logic based on the field
        if (typeof aVal === 'string') aVal = aVal.toLowerCase();
        if (typeof bVal === 'string') bVal = bVal.toLowerCase();

        if (aVal < bVal) {
          return sortDirection === 'asc' ? -1 : 1;
        }
        if (aVal > bVal) {
          return sortDirection === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }

    return filtered;
  }, [rosterData, searchTerm, sortKey, sortDirection]);



  const handleFighterClick = (fighter: RosterFighter) => {
    if (!isAdmin) {
      return navigateToFighterDetail(fighter);
    }
  console.log('ROSTER EXISTING BOUTS', bouts)
    // If no fighter is selected yet, or if red & blue are both set, pick fighter for red.
    if (!red || (red && blue)) {
      setRed(fighter);
      setBlue(null);
      setSelectedFighter(fighter);
    } 
    // else if red is set but blue isn’t, pick this fighter for blue
    else if (!blue) {
      setBlue(fighter);
      setSelectedFighter(fighter);
    }
  };





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

  const navigateToFighterDetail = (fighter: RosterFighter) => {
    const fighterId = fighter.fighter_id;
    if (fighterId) {
      router.push(`/fighter/${fighterId}`);
    } else {
      console.error("Fighter ID not available for navigation");
    }
  };


  const refreshFighterData = async () => {
    try {
      const updatedRoster = await fetchTechBoutsRoster(promoterId, eventId);
      if (updatedRoster) {
        setRosterData(updatedRoster);
        toast.success("Roster refreshed");
      } else {
        toast.error("Failed to refresh roster");
      }
    } catch (error) {
      console.error("Error refreshing roster:", error);
      toast.error("Error refreshing roster");
    }
  };


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
              promoterId={promoterId}
              savesTo="roster"
              isOpen={openAddFighterModal}
              onClose={() => setOpenAddFighterModal(false)}
              onRosterUpdated={() => router.refresh()}
            />
          )}
        </CardHeader>

        <CardContent>
          <p className="text-muted-foreground">No roster data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="mt-2">
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-3">
            Event Roster
            <Button
              onClick={() => setOpenAddFighterModal(true)}
              className="flex items-center gap-1"
            >
              <Plus className="h-4 w-4" /> Add Fighter
            </Button>
          </CardTitle>

          {/* NEW: Filter (search) input */}
          <div className="mt-3">
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
                  <TableHead>Photo</TableHead>
                  {/* Sortable column example for Name */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('first')}
                  >
                    Name
                    {sortKey === 'first' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  {/* Sortable column example for Gym */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('gym')}
                  >
                    Gym
                    {sortKey === 'gym' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  {/* Sortable column example for weightclass */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('weightclass')}
                  >
                    Weight
                    {sortKey === 'weightclass' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  {/* Sortable column example for age */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('age')}
                  >
                    Age
                    {sortKey === 'age' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  {/* Sortable column example for gender */}
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => handleSort('gender')}
                  >
                    Gender
                    {sortKey === 'gender' && (sortDirection === 'asc' ? ' ▲' : ' ▼')}
                  </TableHead>
                  {/* For the Muay Thai record, if you want to sort by the fighter.mt_win or similar,
                      you'd handle that differently. For demonstration, we'll leave it alone. */}
                  <TableHead>MT-MMA</TableHead>
                  <TableHead>Refresh</TableHead>
                  <TableHead>Search</TableHead>
                </TableRow>
              </TableHeader>

              <TableBody>
                {displayedRoster.map((fighter, index) => {
                  const fighterId = fighter.fighter_id || '';
                  const name = `${fighter.first || ''} ${fighter.last || ''}`;

                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <div className="relative h-10 w-10 overflow-hidden rounded-full">
                          <Image
                            src={getPhotoUrl(fighter)}
                            alt={name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      </TableCell>
                      <TableCell
                        onClick={() => {
                          if (onFighterSelect) {
                            onFighterSelect(fighter); // use passed prop handler
                          } else {
                            handleFighterClick(fighter); // fallback to internal
                          }
                        }}
                        className="cursor-pointer hover:text-blue-600 hover:underline"
                      >
                        {name}
                      </TableCell>
                      <TableCell>{fighter.gym || '-'}</TableCell>
                      <TableCell>{fighter.weightclass || '-'}</TableCell>
                      <TableCell>{fighter.age || '-'}</TableCell>
                      <TableCell>{fighter.gender || '-'}</TableCell>
                      <TableCell>{`${fighter.mt_win || 0}-${fighter.mt_loss || 0}`}</TableCell>
                      <TableCell>
                        <span
                          className={`
                            cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium 
                            ${isRefreshing[fighterId] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                          `}
                          onClick={() => refreshFighterData()}
                        >
                          <RefreshCw
                            className={`h-3 w-3 mr-1 ${
                              isRefreshing[fighterId] ? 'animate-spin' : ''
                            }`}
                          />
                          {isRefreshing[fighterId] ? 'Updating...' : 'Refresh'}
                        </span>
                      </TableCell>
                      <TableCell>
                        <span
                          className="cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800"
                          onClick={() => {
                            setSelectedFighter(fighter);
                            setOpenPotentialMatchesModal(true);
                          }}
                        >
                          Search
                        </span>
                      </TableCell>
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



    {selectedFighter && (
    <CreateEditBout
      roster={rosterData}
      red={red}
      blue={blue}
     
      weightclass={selectedFighter?.weightclass || 0}
      setWeightclass={() => {}}
    
      bout_type="MT"
      setBoutType={() => {}}
      boutConfirmed={true}
      setBoutConfirmed={() => {}}
      isCreatingMatch={false}
      setRed={setRed}
      setBlue={setBlue}
      setIsCreatingMatch={() => {}}
      promoterId={promoterId}
      eventId={eventId}
      eventData={eventData}
      isAdmin={isAdmin ?? false}
      action='create'
      existingBouts={bouts}


      onClose={() => {
        setSelectedFighter(null);
        setRed(null);
        setBlue(null);
      }}

    />

    )}
</div>
      
  );
}