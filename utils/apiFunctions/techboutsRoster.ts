// utils/apiFunctions/techBoutsRoster.ts
import { toast } from 'sonner';
import { doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config'; // adjust this import based on where your firebase config is
import { RosterFighter } from '@/utils/types';

import { FullContactFighter } from '@/utils/types';


export const fetchTechBoutsRoster = async (promoterId: string, eventId: string) => {
    try {
      // Get a reference to the roster_json document that contains all fighters
      const rosterJsonRef = doc(techboutsDb, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
      const rosterDoc = await getDoc(rosterJsonRef);
      
      if (rosterDoc.exists()) {
        const data = rosterDoc.data();
        return data.fighters || [];
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error fetching fighters:', error);
      return [];
    }
  };


  export const refreshOneFighterData = async (
    fighter: RosterFighter,
    promoterId: string,
    eventId: string,
    setIsRefreshing: React.Dispatch<React.SetStateAction<{ [key: string]: boolean }>>,
    setRosterData: React.Dispatch<React.SetStateAction<RosterFighter[]>>
  ) => {
    const fighterId = fighter.fighter_id;
    if (!fighterId) {
      toast.error("Fighter ID not available");
      return;
    }
  
    try {
      setIsRefreshing(prev => ({ ...prev, [fighterId]: true }));
  
      const fighterDocRef = doc(techboutsDb, 'techbouts_fighters', fighterId);
      const fighterDoc = await getDoc(fighterDocRef);
  
      if (!fighterDoc.exists()) {
        toast.error("Fighter not found", {
          description: "The fighter data could not be found in the database"
        });
        return;
      }
  
      const updatedFighterData = fighterDoc.data();
  
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
  
      const rosterJsonRef = doc(techboutsDb, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
      const rosterDoc = await getDoc(rosterJsonRef);
  
      if (rosterDoc.exists()) {
        const rosterData = rosterDoc.data();
        const currentFighters = rosterData.fighters || [];
  
        const updatedRoster = currentFighters.map((f: RosterFighter) => {
          const currentFighterId = f.fighter_id;
          if (currentFighterId === fighterId) {
            return { ...f, ...updatedFighter };
          }
          return f;
        });
  
        await setDoc(rosterJsonRef, { fighters: updatedRoster });
  
        // Instead of router.refresh(), re-fetch the updated roster
        const newRoster = await fetchTechBoutsRoster(promoterId, eventId);
        setRosterData(newRoster);
  
        toast.success("Fighter updated", {
          description: `${updatedFighter.first} ${updatedFighter.last}'s data has been refreshed`
        });
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
      setIsRefreshing(prev => ({ ...prev, [fighterId]: false }));
    }
  };


  export const deleteFighterFromRoster = async (
    fighterId: string,
    promoterId: string,
    eventId: string,
  ) => {
    try {
      const rosterJsonRef = doc(techboutsDb, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
      const rosterDoc = await getDoc(rosterJsonRef);
  
      if (!rosterDoc.exists()) {
        toast.error("Roster not found");
        return;
      }
  
      const fighters: RosterFighter[] = rosterDoc.data().fighters || [];
      const updatedFighters = fighters.filter(f => f.fighter_id !== fighterId);
  
      await setDoc(rosterJsonRef, { fighters: updatedFighters });
  
  
      toast.success("Fighter deleted from roster");
    } catch (error) {
      console.error('Error deleting fighter:', error);
      toast.error("Failed to delete fighter");
    }
  };
  

  export const saveToRoster = async (fighter: FullContactFighter, eventId: string, promoterId: string) => {
    if (!eventId) throw new Error("eventId is required for saving to roster");
    if (!promoterId) throw new Error("promoterId is required for saving to roster");
       try {
      // Get current date
      const currentDate = new Date().toISOString();
      
      // Determine fighter class based on experience and amateur status
      
      // Determine age_gender classification
      const ageGenderClassification = determineAgeGender(fighter.age, fighter.gender);
      
      // Calculate height in inches
      
      // Prepare fighter data with additional fields
      const fullContactFighterData = {
        ...fighter,
        // Ensure ID fields
        docId: fighter.fighter_id,
        
        // Format email to lowercase for consistency
        email: fighter.email.toLowerCase(),
        
        // Add calculated fields
       
        age_gender: ageGenderClassification,
        confirmed: true,
        
        // Add registration date
        date_registered: currentDate
      };
      
      // Reference to the roster_json document
      const rosterJsonRef = doc(techboutsDb, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
      
      // Check if the document exists
      const rosterJsonDoc = await getDoc(rosterJsonRef);
      const batch = writeBatch(techboutsDb);
      
      if (rosterJsonDoc.exists()) {
        // Document exists, get the current fighters array
        const data = rosterJsonDoc.data();
        const fighters = data.fighters || [];
        

        const exists = fighters.some((f: FullContactFighter) => f.fighter_id === fighter.fighter_id);
        if (exists) {
          alert("This fighter is already added to the roster");
          return;
        }

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




  ////////////////////////////////   suporting functions

  const determineAgeGender = (age: number, gender: string): string => {
    if (age >= 40) return gender === 'MALE' ? 'MASTER MALE' : 'MASTER FEMALE';
    if (age >= 18) return gender === 'MALE' ? 'ADULT MALE' : 'ADULT FEMALE';
    if (age >= 15) return gender === 'MALE' ? 'JUNIOR MALE' : 'JUNIOR FEMALE';
    if (age >= 12) return gender === 'MALE' ? 'CADET MALE' : 'CADET FEMALE';
    return gender === 'MALE' ? 'YOUTH MALE' : 'YOUTH FEMALE';
  };