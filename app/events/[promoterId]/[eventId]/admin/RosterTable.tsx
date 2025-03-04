// components/RosterTable.tsx
'use client'
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

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

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import FindPotentialMatchesModal from './PotentialMatchesModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";


import AddFighterModal from './AddFighterModal';




interface Fighter {
  first?: string;
  last?: string;
  gym?: string;
  weightclass?: string | number;
  age?: string | number;
  experience?: string | number;
  status?: string;
  [key: string]: string | number | undefined;
  gender: string;
}

interface RosterTableProps {
  roster: Fighter[];
  eventId: string;
  promoterId: string;
}

export default function RosterTable({ roster, eventId, promoterId }: RosterTableProps) {
  const router = useRouter();

  const[openPotentialMatchesModal, setOpenPotentialMatchesModal] = React.useState(false);
  const [selectedFighter, setSelectedFighter] = React.useState<Fighter | null>(null);

  const [openAddFighterModal, setOpenAddFighterModal] = useState(false);

  
  const [openSections, setOpenSections] = useState({
    roster: true,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };


  const navigateToFighterDetail = (fighter: Fighter) => {
    const fighterId = fighter.fighter_id || fighter.id;
    if (fighterId) {
      router.push(`/fighter/${fighterId}`);
    } else {
      console.error("Fighter ID not available for navigation");
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
                <TableHead>Name</TableHead>
                <TableHead>Gym</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>MT-MMA</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Search</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((fighter, index) => (
                <TableRow key={index}>
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
                    className={
                      `cursor-pointer inline-flex items-center rounded-full px-2 py-1 text-xs font-medium leading-4 bg-gray-100 text-gray-800`
                    }
                    
                    onClick={() => {
                      setSelectedFighter(fighter);
                    //  setOpenEditModal(true);
                    }}                    >
                     Edit
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
              ))}
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