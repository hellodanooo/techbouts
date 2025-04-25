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
import { addFighterToPmtRoster } from '@/utils/apiFunctions/pmtRoster';


interface AddFighterModalProps {
  eventId?: string;
  savesTo: 'roster' | 'database';
  isOpen: boolean;
  promoterId?: string;
  onClose: () => void;
  onFighterAdded?: (fighter: FullContactFighter) => void;
  onRosterUpdated?: () => void;
  sanctioning?: string;
}

export default function AddFighterModal({ 
  eventId, 
  savesTo, 
  isOpen, 
  promoterId,
  onClose,
  onFighterAdded,
  onRosterUpdated,
  sanctioning,

}: AddFighterModalProps) {
    const [fighterData, setFighterData] = useState<FullContactFighter | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

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


const handleSubmitPmt = async () => {
  
      if (!fighterData) {
        toast.error("Missing information", {
          description: "Please fill out all required fighter details.",
        });
        return;
      }
  
      setIsSubmitting(true);
  
      try {
        if (!eventId) {
          throw new Error('Missing eventId for PMT save');
        }
        await addFighterToPmtRoster(fighterData, eventId);
  
        toast.success("Fighter added to PMT roster", {
          description: `${fighterData.first} ${fighterData.last} has been added to the PMT roster successfully.`,
        });
  
        if (onFighterAdded) {
          onFighterAdded(fighterData);
        }
  
        onClose();
      } catch (error) {
        console.error("Error adding fighter to PMT roster:", error);
        toast.error("Error", {
          description: "There was a problem adding the fighter to the PMT roster. Please try again.",
        });
      } finally {
        setIsSubmitting(false);
        if (onRosterUpdated) {
          onRosterUpdated(); 
        }
      }
    }


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
            onClick={sanctioning === 'PMT' ? handleSubmitPmt : handleSubmit} 
            disabled={isSubmitting}
            >
            {isSubmitting ? "Adding..." : "Add Fighter"}
            </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}