'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import FighterForm from '../FighterForm';
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

interface FighterFormData {
    first: string;
    last: string;
    email: string;
    dob: string;
    gym: string;
    age: number;
    weightclass: number;
    fighter_id: string;
    win: number;
    loss: number;
    gender: string;
    years_exp: number;
    other: string;
    ammy: number;
    height: number;
    heightFoot: number;
    heightInch: number;
    phone: string;
    coach_phone: string;
    coach_name: string;
    coach_email: string;
    state: string;
    city: string;
    mt_win: number;
    mt_loss: number;
    boxing_win: number;
    boxing_loss: number;
    mma_win: number;
    mma_loss: number;
    pmt_win: number;
    pmt_loss: number;
    gym_id?: string;
  
  }

interface AddFighterModalProps {
  eventId: string;
  savesTo: 'roster' | 'database';
  isOpen: boolean;
  promoterId: string;
  onClose: () => void;
  onFighterAdded?: (fighter: FighterFormData) => void;
}

export default function AddFighterModal({ 
  eventId, 
  savesTo, 
  isOpen, 
  promoterId,
  onClose,
  onFighterAdded 
}: AddFighterModalProps) {
    const [fighterData, setFighterData] = useState<FighterFormData | null>(null);
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
      // Always save fighter to the fighters collection
      await saveToTechBoutsFighters(fighterData);

      // Then save to roster or elsewhere based on savesTo prop
      if (savesTo === 'roster') {
        await saveToRoster(fighterData);
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
    }
  };

  const saveToTechBoutsFighters = async (fighter: FighterFormData) => {
    // Save the fighter to the global fighters collection
    const fighterId = fighter.fighter_id || `${fighter.first}${fighter.last}${Date.now()}`;
    await setDoc(doc(db, 'techbouts_fighters', fighterId), fighter);
  };

  const saveToRoster = async (fighter: FighterFormData) => {
    try {
      // Get current date
      const currentDate = new Date().toISOString();
      
      // Determine fighter class based on experience and amateur status
      const fighterClass = determineClass(fighter.years_exp || 0, fighter.ammy || 0);
      
      // Determine age_gender classification
      const ageGenderClassification = determineAgeGender(fighter.age, fighter.gender);
      
      // Calculate height in inches
      const heightInInches = calculateHeightInInches(fighter.heightFoot, fighter.heightInch);
      
      // Prepare fighter data with additional fields
      const fullContactFighterData = {
        ...fighter,
        // Ensure ID fields
        id: fighter.fighter_id,
        docId: fighter.fighter_id,
        
        // Format email to lowercase for consistency
        email: fighter.email.toLowerCase(),
        
        // Add calculated fields
        height: heightInInches,
        class: fighterClass,
        age_gender: ageGenderClassification,
        confirmed: true,
        
        // Add registration date
        date_registered: currentDate
      };
      
      // Reference to the roster_json document
      const rosterJsonRef = doc(db, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
      
      // Check if the document exists
      const rosterJsonDoc = await getDoc(rosterJsonRef);
      const batch = writeBatch(db);
      
      if (rosterJsonDoc.exists()) {
        // Document exists, get the current fighters array
        const data = rosterJsonDoc.data();
        const fighters = data.fighters || [];
        
        // Add the new fighter to the array
        fighters.push(fullContactFighterData);
        
        // Update the document with the new array
        batch.update(rosterJsonRef, { fighters: fighters });
      } else {
        // Document doesn't exist, create it with the fighter as the first item in the array
        batch.set(rosterJsonRef, { fighters: [fullContactFighterData] });
      }
      
      // The individual fighter document creation has been removed
      
      // Commit the batch
      await batch.commit();
    } catch (error) {
      console.error('Error saving fighter data to Firestore:', error);
      throw new Error('Failed to save fighter data');
    }
  };
  



  // Helper functions
  const calculateHeightInInches = (feet: number, inches: number): number => {
    return (feet * 12) + inches;
  };
  
  const determineClass = (yearsExp: number, ammy: number): string => {
    if (ammy === 0) return 'PRO';
    if (yearsExp >= 5) return 'A';
    if (yearsExp >= 3) return 'B';
    if (yearsExp >= 1) return 'C';
    return 'N';
  };
  
  const determineAgeGender = (age: number, gender: string): string => {
    if (age >= 40) return gender === 'MALE' ? 'MASTER MALE' : 'MASTER FEMALE';
    if (age >= 18) return gender === 'MALE' ? 'ADULT MALE' : 'ADULT FEMALE';
    if (age >= 15) return gender === 'MALE' ? 'JUNIOR MALE' : 'JUNIOR FEMALE';
    if (age >= 12) return gender === 'MALE' ? 'CADET MALE' : 'CADET FEMALE';
    return gender === 'MALE' ? 'YOUTH MALE' : 'YOUTH FEMALE';
  };

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
          onFormDataChange={setFighterData}
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