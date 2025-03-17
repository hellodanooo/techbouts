// utils/pmt/calculateRecordsAll.ts
import {
    collection,
    getDocs,
    doc,
    getDoc,
    query,
    orderBy,
    limit,
    startAfter,
    DocumentSnapshot,
    Query,
    DocumentData
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase_pmt/config';
  

  export interface ProcessedEvent {
    eventId: string;
    eventName: string;
    date: string;
    processedAt: string;
  }
  
  export interface CalculationResult {
    fighterRecords: Map<string, FighterRecord>;
    processedEvents: ProcessedEvent[];
  }

  // Define interfaces that will be shared between files
  export interface FighterResult {
    id: string;
    first: string;
    last: string;
    gym: string;
    result: string;
    bout_type: string;
    weightclass: number;
    opponent_id?: string;
    event_id?: string;
    pmt_id: string;
    email: string;
    bodykick: number;
    boxing: number;
    clinch: number;
    defense: number;
    footwork: number;
    headkick: number;
    kicks: number;
    knees: number;
    legkick: number;
    ringawareness: number;
    age: number;
    gender: string;
    dob: string;
  }
  
  export interface FighterRecord {
    pmt_id: string;
    first: string;
    last: string;
    gender: string;
    gym: string;
    email: string;
    weightclasses: number[];
    wins: number;
    losses: number;
    nc: number;
    dq: number;
    tournament_wins: number;
    tournament_losses: number;
    bodykick: number;
    boxing: number;
    clinch: number;
    defense: number;
    footwork: number;
    headkick: number;
    kicks: number;
    knees: number;
    legkick: number;
    ringawareness: number;
    fights: Array<{
      eventId: string;
      eventName: string;
      date: string;
      result: string;
      weightclass: number;
      opponent_id?: string;
      bout_type: string;
      bodykick: number;
      boxing: number;
      clinch: number;
      defense: number;
      footwork: number;
      headkick: number;
      kicks: number;
      knees: number;
      legkick: number;
      ringawareness: number;
    }>;
    lastUpdated: string;
    searchKeywords: string[];
    age: number;
    dob: string;
  

  }
  
  /**
   * Computes search keywords for a fighter
   * @param fighter The fighter data
   * @returns Array of search keywords
   */
  export function computeKeywords(fighter: FighterResult): string[] {
    const keywords = new Set<string>();
  
    const addKeywords = (field: string | undefined) => {
      if (!field) return;
      
      const lower = field.toLowerCase();
      keywords.add(lower);
      // Split on spaces in case the field has multiple words
      lower.split(' ').forEach(word => {
        if (word) keywords.add(word);
      });
    };
  
    addKeywords(fighter.first);
    addKeywords(fighter.last);
    addKeywords(fighter.gym);
    if (fighter.gender) addKeywords(fighter.gender);
  
    return Array.from(keywords);
  }
  
  /**
   * Calculates records for all fighters across all years and returns them as a Map
   * This function doesn't save to the database, just aggregates the records
   * 
   * @param progressCallback - (Optional) callback to report progress messages
   * @returns A Map of fighter PMT IDs to their aggregated records
   */
  export async function calculateRecordsAll(
    progressCallback?: (message: string) => void
  ): Promise<CalculationResult> {
    const BATCH_SIZE = 500;
    const fighterRecords = new Map<string, FighterRecord>();
    let lastEventDoc: DocumentSnapshot | null = null;
    let totalEventsProcessed = 0;
    let totalEvents = 0;
    const processedEvents: ProcessedEvent[] = [];
    
    
    try {
      progressCallback?.("Starting calculation of all PMT records...");
      
      // First, count total events to provide accurate progress
      const countQuery = query(collection(db, 'events'));
      const countSnapshot = await getDocs(countQuery);
      totalEvents = countSnapshot.size;
      progressCallback?.(`Found ${totalEvents} total events to process.`);
      
      while (true) {
        // Query all events, ordered by date descending
        const eventsQuery: Query<DocumentData> = lastEventDoc
          ? query(
              collection(db, 'events'),
              orderBy('date', 'desc'),
              startAfter(lastEventDoc),
              limit(BATCH_SIZE)
            )
          : query(
              collection(db, 'events'),
              orderBy('date', 'desc'),
              limit(BATCH_SIZE)
            );
  
        const eventsSnapshot = await getDocs(eventsQuery);
        if (eventsSnapshot.empty) break;
        
        lastEventDoc = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];
        totalEventsProcessed += eventsSnapshot.size;
        const progressPercentage = Math.round((totalEventsProcessed / totalEvents) * 100);
        
        progressCallback?.(`Processing batch of ${eventsSnapshot.size} events... (${progressPercentage}%)`);
  
        for (const eventDoc of eventsSnapshot.docs) {
          const eventData = eventDoc.data();
          const resultsJsonRef = doc(db, 'events', eventDoc.id, 'resultsJson', 'fighters');
          const resultsJsonSnap = await getDoc(resultsJsonRef);
          
          if (!resultsJsonSnap.exists()) continue;
          
          // HERE ADD THE eventId TO THE processedEvents ARRAY  
          processedEvents.push({
            eventId: eventDoc.id,
            eventName: eventData.event_name || 'Unnamed Event',
            date: eventData.date || '',
            processedAt: new Date().toISOString()
          });



          const resultsData = resultsJsonSnap.data();
          const fighters = resultsData.fighters as FighterResult[];
  
          fighters.forEach((fighter) => {
            const fighterId = fighter.pmt_id;
            if (!fighterId) return; // Skip if no PMT ID
            
            if (!fighterRecords.has(fighterId)) {
              fighterRecords.set(fighterId, {
                pmt_id: fighter.pmt_id,
                first: fighter.first?.toUpperCase() || '',
                last: fighter.last?.toUpperCase() || '',
                gym: fighter.gym?.toUpperCase() || '',
                email: fighter.email || '',
                weightclasses: [fighter.weightclass],
                wins: 0,
                losses: 0,
                nc: 0,
                dq: 0,
                tournament_wins: 0,
                tournament_losses: 0,
                bodykick: 0,
                boxing: 0,
                clinch: 0,
                defense: 0,
                footwork: 0,
                headkick: 0,
                kicks: 0,
                knees: 0,
                legkick: 0,
                ringawareness: 0,
                fights: [],
                lastUpdated: new Date().toISOString(),
                searchKeywords: computeKeywords(fighter),
                age: fighter.age || 0,
                gender: fighter.gender || '',
                dob: fighter.dob || '',
              });
            }
  
            const record = fighterRecords.get(fighterId)!;
            
            // Update email if available
            if (fighter.email) {
              record.email = fighter.email;
            }
  
            // Process fight result
            if (fighter.result) {
              if (fighter.bout_type === 'tournament') {
                if (fighter.result === 'W') record.tournament_wins++;
                else if (fighter.result === 'L') record.tournament_losses++;
              } else {
                switch (fighter.result.toUpperCase()) {
                  case 'W':
                    record.wins++;
                    break;
                  case 'L':
                    record.losses++;
                    break;
                  case 'NC':
                    record.nc++;
                    break;
                  case 'DQ':
                    record.dq++;
                    break;
                }
              }
            }
  
            // Update skill ratings
            record.bodykick += fighter.bodykick || 0;
            record.boxing += fighter.boxing || 0;
            record.clinch += fighter.clinch || 0;
            record.defense += fighter.defense || 0;
            record.footwork += fighter.footwork || 0;
            record.headkick += fighter.headkick || 0;
            record.kicks += fighter.kicks || 0;
            record.knees += fighter.knees || 0;
            record.legkick += fighter.legkick || 0;
            record.ringawareness += fighter.ringawareness || 0;
  
            // Add fight to record
            record.fights.push({
              eventId: eventDoc.id,
              eventName: eventData.event_name || '',
              date: eventData.date || '',
              result: fighter.result || 'Unknown',
              weightclass: fighter.weightclass || 0,
              opponent_id: fighter.opponent_id || '',
              bout_type: fighter.bout_type || '',
              bodykick: fighter.bodykick || 0,
              boxing: fighter.boxing || 0,
              clinch: fighter.clinch || 0,
              defense: fighter.defense || 0,
              footwork: fighter.footwork || 0,
              headkick: fighter.headkick || 0,
              kicks: fighter.kicks || 0,
              knees: fighter.knees || 0,
              legkick: fighter.legkick || 0,
              ringawareness: fighter.ringawareness || 0,
            });
  
            // Add weightclass if not already included
            if (!record.weightclasses.includes(fighter.weightclass)) {
              record.weightclasses.push(fighter.weightclass);
              record.weightclasses.sort((a, b) => a - b);
            }
          });
        }
        
        progressCallback?.(`Processed batch of ${eventsSnapshot.size} events. Total fighters so far: ${fighterRecords.size} (${progressPercentage}%)`);
      }
  
      progressCallback?.(`Completed calculation. Total fighters with records: ${fighterRecords.size} (100%)`);
     
      return { fighterRecords: fighterRecords, processedEvents: processedEvents };

      
    } catch (error) {
      console.error('Error calculating all records:', error);
      throw error;
    }
  }