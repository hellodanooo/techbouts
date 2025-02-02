import { 
  collection,
  getDocs,
  query,
  writeBatch,
  doc,
  getDoc,
  setDoc
} from 'firebase/firestore';
import { db } from '@/lib/firebase_pmt/config';

interface FighterResult {
  first: string;
  last: string;
  gym: string;
  result: string;
  bout_type: string;
  id: string;
}

interface FighterRecord {
  pmt_id: string;
  first: string;
  last: string;
  gym: string;
  wins: number;
  losses: number;
  nc: number;
  dq: number;
  tournament_wins: number;
  tournament_losses: number;
  events: Array<{
    eventId: string;
    eventName: string;
    date: string;
    result: string;
    opponent?: string;
    bout_type: string;
  }>;
}

export async function calculateAllFighterRecords() {
  const fighterRecords = new Map<string, FighterRecord>();
  let processedCount = 0;
  
  try {
    // Get all events
    const eventsRef = collection(db, 'events');
    const eventsSnapshot = await getDocs(eventsRef);
    
    console.log(`Processing ${eventsSnapshot.size} events...`);

    // Process each event
    for (const eventDoc of eventsSnapshot.docs) {
      const eventData = eventDoc.data();
      const resultsJsonRef = doc(db, 'events', eventDoc.id, 'resultsJson', 'fighters');
      const resultsJsonSnap = await getDoc(resultsJsonRef);
      
      if (!resultsJsonSnap.exists()) continue;

      const resultsData = resultsJsonSnap.data();
      const fighters = resultsData.fighters as FighterResult[];
      
      // Process each fighter in the event
      fighters.forEach(fighter => {
        const fighterId = generateFighterId(fighter.first, fighter.last, fighter.gym);
        
        if (!fighterRecords.has(fighterId)) {
          fighterRecords.set(fighterId, {
            pmt_id: fighter.id,
            first: fighter.first.toUpperCase(),
            last: fighter.last.toUpperCase(),
            gym: fighter.gym.toUpperCase(),
            wins: 0,
            losses: 0,
            nc: 0,
            dq: 0,
            tournament_wins: 0,
            tournament_losses: 0,
            events: []
          });
        }

        const record = fighterRecords.get(fighterId)!;
        
        // Update record based on result
        if (fighter.result === 'W') {
          fighter.bout_type === 'tournament' ? record.tournament_wins++ : record.wins++;
        } else if (fighter.result === 'L') {
          fighter.bout_type === 'tournament' ? record.tournament_losses++ : record.losses++;
        } else if (fighter.result === 'NC') {
          record.nc++;
        } else if (fighter.result === 'DQ') {
          record.dq++;
        }

        // Add event to fighter's history
        record.events.push({
          eventId: eventDoc.id,
          eventName: eventData.event_name,
          date: eventData.date,
          result: fighter.result,
          bout_type: fighter.bout_type
        });
      });

      processedCount++;
      if (processedCount % 100 === 0) {
        console.log(`Processed ${processedCount} events...`);
      }
    }

    // Save records to Firestore
    await saveRecordsToFirestore(fighterRecords);
    
    console.log(`Successfully processed ${processedCount} events and ${fighterRecords.size} fighters`);
    return {
      processedEvents: processedCount,
      totalFighters: fighterRecords.size
    };

  } catch (error) {
    console.error('Error calculating fighter records:', error);
    throw error;
  }
}

function generateFighterId(first: string, last: string, gym: string): string {
  // Create a consistent ID by combining name and gym
  return `${first.toUpperCase()}_${last.toUpperCase()}_${gym.toUpperCase()}`.replace(/\s+/g, '_');
}

async function saveRecordsToFirestore(fighterRecords: Map<string, FighterRecord>) {
  const BATCH_SIZE = 500;
  let batch = writeBatch(db);
  let operationCount = 0;
  
  for (const [fighterId, record] of fighterRecords) {
    const recordRef = doc(db, 'records_pmt', fighterId);
    batch.set(recordRef, record);
    operationCount++;

    if (operationCount >= BATCH_SIZE) {
      await batch.commit();
      batch = writeBatch(db);
      operationCount = 0;
      console.log(`Committed batch of ${BATCH_SIZE} records`);
    }
  }

  // Commit any remaining operations
  if (operationCount > 0) {
    await batch.commit();
    console.log(`Committed final batch of ${operationCount} records`);
  }
}