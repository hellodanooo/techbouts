// components/RosterTable.tsx
'use client'
import React, { useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import FindPotentialMatchesModal from './PotentialMatchesModal';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";




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
}

export default function RosterTable({ roster }: RosterTableProps) {
  
  const[openPotentialMatchesModal, setOpenPotentialMatchesModal] = React.useState(false);
  const [selectedFighter, setSelectedFighter] = React.useState<Fighter | null>(null);
  const [openSections, setOpenSections] = useState({
    details: false,
  });

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  
  if (!roster?.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Event Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No roster data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Collapsible
    open={openSections.details}
    onOpenChange={() => toggleSection('details')}
    className="w-full border rounded-lg overflow-hidden"
  >
    <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100">
      <h2 className="text-xl font-semibold">Roster</h2>
      {openSections.details ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
    </CollapsibleTrigger>
    <CollapsibleContent className="p-4 bg-white">
 
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
                <TableHead>Experience</TableHead>
                <TableHead>Edit</TableHead>
                <TableHead>Search</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((fighter, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {`${fighter.first || ''} ${fighter.last || ''}`}
                  </TableCell>
                  <TableCell>{fighter.gym || '-'}</TableCell>
                  <TableCell>{fighter.weightclass || '-'}</TableCell>
                  <TableCell>{fighter.age || '-'}</TableCell>
                  <TableCell>{fighter.gender || '-'}</TableCell>
                  <TableCell>{fighter.experience || '-'}</TableCell>
                 
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

          {openPotentialMatchesModal && (
  <FindPotentialMatchesModal 
    fighter={selectedFighter as Fighter} 
    onClose={() => setOpenPotentialMatchesModal(false)} 
  />
)}
        </div>
      </CardContent>
    </Card>
    </CollapsibleContent>
  </Collapsible>
  );
}