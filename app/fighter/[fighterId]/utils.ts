// app/fighter/[fighterId]/utils.ts
import { doc, getDoc } from 'firebase/firestore';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { PmtFighterRecord } from '@/utils/types';

export async function getFighterData(fighterId: string): Promise<PmtFighterRecord | null> {
  try {
    const years = ['2022', '2023', '2024', '2025'];
    let fighterData: PmtFighterRecord | null = null;
    
    let totalWins = 0;
    let totalLosses = 0;
    let totalTournamentWins = 0;
    let totalTournamentLosses = 0;
    const totalFights: PmtFighterRecord['fights'] = [];

    for (const year of years) {
      const recordsRef = doc(pmtDb, `records_pmt_${year}`, fighterId);
      const recordsSnap = await getDoc(recordsRef);

      if (recordsSnap.exists()) {
        const record = recordsSnap.data() as PmtFighterRecord;

        if (!fighterData) {
          fighterData = {
            pmt_id: record.pmt_id,
            first: record.first,
            last: record.last,
            gym: record.gym,
            wins: 0,
            losses: 0,
            tournament_wins: 0,
            tournament_losses: 0,
            fights: [],
          };
        }

        totalWins += record.wins || 0;
        totalLosses += record.losses || 0;
        totalTournamentWins += record.tournament_wins || 0;
        totalTournamentLosses += record.tournament_losses || 0;
        if (record.fights) {
          totalFights.push(...record.fights);
        }
      }
    }

    if (!fighterData) return null;

    return {
      ...fighterData,
      wins: totalWins,
      losses: totalLosses,
      tournament_wins: totalTournamentWins,
      tournament_losses: totalTournamentLosses,
      fights: totalFights,
    };
  } catch (error) {
    console.error('Error fetching PMT fighter data:', error);
    return null;
  }
}