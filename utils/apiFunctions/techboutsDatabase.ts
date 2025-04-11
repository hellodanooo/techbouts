
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { FullContactFighter } from '@/utils/types';
import dayjs from 'dayjs';
import { toast } from 'sonner';



export const saveToTechBoutsFighterDatabase = async (fighter: FullContactFighter) => {
  
    const fighterId = generateFighterId(fighter.first, fighter.last, fighter.dob);

    const fighterDocRef = doc(techboutsDb, 'techbouts_fighters', fighterId);
    const fighterDocSnap = await getDoc(fighterDocRef);
  
    if (fighterDocSnap.exists()) {
      const existingFighter = fighterDocSnap.data();
      toast.error("This fighter already exists in the database", {
        description: `Please search for email: ${existingFighter.email || 'N/A'} or last name: ${existingFighter.last || 'N/A'}`
      });
      return;
    }


    await setDoc(doc(techboutsDb, 'techbouts_fighters', fighterId), fighter);
  };



  export const generateFighterId = (firstName: string, lastName: string, dob: string): string => {
    const [month, day, year] = dob.split('/');
    return `${firstName.trim().replace(/\s/g, '').toUpperCase()}${lastName.trim().replace(/\s/g, '').toUpperCase()}${day}${month}${year}`;
  };


  export const calculateAge = (dob: string): number => {
    const birthDate = dayjs(dob);
    const today = dayjs();
    return today.diff(birthDate, 'year');
  };
