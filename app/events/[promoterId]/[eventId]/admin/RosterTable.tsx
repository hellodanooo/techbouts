// components/RosterTable.tsx
'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import FindPotentialMatchesModal from './PotentialMatchesModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight, RefreshCw } from "lucide-react";
import AddFighterModal from './AddFighterModal';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { toast } from 'sonner';

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

interface Fighter {
  first?: string;
  last?: string;
  gym?: string;
  weightclass?: string | number;
  age?: string | number;
  experience?: string | number;
  status?: string;
  photo?: string;
  fighter_id?: string;
  id?: string;
  mt_win?: number;
  mt_loss?: number;
  [key: string]: string | number | undefined;
  gender: string;
}

interface RosterTableProps {
  roster: Fighter[];
  eventId: string;
  promoterId: string;
}

const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";

export default function RosterTable({ roster, eventId, promoterId }: RosterTableProps) {
  const router = useRouter();

  const [openPotentialMatchesModal, setOpenPotentialMatchesModal] = React.useState(false);
  const [selectedFighter, setSelectedFighter] = React.useState<Fighter | null>(null);
  const [isRefreshing, setIsRefreshing] = useState<{ [key: string]: boolean }>({});

  const [openAddFighterModal, setOpenAddFighterModal] = useState(false);
  
  const [openSections, setOpenSections] = useState({
    roster: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Determine if a URL is valid
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const getPhotoUrl = (fighter: Fighter): string => {
    return isValidUrl(fighter.photo) ? fighter.photo as string : defaultPhotoUrl;
  };

  const navigateToFighterDetail = (fighter: Fighter) => {
    const fighterId = fighter.fighter_id || fighter.id;
    if (fighterId) {
      router.push(`/fighter/${fighterId}`);
    } else {
      console.error("Fighter ID not available for navigation");
    }
  };

  // Refresh fighter data from techbouts_fighters database
  const refreshFighterData = async (fighter: Fighter) => {
    const fighterId = fighter.fighter_id || fighter.id;
    if (!fighterId) {
      toast.error("Fighter ID not available");
      return;
    }

    try {
      // Set refreshing state for this fighter
      setIsRefreshing(prev => ({ ...prev, [fighterId]: true }));

      // Fetch the latest fighter data from techbouts_fighters collection
      const fighterDocRef = doc(db, 'techbouts_fighters', fighterId);
      const fighterDoc = await getDoc(fighterDocRef);
      
      if (!fighterDoc.exists()) {
        toast.error("Fighter not found", {
          description: "The fighter data could not be found in the database"
        });
        return;
      }

      // Get the updated fighter data
      const updatedFighterData = fighterDoc.data();
      
      // Map the data to match the Fighter interface
      const updatedFighter = {
        fighter_id: updatedFighterData.fighter_id || fighterId,
        first: updatedFighterData.first || '',
        last: updatedFighterData.last || '',
        gym: updatedFighterData.gym || '',
        email: updatedFighterData.email || '',
        weightclass: Number(updatedFighterData.weightclass) || 0,
        age: updatedFighterData.age || '',
        gender: updatedFighterData.gender || '',
        mt_win: updatedFighterData.mt_win || 0,
        mt_loss: updatedFighterData.mt_loss || 0,
        boxing_win: updatedFighterData.boxing_win || 0,
        boxing_loss: updatedFighterData.boxing_loss || 0,
        mma_win: updatedFighterData.mma_win || 0,
        mma_loss: updatedFighterData.mma_loss || 0,
        photo: updatedFighterData.photo || '',
        state: updatedFighterData.state || '',
        class: updatedFighterData.class || '',
      };

      // Get the current roster_json document
      const rosterJsonRef = doc(db, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
      const rosterDoc = await getDoc(rosterJsonRef);
      
      if (rosterDoc.exists()) {
        const rosterData = rosterDoc.data();
        const currentFighters = rosterData.fighters || [];
        
        // Find and replace the fighter in the roster array
        const updatedRoster = currentFighters.map((f: Fighter) => {
          const currentFighterId = f.fighter_id || f.id;
          if (currentFighterId === fighterId) {
            return { ...f, ...updatedFighter };
          }
          return f;
        });
        
        // Update the roster_json document
        await setDoc(rosterJsonRef, { fighters: updatedRoster });
        
        // Show success message
        toast.success("Fighter updated", {
          description: `${updatedFighter.first} ${updatedFighter.last}'s data has been refreshed`
        });
        
        // Refresh the page to show updated data
        router.refresh();
      } else {
        toast.error("Roster not found", {
          description: "The roster document could not be found"
        });
      }
    } catch (error) {
      console.error('Error refreshing fighter data:', error);
      toast.error("Update failed", {
        description: "There was an error refreshing the fighter data"
      });
    } finally {
      // Clear refreshing state for this fighter
      setIsRefreshing(prev => ({ ...prev, [fighterId]: false }));
    }
  };

  if (!roster?.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Event Roster</CardTitle>
          
          <div className="flex justify-start mb-4">
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
    <Collapsible
    open={openSections.roster}
    onOpenChange={() => toggleSection('roster')}
    className="w-full border rounded-lg overflow-hidden"
  >
    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100">
      <h2 className="text-xl font-semibold">Roster</h2>
      {openSections.roster ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </CollapsibleTrigger>
    <CollapsibleContent className="p-4 bg-white">

    
 
    <div className="flex justify-end mb-4">
          <Button 
            onClick={() => setOpenAddFighterModal(true)}
            className="flex items-center gap-1"
          >
            <Plus className="h-4 w-4" /> Add Fighter
          </Button>
        </div>

 <Card className="w-full">
      <CardHeader>
        <CardTitle>Event Roster</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Photo</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Gym</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>MT-MMA</TableHead>
                <TableHead>Refresh</TableHead>
                <TableHead>Search</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((fighter, index) => {
                const fighterId = fighter.fighter_id || fighter.id || '';
                return (
                <TableRow key={index}>
                  <TableCell>
                    <div className="relative h-10 w-10 overflow-hidden rounded-full">
                      <Image
                        src={getPhotoUrl(fighter)}
                        alt={`${fighter.first || ''} ${fighter.last || ''}`}
                        fill
                        className="object-cover"
                      />
                    </div>
                  </TableCell>
                  <TableCell
                    onClick={() => navigateToFighterDetail(fighter)}
                    className="cursor-pointer hover:text-blue-600 hover:underline"
                  >
                    {`${fighter.first || ''} ${fighter.last || ''}`}
                  </TableCell>
                  <TableCell>{fighter.gym || '-'}</TableCell>
                  <TableCell>{fighter.weightclass || '-'}</TableCell>
                  <TableCell>{fighter.age || '-'}</TableCell>
                  <TableCell>{fighter.gender || '-'}</TableCell>
                  <TableCell>{`${fighter.mt_win || 0}-${fighter.mt_loss || 0}`}</TableCell>
                 
                  <TableCell>
                    <span 
                      className={`
                        cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium leading-4 
                        ${isRefreshing[fighterId] ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}
                      `}
                      onClick={() => refreshFighterData(fighter)}
                    >
                      <RefreshCw className={`h-3 w-3 mr-1 ${isRefreshing[fighterId] ? 'animate-spin' : ''}`} />
                      {isRefreshing[fighterId] ? 'Updating...' : 'Refresh'}
                    </span>
                  </TableCell>

                  <TableCell>
                    <span 
                    className={
                      `cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium leading-4 bg-gray-100 text-gray-800`
                    }
                    
                    onClick={() => {
                      setSelectedFighter(fighter);
                      setOpenPotentialMatchesModal(true);
                    }}                    >
                     Search
                    </span>
                  </TableCell>
                </TableRow>
              )})}
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
        fighter={selectedFighter as Fighter} 
        onClose={() => setOpenPotentialMatchesModal(false)} 
      />
    )}

    </CollapsibleContent>
  </Collapsible>
  );
}