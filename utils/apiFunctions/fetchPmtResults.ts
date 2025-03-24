// utils/apiFunctions/fetchPmtResults.ts

import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { doc, getDoc } from 'firebase/firestore';

export interface Fighter {
    pmt_id?: string;
    result?: string;
    [key: string]: any;
  }

export const fetchPmtResults = async (eventId: string) => {
    let fighters: Fighter[] = [];
    let completed: Fighter[] = [];
    let uniqueFighterCount = 0;

  try {
    const resultsRef = doc(pmtDb, 'events', eventId, 'resultsJson', 'fighters');
    const resultsSnap = await getDoc(resultsRef);

    if (resultsSnap.exists()) {
      const resultsData = resultsSnap.data();

      fighters = resultsData.fighters.map((fighter: any) => ({
        ...fighter,
        first: fighter.first?.toUpperCase() || '',
        last: fighter.last?.toUpperCase() || '',
        gym: fighter.gym?.toUpperCase() || '',
        weightclass: Number(fighter.weightclass) || 0,
        bout: Number(fighter.bout) || 0,
        mat: Number(fighter.mat) || 0,
        result: fighter.result || '',
        bout_type: fighter.bout_type || 'reg',
        gender: fighter.gender || '',
        age: fighter.age || '',
        fighternum: fighter.fighternum || '',
        boutmat: `bout${fighter.bout}mat${fighter.mat}`,
      }));

      fighters.sort((a, b) => (a.mat === b.mat ? a.bout - b.bout : a.mat - b.mat));

      completed = fighters.filter((f) => f.result && f.result.trim() !== 'credit');

      const validResults = new Set(['W', 'L', 'NC', 'DQ', 'X']);

      const uniquePmtIds = new Set(
        fighters
          .filter((f) => {
            const result = f.result?.toUpperCase();
            return result && validResults.has(result) && f.pmt_id;
          })
          .map((f) => f.pmt_id)
      );

      uniqueFighterCount = uniquePmtIds.size;
    }
  } catch (err) {
    console.error('Error fetching results:', err);
  }

  return {
    fighters,
    completed,
    uniqueFighterCount
  };
};



