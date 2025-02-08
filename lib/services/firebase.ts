// lib/services/firebase.ts
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { 
  collection, 
  getDocs, 
  query, 
  where,
  doc,
  getDoc,
  
} from 'firebase/firestore';
import { Event, ResultsFighter } from '@/utils/types';
import { calculateAge } from '@/utils/calculatAge';

interface ResultsJsonData {
  fighters: Array<{
    first: string;
    last: string;
    gym: string;
    weightclass: number;
    bout: number;
    mat: number;
    id: string;
    age?: number;
    dob?: string;
    result?: string;
    bout_type?: string;
    [key: string]: string | number | undefined;
  }>;
  metadata: {
    totalFighters: number;
    totalBouts: number;
    totalWinners: number;
    lastUpdated: string;
    matCount: number;
    version: string;
  };
}

export class FirebaseService {
  static async getPMTEmails(year: string) {
    try {
      const emailsRef = doc(pmtDb, `emails_pmt_${year}`, 'emails_json');
      const emailsSnap = await getDoc(emailsRef);
      return emailsSnap.exists() ? emailsSnap.data() : null;
    } catch (error) {
      console.error('Error fetching PMT emails:', error);
      throw error;
    }
  }

  static async getTechboutsUsers() {
    try {
      const usersRef = collection(techboutsDb, 'users');
      const snapshot = await getDocs(usersRef);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error('Error fetching Techbouts users:', error);
      throw error;
    }
  }

  static async getPMTFighters(
    selectedYears: Record<string, boolean>,
    selectedState: Record<string, boolean>,
    onProgress?: (message: string) => void
  ): Promise<ResultsFighter[]> {
    const selectedYearKeys = Object.keys(selectedYears).filter(key => selectedYears[key]);
    const selectedStateKeys = Object.keys(selectedState).filter(key => selectedState[key]);
    const tempFighters: ResultsFighter[] = [];

    if (selectedYearKeys.length === 0) {
      onProgress?.('No years selected, skipping fetch');
      return [];
    }

    try {
      const eventsRef = collection(pmtDb, 'events');
      let querySnapshot;
      
      if (selectedStateKeys.length > 0) {
        querySnapshot = await getDocs(query(eventsRef, where('state', 'in', selectedStateKeys)));
      } else {
        querySnapshot = await getDocs(eventsRef);
      }

      if (querySnapshot.empty) {
        onProgress?.('No events found with the selected criteria.');
        return [];
      }

      for (const eventDoc of querySnapshot.docs) {
        const event = eventDoc.data() as Event;
        const eventYear = event.date.substring(0, 4);
        
        if (!selectedYearKeys.includes(eventYear)) {
          continue;
        }

        onProgress?.(`Loading Results From Event: ${event.event_name}`);
        const fighters = await this.getFightersFromEvent(eventDoc.id, event, onProgress);
        tempFighters.push(...fighters);
      }

      return tempFighters;
    } catch (error) {
      console.error('Error fetching events:', error);
      onProgress?.('Error fetching events. Check the console for more information.');
      throw error;
    }
  }

  private static async getFightersFromEvent(
    eventId: string, 
    event: Event,
    onProgress?: (message: string) => void
  ): Promise<ResultsFighter[]> {
    // Try resultsJson first
    const resultsJsonRef = doc(pmtDb, 'events', eventId, 'resultsJson', 'fighters');
    const resultsJsonSnapshot = await getDoc(resultsJsonRef);

    if (resultsJsonSnapshot.exists()) {
      onProgress?.(`Using resultsJson for ${event.event_name}`);
      return this.processFightersFromJson(resultsJsonSnapshot.data() as ResultsJsonData, event, eventId);
    }

    // Fall back to results2 collection
    onProgress?.(`Falling back to results2 collection for ${event.event_name}`);
    return this.processFightersFromResults2(eventId, event);
  }

  private static async processFightersFromJson(
    resultsData: ResultsJsonData,
    event: Event,
    eventId: string
  ): Promise<ResultsFighter[]> {
    return resultsData.fighters.map(fighter => ({
      ...fighter,
      first: fighter.first.toUpperCase(),
      last: fighter.last.toUpperCase(),
      gym: fighter.gym.toUpperCase(),
      weightclass: Number(fighter.weightclass),
      bout: Number(fighter.bout),
      mat: Number(fighter.mat),
      docId: fighter.id,
      eventDocId: eventId,
      comp_city: event.city,
      comp_state: event.state,
      age: fighter.age || (fighter.dob ? calculateAge(fighter.dob) : 0),
      result: fighter.result || '',
      bout_type: fighter.bout_type || 'reg',
      boutmat: `bout${fighter.bout}mat${fighter.mat}`
    })) as ResultsFighter[];
  }

  private static async processFightersFromResults2(
    eventId: string,
    event: Event
  ): Promise<ResultsFighter[]> {
    const fightersRef = collection(pmtDb, 'events', eventId, 'results2');
    const fightersSnapshot = await getDocs(fightersRef);
    
    return fightersSnapshot.docs.map(fighterDoc => {
      const fighter = fighterDoc.data() as ResultsFighter;
      return {
        ...fighter,
        docId: fighterDoc.id,
        eventDocId: eventId,
        comp_city: event.city,
        comp_state: event.state,
        first: fighter.first?.toUpperCase() || '',
        last: fighter.last?.toUpperCase() || '',
        gym: fighter.gym?.toUpperCase() || '',
        age: (fighter.age === undefined || fighter.age <= 0) && fighter.dob 
          ? calculateAge(fighter.dob) 
          : fighter.age
      };
    });
  }
}