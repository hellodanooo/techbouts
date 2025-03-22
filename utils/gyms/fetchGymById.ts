// utils/gyms/fetchGymById.ts
import { db, app } from '@/lib/firebase_techbouts/config';
import { GymRecord } from '@/utils/types';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';

// utils/gyms/fetchGymById.ts
import { doc, getDoc, collection, getDocs, query, where } from 'firebase/firestore';

export const fetchGymById = async (gymId: string): Promise<{
  gymProfile: GymRecord | null;
  logoUrl: string | null;
  success: boolean;
  error?: string;
}> => {
  if (!gymId) {
    return {
      gymProfile: null,
      logoUrl: null,
      success: false,
      error: 'No gym ID provided'
    };
  }

  try {
    // Directly query Gym_Profiles collection
    const gymDoc = await getDoc(doc(db, 'Gym_Profiles', gymId));

    if (!gymDoc.exists()) {
      return {
        gymProfile: null,
        logoUrl: null,
        success: false,
        error: 'Gym not found'
      };
    }

    const gymData = { id: gymDoc.id, ...gymDoc.data() } as GymRecord;

    // Fetch logo as before
    const storage = getStorage(app);
    const logoRef = ref(storage, `gym_logos/${gymId}.png`);
    let logoUrl: string | null = null;

    try {
      logoUrl = await getDownloadURL(logoRef);
    } catch (error) {
      logoUrl = '/default-gym-logo.png';
    }

    return {
      gymProfile: gymData,
      logoUrl,
      success: true
    };
  } catch (error) {
    console.error('Error fetching gym data:', error);
    return {
      gymProfile: null,
      logoUrl: null,
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch gym data'
    };
  }
};

