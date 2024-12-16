import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

type MetadataType = {
  [key: string]: unknown;
};

type GymGroupType = {
  gyms: Record<string, {
    name: string;
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
  gyms: Record<string, GymGroupType['gyms'][string]>;
  metadata?: MetadataType | null;
  success: boolean;
  error?: string;
}> => {
  const DEFAULT_STATE = 'CA';
  const collectionName = `gym_profiles_${DEFAULT_STATE}_json_data`;

  try {
    const metadataDoc = await getDoc(doc(db, collectionName, 'metadata'));
    const metadata: MetadataType | null = metadataDoc.exists() ? (metadataDoc.data() as MetadataType) : null;

    const winGroups = ['0_win', '1_5_win', '6_10_win', '11_20_win', '21_more_win'];
    const allGyms: Record<string, GymGroupType['gyms'][string]> = {};

    for (const group of winGroups) {
      const docRef = doc(db, collectionName, group);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data() as GymGroupType;
        if (data.gyms) {
          Object.assign(allGyms, data.gyms);
        }
      }
    }

    console.log('Successfully fetched gyms:', allGyms); // Debugging log

    return {
      gyms: allGyms,
      metadata,
      success: true,
    };
  } catch (error) {
    console.error('Error fetching gym data:', error); // Improved error handling
    return {
      gyms: {},
      success: false,
      error: 'Failed to fetch gym data',
    };
  }
};

export default fetchGyms;
