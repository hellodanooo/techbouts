// app/api/gyms/route.ts
import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../utils/firebase';

export async function GET() {
  const DEFAULT_STATE = 'CA';
  const collectionName = `gym_profiles_${DEFAULT_STATE}_json_data`;
  
  try {
    // Fetch metadata
    const metadataDoc = await getDoc(doc(db, collectionName, 'metadata'));
    const metadata = metadataDoc.exists() ? metadataDoc.data() : null;

    // Fetch all win groups
    const winGroups = ['0_win', '1_5_win', '6_10_win', '11_20_win', '21_more_win'];
    const allGyms: Record<string, any> = {};

    for (const group of winGroups) {
      const docRef = doc(db, collectionName, group);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.gyms) {
          Object.assign(allGyms, data.gyms);
        }
      }
    }

    return NextResponse.json({
      gyms: allGyms,
      metadata,
      success: true
    });

  } catch (error) {
    console.error('Error fetching gyms:', error);
    return NextResponse.json(
      { error: 'Failed to fetch gym data', success: false },
      { status: 500 }
    );
  }
}