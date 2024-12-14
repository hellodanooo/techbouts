// app/api/gyms/route.ts
import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

// Define types for metadata and gym groups
type MetadataType = {
  [key: string]: unknown; // Adjust the structure based on your Firestore document shape
};

type GymGroupType = {
  gyms: Record<string, {
    name: string;
    location: string;
    wins: number;
    [key: string]: unknown; // Extend based on your gym object structure
  }>;
};

export async function GET() {
  const DEFAULT_STATE = 'CA';
  const collectionName = `gym_profiles_${DEFAULT_STATE}_json_data`;

  try {
    // Fetch metadata
    const metadataDoc = await getDoc(doc(db, collectionName, 'metadata'));
    const metadata: MetadataType | null = metadataDoc.exists() ? metadataDoc.data() as MetadataType : null;

    // Define win groups and initialize the gyms record
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

    console.log('Fetched all gyms:', allGyms); // Debugging log for gyms

    return NextResponse.json({
      gyms: allGyms,
      metadata,
      success: true,
    });

  } catch (error) {
    console.error('Error fetching gyms:', error); // Improved error logging
    return NextResponse.json(
      { error: 'Failed to fetch gym data', success: false },
      { status: 500 }
    );
  }
}
