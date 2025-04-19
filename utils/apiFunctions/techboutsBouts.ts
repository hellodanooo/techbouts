// utils/apiFunctions/fetchTechboutsBouts.ts
import { db } from '@/lib/firebase_techbouts/config';
import { Firestore, doc, getDoc, deleteDoc } from 'firebase/firestore';





/**
 * Deletes the entire matches JSON document for an event
 * 
 * @param promoterId - The promoter's ID
 * @param eventId - The event's ID
 * @returns Promise<boolean> - True if delete was successful, false otherwise
 */
export async function deleteTechboutsMatchesJson(promoterId: string, eventId: string): Promise<boolean> {
  const boutsPath = `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`;
  
  // Show confirmation dialog
  const isConfirmed = window.confirm("Are You Sure You Want To Delete the Matches?");
  
  if (!isConfirmed) {
    return false;
  }
  
  try {
    const boutsRef = doc(db, boutsPath);
    await deleteDoc(boutsRef);
    console.log(`Successfully deleted matches for event ${eventId}`);
    return true;
  } catch (err) {
    console.error(`Failed to delete matches from path: ${boutsPath}`, err);
    return false;
  }
}





export async function fetchTechboutsBouts(promoterId: string, eventId: string) {
    const boutsPath = `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`;
  
    try {
      const boutsRef = doc(db, boutsPath);
      const boutsDoc = await getDoc(boutsRef);
  
      if (boutsDoc.exists()) {
        const data = boutsDoc.data();
        if (data && Array.isArray(data.bouts)) {
          return data.bouts;
        }
      }
    } catch (err) {
      console.error(`Failed to fetch bouts from path: ${boutsPath}`, err);
    }
  
    return [];
  }



  