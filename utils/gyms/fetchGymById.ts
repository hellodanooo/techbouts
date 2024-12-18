// utils/gyms/fetchGymById.ts
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { GymProfile } from '@/utils/types';
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { app } from '@/utils/firebase';

const DEFAULT_STATE = "CA";

export const fetchGymById = async (gymId: string): Promise<{
  gymProfile: GymProfile | null;
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
    const winGroups = ["0_win", "1_5_win", "6_10_win", "11_20_win", "21_more_win"];
    const collectionName = `gym_profiles_${DEFAULT_STATE}_json_data`;
    
    // Query each group until we find the gym
    let gymData: GymProfile | null = null;
    let foundGroup: string | null = null;
    
    // Use Promise.all to fetch all groups in parallel
    const groupSnapshots = await Promise.all(
      winGroups.map(group => getDoc(doc(db, collectionName, group)))
    );

    // Find the gym by searching through each group's gyms array
    for (let i = 0; i < groupSnapshots.length; i++) {
      const docSnap = groupSnapshots[i];
      if (docSnap.exists()) {
        const data = docSnap.data() as { gyms: Record<string, GymProfile> };
        if (data.gyms) {
          // Search through all gyms in this group
          const foundGym = Object.values(data.gyms).find(gym => gym.id === gymId);
          if (foundGym) {
            gymData = foundGym;
            foundGroup = winGroups[i];
            break;
          }
        }
      }
    }

    if (!gymData) {
      console.log(`Gym not found in any group: ${gymId}`);
      return { 
        gymProfile: null, 
        logoUrl: null, 
        success: false, 
        error: 'Gym not found' 
      };
    }

    // Fetch logo in parallel with gym data
    const storage = getStorage(app);
    const logoRef = ref(storage, `gym_logos/${gymId}.png`);
    let logoUrl: string | null = null;

    try {
      logoUrl = await getDownloadURL(logoRef);
    } catch (error) {
      console.log('Using default logo for gym:', gymId);
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