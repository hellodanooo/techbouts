// utils/pmt/calcRecordOneEvent.ts


// THE EVENTS ARE NOT BEING SAVED IN FIREBASE




import { CalculationResult, FighterResult, FighterRecord, ProcessedEvent, computeKeywords } from '@/utils/pmt/calculateRecordsAll';

import {

    doc,
    getDoc,
 
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase_pmt/config';
  


export async function calcRecordOneEvent(eventId: string): Promise<CalculationResult | null> {
    try {
      console.log(`Processing single event: ${eventId}`);
  
      // Fetch event data
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) {
        console.error(`Event ${eventId} not found`);
        return null;
      }
  
      const eventData = eventSnap.data();
  
      // Fetch fighters' results
      const resultsJsonRef = doc(db, 'events', eventId, 'resultsJson', 'fighters');
      const resultsJsonSnap = await getDoc(resultsJsonRef);
      if (!resultsJsonSnap.exists()) {
        console.warn(`No results found for event ${eventId}`);
        return null;
      }
  
      const resultsData = resultsJsonSnap.data();
      const fighters = resultsData.fighters as FighterResult[];
  
      const fighterRecords = new Map<string, FighterRecord>();
      const uniqueFighterIds = new Set<string>();
  
      fighters.forEach((fighter) => {
        const fighterId = fighter.pmt_id;
        if (!fighterId) return;
  
        uniqueFighterIds.add(fighterId);
  
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
          eventId: eventId,
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
  
      // Store processed event metadata
      const processedEvent: ProcessedEvent = {
        eventId: eventId,
        eventName: eventData.event_name || 'Unnamed Event',
        date: eventData.date || '',
        processedAt: new Date().toISOString(),
        uniqueFighterCount: uniqueFighterIds.size,
      };
  
      return { fighterRecords, processedEvents: [processedEvent] };
    } catch (error) {
      console.error(`Error processing event ${eventId}:`, error);
      return null;
    }
  }
  