// app/events/[promoterId]/[eventId]/edit/OfficialsEvent.tsx
'use client';

import React, { FC, useEffect, useState } from 'react';
import { deleteDoc, setDoc, getFirestore, collection, getDocs, doc, updateDoc, FirestoreError } from 'firebase/firestore';
import { app } from '@/lib/firebase_techbouts/config';
import { Official } from '@/utils/types';
import Link from 'next/link';
import { fetchOfficials } from '@/utils/officials/fetchOfficials';

import OfficialLayoutModal from './OfficialLayoutModal';
import OfficialBankModal from './OfficialBankModal';
import OfficialsAccounting from '@/components/officials/OfficialsAccounting';
import { Calculator } from "lucide-react";


import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger
} from "@/components/ui/collapsible";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,

} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronDown, ChevronRight, Trash2, RefreshCw, Share, UserPlus, Users } from "lucide-react";

interface OfficialsEventProps {
  eventId: string;
  numMats: number;
  promoterId: string;
  sanctioning: string;
  eventName: string;
  eventDate: string;
  eventAddress: string;
}

interface SelectLocationDropdownProps {
  officialsList: Official[];
  onSelectLocation: (officialId: string, mat: number, location: string) => void;
  mat: number;
  location: string;
}

const SelectLocationDropdown: FC<SelectLocationDropdownProps> = ({ officialsList, onSelectLocation, mat, location }) => {
  const handleSelect = (value: string) => {
    if (value) {
      onSelectLocation(value, mat, location);
    }
  };

  return (
    <Select onValueChange={handleSelect}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Select Official" />
      </SelectTrigger>
      <SelectContent>
        {officialsList.map(official => (
          <SelectItem key={official.id} value={official.id}>
            {official.first} {official.last}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

const OfficialsEvent: FC<OfficialsEventProps> = ({ eventId, numMats, promoterId, eventName, eventDate, eventAddress, sanctioning }) => {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [allOfficials, setAllOfficials] = useState<Official[]>([]);
  const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);
  const [isAccountingModalOpen, setIsAccountingModalOpen] = useState(false);

  // State for the OfficialBankModal
  const [isOfficialBankModalOpen, setIsOfficialBankModalOpen] = useState(false);
  const [currentPosition, setCurrentPosition] = useState<string>('');

  const [openSections, setOpenSections] = useState({
    officials: false,
  });
  
  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  // Fetch officials assigned to this event
  useEffect(() => {
    const fetchEventOfficials = async () => {
      setIsLoading(true);
      setLoadingError(null);
      
      const db = getFirestore(app);
      const eventDocRef = doc(db, 'events', 'promotions', promoterId, eventId);
      const officialsColRef = collection(eventDocRef, 'officials');

      try {
        const querySnapshot = await getDocs(officialsColRef);
        const officialsData: Official[] = [];
        querySnapshot.forEach((docSnap) => {
          const officialData = docSnap.data() as Official;
          officialsData.push({ ...officialData, id: docSnap.id });
        });
        setOfficials(officialsData);
        setIsLoading(false);
      } catch (error) {
        const firestoreError = error as FirestoreError;
        console.error('Error fetching event officials:', firestoreError);
        setLoadingError(`Failed to load event officials: ${firestoreError.message || 'Unknown error'}`);
        setIsLoading(false);
      }
    };
    
    fetchEventOfficials();
  }, [eventId, promoterId]);

  // Fetch all available officials - for use in the OfficialBankModal
  useEffect(() => {
    const loadAllOfficials = async () => {
      try {
        console.log('Fetching officials from utility function...');
        const officials = await fetchOfficials();
        console.log(`Successfully fetched ${officials.length} officials`);
        setAllOfficials(officials);
      } catch (error) {
        const firestoreError = error as FirestoreError;
        console.error('Error fetching all officials:', firestoreError);
        // Still continue - the modal will just show an empty state
        setAllOfficials([]);
      }
    };

    loadAllOfficials();
  }, []);

  const renderTableForPosition = (position: string) => {
    const filteredOfficials = officials.filter(official => official.position === position);

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Location</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filteredOfficials.length > 0 ? (
            filteredOfficials.map(official => (
              <TableRow key={official.id}>
                <TableCell className="font-medium">{official.first} {official.last}</TableCell>
                <TableCell>{official.city && official.state ? `${official.city}, ${official.state}` : 'N/A'}</TableCell>
                <TableCell>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={() => handleDeleteOfficial(official.id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Remove
                  </Button>
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={3} className="text-center text-muted-foreground">
                No {position.toLowerCase()} officials added yet
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    );
  };

  const handleDeleteOfficial = async (officialId: string) => {
    if (!window.confirm("Are you sure you want to delete this official from this event?")) return;

    try {
      await deleteDoc(doc(getFirestore(app), 'events', 'promotions', promoterId, eventId, 'officials', officialId));
      console.log("Official deleted successfully");

      // Remove the official from the officials list
      setOfficials(prevOfficials => prevOfficials.filter(official => official.id !== officialId));
    } catch (error) {
      console.error('Error deleting official:', error);
      alert('Failed to delete official. Please try again.');
    }
  };

  const handleAddOfficial = async (officialId: string, position: string) => {
    const officialToAdd = allOfficials.find(official => official.id === officialId);
    if (!officialToAdd) {
      console.error("Official not found in allOfficials list");
      alert('Could not find the selected official in the database.');
      return;
    }
  
    // Check if this official is already assigned to this event with this position
    const existingOfficial = officials.find(o => o.id === officialId && o.position === position);
    if (existingOfficial) {
      alert(`This official is already assigned as a ${position}.`);
      return;
    }
  
    const newOfficial = { ...officialToAdd, position };
  
    try {
      const db = getFirestore(app);
      const eventDocRef = doc(db, 'events', 'promotions', promoterId, eventId);
      // Use setDoc with the profile ID instead of addDoc
      const officialDocRef = doc(eventDocRef, 'officials', officialId);
      await setDoc(officialDocRef, newOfficial);
      console.log(`${position} added successfully with ID: ${officialId}`);
  
      // Update the officials list using the same ID
      setOfficials(prevOfficials => [...prevOfficials, newOfficial]);
    } catch (error) {
      console.error(`Error adding ${position.toLowerCase()}:`, error);
      alert(`Failed to add ${position.toLowerCase()}. Please try again.`);
    }
  };

  const openOfficialBankModal = (position: string) => {
    setCurrentPosition(position);
    setIsOfficialBankModalOpen(true);
  };

  // ALL CODE FOR ASSIGNING OFFICIAL LOCATION AND MAT
  const handleAssignOfficial = async (officialId: string, mat: number, location: string) => {
    if (!officialId) return; // Don't do anything if no official is selected
    
    const db = getFirestore(app);
    const officialToAssign = officials.find(official => official.id === officialId);
    if (!officialToAssign) {
      console.error("Official not found in event's officials list");
      return;
    }

    const updatedOfficial = { ...officialToAssign, mat, location };

    try {
      // Unassign previous official from the same mat and location
      const prevOfficial = officials.find(
        official => official.location === location && official.mat === mat && official.id !== officialId
      );

      if (prevOfficial) {
        await updateDoc(doc(db, 'events', 'promotions', promoterId, eventId, 'officials', prevOfficial.id), {
          mat: -1,
          location: ""
        });
        setOfficials(prevOfficials =>
          prevOfficials.map(official =>
            official.id === prevOfficial.id ? { ...official, mat: -1, location: "" } : official
          )
        );
      }

      const officialDocRef = doc(db, 'events', 'promotions', promoterId, eventId, 'officials', officialId);
      await updateDoc(officialDocRef, { mat, location });
      console.log(`Assigned ${officialToAssign.first} ${officialToAssign.last} to mat ${mat} at ${location}`);

      // Update assigned locations in local state
      setOfficials(prevOfficials =>
        prevOfficials.map(official =>
          official.id === officialId ? updatedOfficial : official
        )
      );
    } catch (error) {
      console.error(`Error assigning official to mat ${mat} at ${location}:`, error);
    }
  };

  const renderAssignedOfficial = (mat: number, location: string) => {
    const official = officials.find(official => official.location === location && official.mat === mat);
    return official ? `${official.first} ${official.last}` : `Select ${location}`;
  };

  const renderMat = (matNumber: number) => (
    <Card key={matNumber} className="mb-6">
      <CardHeader>
        <CardTitle>Mat {matNumber}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Judge 1</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{renderAssignedOfficial(matNumber, 'judge1')}</p>
              <SelectLocationDropdown 
                onSelectLocation={handleAssignOfficial} 
                officialsList={officials.filter(o => o.position === 'Judge')} 
                mat={matNumber} 
                location="judge1" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Judge 2</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{renderAssignedOfficial(matNumber, 'judge2')}</p>
              <SelectLocationDropdown 
                onSelectLocation={handleAssignOfficial} 
                officialsList={officials.filter(o => o.position === 'Judge')} 
                mat={matNumber} 
                location="judge2" 
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Judge 3</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{renderAssignedOfficial(matNumber, 'judge3')}</p>
              <SelectLocationDropdown 
                onSelectLocation={handleAssignOfficial} 
                officialsList={officials.filter(o => o.position === 'Judge')} 
                mat={matNumber} 
                location="judge3" 
              />
            </CardContent>
          </Card>
        </div>

        <div className="mt-4 flex justify-center">
          <Card className="w-full sm:w-1/3">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Referee</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm mb-2">{renderAssignedOfficial(matNumber, 'referee')}</p>
              <SelectLocationDropdown 
                onSelectLocation={handleAssignOfficial} 
                officialsList={officials.filter(o => o.position === 'Referee')} 
                mat={matNumber} 
                location="referee" 
              />
            </CardContent>
          </Card>
        </div>
      </CardContent>
    </Card>
  );


  if (loadingError) {
    return (
      <Alert variant="destructive" className="mb-4">
        <AlertDescription>
          <p className="font-bold">Error loading officials:</p>
          <p>{loadingError}</p>
          <Button 
            onClick={() => window.location.reload()}
            className="mt-4"
            variant="outline"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Retry
          </Button>
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Collapsible
      open={openSections.officials}
      onOpenChange={() => toggleSection('officials')}
      className="w-full rounded-lg border"
    >
      <CollapsibleTrigger className="flex items-center justify-between w-full px-4 py-3 bg-card hover:bg-muted/50 rounded-t-lg">
        <div className="flex items-center">
          <Users className="mr-2 h-5 w-5" />
          <h2 className="text-xl font-semibold">Officials</h2>
          <Badge className="ml-2" variant="outline">
            {officials.length}
          </Badge>
        {isLoading &&
                  <RefreshCw className="h-4 w-8 animate-spin text-primary" />

        }

          </div>
        {openSections.officials ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
      </CollapsibleTrigger>
      
      <CollapsibleContent className="p-4 bg-background rounded-b-lg">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-semibold">Representative</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openOfficialBankModal('Representative')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Select Official
              </Button>
            </CardHeader>
            <CardContent>
              {renderTableForPosition('Representative')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-semibold">Referees</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openOfficialBankModal('Referee')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Select Official
              </Button>
            </CardHeader>
            <CardContent>
              {renderTableForPosition('Referee')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <div className="flex items-center space-x-2">
                <CardTitle className="text-md font-semibold">Judges</CardTitle>
                <Badge variant="secondary">
                  {officials.filter(o => o.position === 'Judge').length}
                </Badge>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openOfficialBankModal('Judge')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Select Official
              </Button>
            </CardHeader>
            <CardContent>
              {renderTableForPosition('Judge')}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-md font-semibold">Medical</CardTitle>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openOfficialBankModal('Medical')}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                Select Official
              </Button>
            </CardHeader>
            <CardContent>
              {renderTableForPosition('Medical')}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-wrap items-center gap-4 mb-6">
          <Button asChild variant="outline">
            <Link href="/officials/apply">
              Share Official Application
            </Link>
          </Button>
          
          <Button asChild variant="outline">
            <Link href="/officials">
              Add New Official
            </Link>
          </Button>
        </div>
        
        <Separator className="my-6" />

        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">
                {numMats}
              </Badge>
              <p className="font-medium">Mats configured for this event</p>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6">
          <h2 className="text-xl font-bold mb-4">Mat Assignments</h2>
          <div className="space-y-6">
            {[...Array(numMats)].map((_, i) => renderMat(i + 1))}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <Button 
            onClick={() => setIsLayoutModalOpen(true)}
            className="px-6"
          >
            <Share className="h-4 w-4 mr-2" />
            Share Image
          </Button>
        </div>

        {/* Official Bank Modal */}
        <OfficialBankModal
          isOpen={isOfficialBankModalOpen}
          onClose={() => setIsOfficialBankModalOpen(false)}
          officialsList={allOfficials}
          onSelectOfficial={handleAddOfficial}
          position={currentPosition}
        />

        {/* Layout Modal for sharing */}
        <OfficialLayoutModal
          isOpen={isLayoutModalOpen}
          onClose={() => setIsLayoutModalOpen(false)}
          officials={officials}
          matCount={numMats}
        />


<div className="flex justify-center">
  <Button 
    variant="default" 
    onClick={() => setIsAccountingModalOpen(true)}
    className="bg-green-600 hover:bg-green-700 text-white mt-4 mb-4 px-4 py-2 rounded-md"
  >
    <Calculator className="h-4 w-4 mr-2" />
    Officials Accounting
  </Button>
</div>

<OfficialsAccounting
  isOpen={isAccountingModalOpen}
  onClose={() => setIsAccountingModalOpen(false)}
  officials={officials}
  eventId={eventId}
  promoterId={promoterId}
  eventName={eventName}
  eventDate={eventDate}
  eventAddress={eventAddress}
  numMats={numMats}
  sanctioning={sanctioning}
/>
      </CollapsibleContent>
    </Collapsible>
  );
};

export default OfficialsEvent;