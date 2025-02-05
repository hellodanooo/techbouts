// utils/pmt/calculateGymRecords.ts

import {
    collection,
    getDocs,
    doc,
    getDoc,
    writeBatch,
    query,
    orderBy,
    limit,
    startAfter,
    where,
    DocumentSnapshot,
    Query,
    DocumentData
  } from 'firebase/firestore';
  import { db } from '@/lib/firebase_pmt/config';
  

  interface FighterResult {
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
  }

  interface GymRecord {
    gym_id: string;
    gym_name: string;
    wins: number;
    losses: number;
    nc: number;
    dq: number;
    tournament_wins: number;
    tournament_losses: number;
    total_fighters: number;
    total_bodykick: number;
    total_boxing: number;
    total_clinch: number;
    total_defense: number;
    total_footwork: number;
    total_headkick: number;
    total_kicks: number;
    total_knees: number;
    total_legkick: number;
    total_ringawareness: number;
    fighters: Array<{
      pmt_id: string;
      first: string;
      last: string;
      email: string;
    }>;
    fights: Array<{
      eventId: string;
      eventName: string;
      date: string;
      fighter_id: string;
      fighter_name: string;
      result: string;
      weightclass: number;
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
  }
  
  function formatGymId(gymName: string): string | null {
    if (!gymName) return null;
    
    try {
      // Replace problematic characters and clean the gym name
      const sanitizedGym = gymName
        .trim()
        // Replace special characters with underscores
        .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_')
        // Replace spaces with underscores
        .replace(/\s+/g, '_')
        // Replace multiple consecutive underscores with a single one
        .replace(/_+/g, '_')
        // Remove any remaining non-alphanumeric characters except underscores
        .replace(/[^a-zA-Z0-9_]/g, '')
        .toUpperCase();
  
      // If the gym name is empty after sanitization or too long, skip it
      if (!sanitizedGym || sanitizedGym.length > 1500) {
        return null;
      }
  
      return sanitizedGym;
    } catch (error) {
      console.error('Error formatting gym name:', gymName, error);
      return null;
    }
  }
  
  export async function calculateAndStoreGymRecords(
    selectedYear: string,
    progressCallback?: (message: string) => void
  ) {
    const BATCH_SIZE = 500;
    const gymRecords = new Map<string, GymRecord>();
    let lastEventDoc: DocumentSnapshot | null = null;
    const skippedGyms = new Set<string>(); // Track unique skipped gyms

    try {
      while (true) {
        // Build query for events in selected year
        const eventsQuery: Query<DocumentData> = lastEventDoc
          ? query(
              collection(db, 'events'),
              where('date', '>=', `${selectedYear}-01-01`),
              where('date', '<=', `${selectedYear}-12-31`),
              orderBy('date', 'desc'),
              startAfter(lastEventDoc),
              limit(BATCH_SIZE)
            )
          : query(
              collection(db, 'events'),
              where('date', '>=', `${selectedYear}-01-01`),
              where('date', '<=', `${selectedYear}-12-31`),
              orderBy('date', 'desc'),
              limit(BATCH_SIZE)
            );
  
        const eventsSnapshot = await getDocs(eventsQuery);
        if (eventsSnapshot.empty) break;
        lastEventDoc = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];
  
        for (const eventDoc of eventsSnapshot.docs) {
          const eventData = eventDoc.data();
          progressCallback?.(`Processing event: ${eventData.event_name}`);
          
          const resultsJsonRef = doc(db, 'events', eventDoc.id, 'resultsJson', 'fighters');
          const resultsJsonSnap = await getDoc(resultsJsonRef);
          if (!resultsJsonSnap.exists()) continue;
          
          const resultsData = resultsJsonSnap.data();
          const fighters = resultsData.fighters as FighterResult[];
  
          fighters.forEach((fighter) => {
            if (!fighter.gym) return; // Skip if no gym
  
            const gymId = formatGymId(fighter.gym);
            if (!gymId) {
              // Log problematic gym name and skip processing
              skippedGyms.add(fighter.gym);
              return;
            }

            if (!gymRecords.has(gymId)) {
              gymRecords.set(gymId, {
                gym_id: gymId,
                gym_name: fighter.gym.toUpperCase(),
                wins: 0,
                losses: 0,
                nc: 0,
                dq: 0,
                tournament_wins: 0,
                tournament_losses: 0,
                total_fighters: 0,
                total_bodykick: 0,    // Changed from avg_bodykick
                total_boxing: 0,      // Changed from avg_boxing
                total_clinch: 0,      // Changed from avg_clinch
                total_defense: 0,     // Changed from avg_defense
                total_footwork: 0,    // Changed from avg_footwork
                total_headkick: 0,    // Changed from avg_headkick
                total_kicks: 0,       // Changed from avg_kicks
                total_knees: 0,       // Changed from avg_knees
                total_legkick: 0,     // Changed from avg_legkick
                total_ringawareness: 0,  // Changed from avg_ringawareness
                fighters: [],
                fights: [],
                lastUpdated: new Date().toISOString(),
              });
            }
  
            const record = gymRecords.get(gymId)!;
  
            // Add fighter to gym's fighter list if not already present
            if (!record.fighters.some(f => f.pmt_id === fighter.pmt_id)) {
              record.fighters.push({
                pmt_id: fighter.pmt_id,
                first: fighter.first.toUpperCase(),
                last: fighter.last.toUpperCase(),
                email: fighter.email || ''
              });
              record.total_fighters++;
            }
  
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
  
            // Add fight to gym's fight list
            record.fights.push({
              eventId: eventDoc.id,
              eventName: eventData.event_name,
              date: eventData.date,
              fighter_id: fighter.pmt_id,
              fighter_name: `${fighter.first} ${fighter.last}`.toUpperCase(),
              result: fighter.result || 'Unknown',
              weightclass: fighter.weightclass,
              bout_type: fighter.bout_type,
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
          });
        }
        progressCallback?.(`Processed batch of ${eventsSnapshot.size} events`);
      }
  

      if (skippedGyms.size > 0) {
        const skippedGymsList = Array.from(skippedGyms).join(', ');
        console.warn(`Skipped ${skippedGyms.size} problematic gym names: ${skippedGymsList}`);
        progressCallback?.(`⚠️ Warning: Skipped ${skippedGyms.size} gyms with invalid characters. Check console for details.`);
      }


      // Calculate averages for each gym
      for (const record of gymRecords.values()) {
        record.total_bodykick = record.fights.reduce((sum, fight) => sum + (fight.bodykick || 0), 0);
        record.total_boxing = record.fights.reduce((sum, fight) => sum + (fight.boxing || 0), 0);
        record.total_clinch = record.fights.reduce((sum, fight) => sum + (fight.clinch || 0), 0);
        record.total_defense = record.fights.reduce((sum, fight) => sum + (fight.defense || 0), 0);
        record.total_footwork = record.fights.reduce((sum, fight) => sum + (fight.footwork || 0), 0);
        record.total_headkick = record.fights.reduce((sum, fight) => sum + (fight.headkick || 0), 0);
        record.total_kicks = record.fights.reduce((sum, fight) => sum + (fight.kicks || 0), 0);
        record.total_knees = record.fights.reduce((sum, fight) => sum + (fight.knees || 0), 0);
        record.total_legkick = record.fights.reduce((sum, fight) => sum + (fight.legkick || 0), 0);
        record.total_ringawareness = record.fights.reduce((sum, fight) => sum + (fight.ringawareness || 0), 0);
      }
  
      // Write the aggregated gym records to Firebase
      let batch = writeBatch(db);
      let operationCount = 0;
      let totalRecords = 0;
  
      for (const [gymId, record] of gymRecords.entries()) {
        const recordRef = doc(db, `records_pmt_gyms_${selectedYear}`, gymId);
        batch.set(recordRef, record);
        operationCount++;
        totalRecords++;
  
        if (operationCount >= BATCH_SIZE) {
          progressCallback?.(`Committing batch of ${BATCH_SIZE} records...`);
          await batch.commit();
          batch = writeBatch(db);
          operationCount = 0;
        }
      }
  
      if (operationCount > 0) {
        progressCallback?.(`Committing final batch of ${operationCount} records...`);
        await batch.commit();
      }
  
      return {
        success: true,
        totalRecords,
        message: `Successfully processed ${totalRecords} gym records for ${selectedYear}`,
      };
    } catch (error) {
      console.error('Error calculating gym records:', error);
      throw error;
    }
  }