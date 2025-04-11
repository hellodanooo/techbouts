// components/database/AddFighterModal.tsx

'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

import FighterForm from '../events/FighterForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FullContactFighter } from '@/utils/types';
import { saveToRoster } from '@/utils/apiFunctions/techboutsRoster';
import { saveToTechBoutsFighterDatabase } from '@/utils/apiFunctions/techboutsDatabase';

interface AddFighterModalProps {
  eventId?: string;
  savesTo: 'roster' | 'database';
  isOpen: boolean;
  promoterId?: string;
  onClose: () => void;
  onFighterAdded?: (fighter: FullContactFighter) => void;
  onRosterUpdated?: () => void;
}

export default function AddFighterModal({ 
  eventId, 
  savesTo, 
  isOpen, 
  promoterId,
  onClose,
  onFighterAdded,
  onRosterUpdated,
}: AddFighterModalProps) {
    const [fighterData, setFighterData] = useState<FullContactFighter | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
  // Using Sonner toast instead of the deprecated toast component

 

  const handleSubmit = async () => {
    if (!fighterData) {
      toast.error("Missing information", {
        description: "Please fill out all required fighter details.",
      });
      return;
    }

    setIsSubmitting(true);

    try {

         
      await saveToTechBoutsFighterDatabase(fighterData);



      if (savesTo === 'roster') {
        if (!eventId) {
          throw new Error('Missing eventId for roster save');
        }
        if (!eventId || !promoterId) {
          throw new Error('Missing eventId or promoterId for roster save');
        }
        await saveToRoster(fighterData, eventId, promoterId);
      }

      toast.success("Fighter added", {
        description: `${fighterData.first} ${fighterData.last} has been added successfully.`,
      });

      if (onFighterAdded) {
        onFighterAdded(fighterData);
      }

      onClose();
    } catch (error) {
      console.error("Error adding fighter:", error);
      toast.error("Error", {
        description: "There was a problem adding the fighter. Please try again.",
      });
    } finally {
      setIsSubmitting(false);
      if (onRosterUpdated) {
        onRosterUpdated(); 
      }
    }
  };




  // const saveToTechBoutsFighters = async (fighter: FullContactFighter) => {
  //   // Save the fighter to the global fighters collection
  //   await setDoc(doc(db, 'techbouts_fighters', fighterId), fighter);
  // };



  // const saveToRoster = async (fighter: FullContactFighter) => {
  //   if (!eventId) throw new Error("eventId is required for saving to roster");
  //   if (!promoterId) throw new Error("promoterId is required for saving to roster");
  //      try {
  //     // Get current date
  //     const currentDate = new Date().toISOString();
      
  //     // Determine fighter class based on experience and amateur status
      
  //     // Determine age_gender classification
  //     const ageGenderClassification = determineAgeGender(fighter.age, fighter.gender);
      
  //     // Calculate height in inches
      
  //     // Prepare fighter data with additional fields
  //     const fullContactFighterData = {
  //       ...fighter,
  //       // Ensure ID fields
  //       docId: fighter.fighter_id,
        
  //       // Format email to lowercase for consistency
  //       email: fighter.email.toLowerCase(),
        
  //       // Add calculated fields
       
  //       age_gender: ageGenderClassification,
  //       confirmed: true,
        
  //       // Add registration date
  //       date_registered: currentDate
  //     };
      
  //     // Reference to the roster_json document
  //     const rosterJsonRef = doc(db, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
      
  //     // Check if the document exists
  //     const rosterJsonDoc = await getDoc(rosterJsonRef);
  //     const batch = writeBatch(db);
      
  //     if (rosterJsonDoc.exists()) {
  //       // Document exists, get the current fighters array
  //       const data = rosterJsonDoc.data();
  //       const fighters = data.fighters || [];
        
  //       // Add the new fighter to the array
  //       fighters.push(fullContactFighterData);
        
  //       // Update the document with the new array
  //       batch.update(rosterJsonRef, { fighters: fighters });
  //     } else {
  //       // Document doesn't exist, create it with the fighter as the first item in the array
  //       batch.set(rosterJsonRef, { fighters: [fullContactFighterData] });
  //     }
      
  //     // The individual fighter document creation has been removed
      
  //     // Commit the batch
  //     await batch.commit();
  //   } catch (error) {
  //     console.error('Error saving fighter data to Firestore:', error);
  //     throw new Error('Failed to save fighter data');
  //   }
  // };
  
  
  // const determineAgeGender = (age: number, gender: string): string => {
  //   if (age >= 40) return gender === 'MALE' ? 'MASTER MALE' : 'MASTER FEMALE';
  //   if (age >= 18) return gender === 'MALE' ? 'ADULT MALE' : 'ADULT FEMALE';
  //   if (age >= 15) return gender === 'MALE' ? 'JUNIOR MALE' : 'JUNIOR FEMALE';
  //   if (age >= 12) return gender === 'MALE' ? 'CADET MALE' : 'CADET FEMALE';
  //   return gender === 'MALE' ? 'YOUTH MALE' : 'YOUTH FEMALE';
  // };



  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Add Fighter to Roster</span>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
          <DialogDescription>
            Complete the form below to add a fighter to the event roster.
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4">
          <FighterForm 
          onFormDataChange={(data: FullContactFighter) => {
            const mappedData: FullContactFighter = {
              ...data,
              mt_win: data.mt_win || 0,
              mt_loss: data.mt_loss || 0,
              pmt_win: data.pmt_win || 0,
              pmt_loss: data.pmt_loss || 0,

            };
            setFighterData(mappedData as FullContactFighter);
          }}
          source='add-fighter-modal'
         
           />
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
          >
            {isSubmitting ? "Adding..." : "Add Fighter"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}