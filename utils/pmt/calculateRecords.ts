// utils/pmt/calculateRecords.ts

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
  CollectionReference,
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

export interface FighterRecord {
  pmt_id: string;
  first: string;
  last: string;
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
}

/**
 * Processes events for the given year and writes fighter records
 * to the collection "records_pmt_{year}".
 *
 * @param selectedYear - The year to process (e.g. "2023")
 * @param progressCallback - (Optional) callback to report progress messages
 */
export async function calculateAndStoreRecords(
  selectedYear: string,
  progressCallback?: (message: string) => void
) {
  const BATCH_SIZE = 500;
  const fighterRecords = new Map<string, FighterRecord>();
  let lastEventDoc: DocumentSnapshot | null = null;

  try {
    while (true) {
      // Build a query to retrieve only events within the selected year.
      // (Assumes event dates are stored in the format "YYYY-MM-DD")
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
          const fighterId = fighter.pmt_id;
          if (!fighterRecords.has(fighterId)) {
            fighterRecords.set(fighterId, {
              pmt_id: fighter.pmt_id,
              first: fighter.first.toUpperCase(),
              last: fighter.last.toUpperCase(),
              gym: fighter.gym.toUpperCase(),
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
            });
          }

          const record = fighterRecords.get(fighterId)!;
          if (fighter.email) {
            record.email = fighter.email;
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

          record.fights.push({
            eventId: eventDoc.id,
            eventName: eventData.event_name,
            date: eventData.date,
            result: fighter.result || 'Unknown',
            weightclass: fighter.weightclass,
            opponent_id: fighter.opponent_id,
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

          if (!record.weightclasses.includes(fighter.weightclass)) {
            record.weightclasses.push(fighter.weightclass);
            record.weightclasses.sort((a, b) => a - b);
          }
        });
      }
      progressCallback?.(`Processed batch of ${eventsSnapshot.size} events`);
    }

    // Write the aggregated fighter records in batches to the collection "records_pmt_{selectedYear}"
    let batch = writeBatch(db);
    let operationCount = 0;
    let totalRecords = 0;
    for (const [fighterId, record] of fighterRecords.entries()) {
      const recordToStore = {
        ...record,
        email: record.email || '',
        fights: record.fights.map((fight) => ({
          ...fight,
          bodykick: fight.bodykick || 0,
          boxing: fight.boxing || 0,
          clinch: fight.clinch || 0,
          defense: fight.defense || 0,
          footwork: fight.footwork || 0,
          headkick: fight.headkick || 0,
          kicks: fight.kicks || 0,
          knees: fight.knees || 0,
          legkick: fight.legkick || 0,
          ringawareness: fight.ringawareness || 0,
          result: fight.result || 'Unknown',
          opponent_id: fight.opponent_id || '',
        })),
      };

      const recordRef = doc(db, `records_pmt_${selectedYear}`, fighterId);
      batch.set(recordRef, recordToStore);
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
      message: `Successfully processed ${totalRecords} fighter records for ${selectedYear}`,
    };
  } catch (error) {
    console.error('Error calculating records:', error);
    throw error;
  }
}

