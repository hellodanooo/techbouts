import { 
    doc as firestoreDoc,
    collection, 
    query, 
    where, 
    getDocs, 
    getFirestore, 
    getDoc,
  } from 'firebase/firestore';
  import { app } from '@/lib/firebase_pmt/config';
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


export const fetchResultsFighters = async (
    selectedYears: Record<string, boolean>,
    selectedState: Record<string, boolean>,
    updateLog: (logMessage: string) => void
  ): Promise<ResultsFighter[]> => {
    const db = getFirestore(app);
    const selectedYearKeys = Object.keys(selectedYears).filter(key => selectedYears[key]);
    const selectedStateKeys = Object.keys(selectedState).filter(key => selectedState[key]);
    const tempFighters: ResultsFighter[] = [];
  
    if (selectedYearKeys.length === 0) {
      console.log('No years selected, skipping fetch');
      updateLog('No years selected, skipping fetch');
      return [];
    }
  
    try {
      const eventsRef = collection(db, 'events');
      let querySnapshot;
      
      if (selectedStateKeys.length > 0) {
        querySnapshot = await getDocs(query(eventsRef, where('state', 'in', selectedStateKeys)));
      } else {
        querySnapshot = await getDocs(eventsRef);
      }
  
      if (querySnapshot.empty) {
        updateLog('No events found with the selected criteria.');
        return [];
      }
  
      // Process each event
      for (const eventDoc of querySnapshot.docs) {
        const event = eventDoc.data() as Event;
        
        // Check if event date matches selected years
        const eventYear = event.date.substring(0, 4);
        if (!selectedYearKeys.includes(eventYear)) {
          continue;
        }
  
        updateLog(`Loading Results From Event: ${event.event_name}`);
  
        // First try to fetch from resultsJson
        const resultsJsonRef = firestoreDoc(db, 'events', eventDoc.id, 'resultsJson', 'fighters');
        const resultsJsonSnapshot = await getDoc(resultsJsonRef);
  
        if (resultsJsonSnapshot.exists()) {
          // Use resultsJson data with proper typing
          updateLog(`Using resultsJson for ${event.event_name}`);
          const resultsData = resultsJsonSnapshot.data() as ResultsJsonData;
          
          const fighters = resultsData.fighters.map(fighter => ({
            ...fighter,
            first: fighter.first.toUpperCase(),
            last: fighter.last.toUpperCase(),
            gym: fighter.gym.toUpperCase(),
            weightclass: Number(fighter.weightclass),
            bout: Number(fighter.bout),
            mat: Number(fighter.mat),
            docId: fighter.id,
            eventDocId: eventDoc.id,
            comp_city: event.city,
            comp_state: event.state,
            // Ensure all required fields from ResultsFighter type are present
            age: fighter.age || (fighter.dob ? calculateAge(fighter.dob) : 0),
            result: fighter.result || '',
            bout_type: fighter.bout_type || 'reg',
            boutmat: `bout${fighter.bout}mat${fighter.mat}`
          })) as ResultsFighter[];
  
          tempFighters.push(...fighters);
        } else {
          // Fall back to results2 collection
          updateLog(`Falling back to results2 collection for ${event.event_name}`);
          const fightersRef = collection(db, 'events', eventDoc.id, 'results2');
          const fightersSnapshot = await getDocs(fightersRef);
          fightersSnapshot.docs.forEach(fighterDoc => {
            const fighter = fighterDoc.data() as ResultsFighter;
            fighter.docId = fighterDoc.id;
            fighter.eventDocId = eventDoc.id;
            fighter.comp_city = event.city;
            fighter.comp_state = event.state;
            // Standardize data format
            fighter.first = fighter.first?.toUpperCase() || '';
            fighter.last = fighter.last?.toUpperCase() || '';
            fighter.gym = fighter.gym?.toUpperCase() || '';
            // Calculate age if needed
            if ((fighter.age === undefined || fighter.age <= 0) && fighter.dob) {
              fighter.age = calculateAge(fighter.dob);
            }
            tempFighters.push(fighter);
          });
        }
      }
  
      return tempFighters;
    } catch (error) {
      console.error('Error fetching events:', error);
      updateLog('Error fetching events. Check the console for more information.');
      return [];
    }
  };