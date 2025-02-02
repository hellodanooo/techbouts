// RosterContainer.tsx
import { getFirestore, doc, collection, getDocs } from 'firebase/firestore';
import { app } from '@/lib/firebase_pmt/config';
import { PmtFighterRecord } from '@/utils/types';
import Roster from './Roster';

interface RosterContainerProps {
  eventId: string;
}

type PmtRosterEntry = PmtFighterRecord & {
  id: string;
  years_exp?: number;
  division?: string;
};

async function getRosterData(eventId: string): Promise<PmtRosterEntry[]> {
  const db = getFirestore(app);
  const eventRef = doc(db, 'events', eventId);
  const rosterRef = collection(eventRef, 'roster');
  
  try {
    const querySnapshot = await getDocs(rosterRef);
    if (!querySnapshot.empty) {
      const rosterData = querySnapshot.docs.map(docSnapshot => ({
        id: docSnapshot.id,
        ...docSnapshot.data(),
      })) as PmtRosterEntry[];
      return rosterData;
    }
    return [];
  } catch (error) {
    console.error("Error fetching roster:", error);
    return [];
  }
}

export default async function RosterContainer({ eventId }: RosterContainerProps) {
  const rosterData = await getRosterData(eventId);
  
  return <Roster rosterData={rosterData} />;
}