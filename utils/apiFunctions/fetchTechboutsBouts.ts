// utils/apiFunctions/fetchTechboutsBouts.ts
import { db } from '@/lib/firebase_techbouts/config';
import { Firestore, doc, getDoc } from 'firebase/firestore';



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
  