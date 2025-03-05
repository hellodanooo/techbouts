// utils/apiFunctions/fetchTechBoutsRoster.ts
import { db } from '@/lib/firebase_techbouts/config';
import { Firestore, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';



export const fetchTechBoutsRoster = async (promoterId: string, eventId: string) => {
    try {
      // Get a reference to the roster_json document that contains all fighters
      const rosterJsonRef = doc(db, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
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