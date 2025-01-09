import { NextResponse } from 'next/server';
import { collection, query, where, getDocs, getFirestore } from 'firebase/firestore';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const searchTerm = searchParams.get('search')?.toUpperCase();

  if (!searchTerm || searchTerm.length < 3) {
    return NextResponse.json({ gyms: [] });
  }

  const db = getFirestore();
  const gymCollections = ['gym_profiles_CA', 'gym_profiles_CO', 'gym_profiles_NV', 'gym_profiles_TX'];
  
  try {
    const queries = gymCollections.map(colName => {
      const colRef = collection(db, colName);
      const gymsQuery = query(
        colRef, 
        where('gym', '>=', searchTerm), 
        where('gym', '<=', searchTerm + '\uf8ff')
      );
      return getDocs(gymsQuery);
    });

    const querySnapshots = await Promise.all(queries);
    const gyms = querySnapshots.flatMap(snapshot => 
      snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
    );

    return NextResponse.json({ gyms });
  } catch (error) {
    console.error("Error fetching gyms:", error);
    return NextResponse.json({ error: 'Failed to fetch gyms' }, { status: 500 });
  }
}