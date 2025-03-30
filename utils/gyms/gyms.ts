// utils/gyms/gyms.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { populateGymLogos } from "@/utils/gyms/logos";
import { GymRecord } from '@/utils/types';

type MetadataType = {
  [key: string]: unknown;
};

type GymGroupType = {
  gyms: Record<string, {
    id: string; 
    gym: string;
    location?: string;
    wins?: number;
    losses?: number;
    address?: {
      latitude?: number;
      longitude?: number;
    };
    [key: string]: unknown;
  }>;
};

const fetchGyms = async (): Promise<{
  gyms: Record<string, GymRecord>;
  metadata?: MetadataType | null;
  topGyms: GymRecord[]; // Updated type for topGyms
  success: boolean;
  error?: string;
}> => {
  const DEFAULT_STATE = "CA";
  const collectionName = `gym_profiles_${DEFAULT_STATE}_json_data`;

  try {
    const metadataDoc = await getDoc(doc(db, collectionName, "metadata"));
    const metadata: MetadataType | null = metadataDoc.exists()
      ? (metadataDoc.data() as MetadataType)
      : null;

    const winGroups = [
      "0_win",
      "1_5_win",
      "6_10_win",
      "11_20_win",
      "21_more_win",
    ];
    const allGyms: Record<string, GymRecord> = {};

    for (const group of winGroups) {
      const docRef = doc(db, collectionName, group);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as { gyms: Record<string, GymRecord> };
        if (data.gyms) {
          Object.assign(allGyms, data.gyms);
        }
      }
    }

    const gymsArray: GymRecord[] = Object.values(allGyms);

    // Populate logos for all gyms
    const allGymsWithLogos = await populateGymLogos(gymsArray);

    // Sort gyms by total wins (boys, girls, men, women)
    const topGyms = [...allGymsWithLogos]
      .sort((a, b) => {
        const totalWinsA = a.win + a.boysWin + a.girlsWin + a.menWin + a.womanWin;
        const totalWinsB = b.win + b.boysWin + b.girlsWin + b.menWin + b.womanWin;
        return totalWinsB - totalWinsA;
      })
      .slice(0, 10);

    console.log("Successfully fetched gyms and top gyms:", topGyms);

    return {
      gyms: allGymsWithLogos.reduce((acc, gym) => {
        acc[gym.id] = gym; // Use gym ID as the key instead of gym name
        return acc;
      }, {} as Record<string, GymRecord>),
      metadata,
      topGyms,
      success: true,
    };
  } catch (error) {
    console.error("Error fetching gym data:", error);
    return {
      gyms: {},
      topGyms: [],
      success: false,
      error: "Failed to fetch gym data",
    };
  }
};

export default fetchGyms;