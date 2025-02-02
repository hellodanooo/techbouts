import { NextResponse } from 'next/server';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db as pmtDb } from '@/lib/firebase_pmt/config';

export async function GET(request: Request) {
  // Parse query parameters from the request URL.
  const { searchParams } = new URL(request.url);
  const sanctioning = searchParams.get('sanctioning');
  const year = searchParams.get('year');
  const terms = searchParams.get('terms');

  console.log('Search query parameters:', { sanctioning, year, terms });

  if (sanctioning !== 'pmt' || !year || !terms) {
    console.error('Missing or invalid parameters:', { sanctioning, year, terms });
    return NextResponse.json(
      { error: 'Missing or invalid parameters' },
      { status: 400 }
    );
  }

  try {
    const fightersRef = collection(pmtDb, `records_pmt_${year}`);
    // Split the terms by comma, trim, and convert to uppercase.
    const termArray = terms
      .split(',')
      .map((t) => t.trim().toUpperCase())
      .filter(Boolean);

    console.log('Term array:', termArray);

    // Query for documents where the keywords array contains any of the provided terms.
    const q = query(
      fightersRef,
      where('keywords', 'array-contains-any', termArray),
      limit(100)
    );
    const snapshot = await getDocs(q);
    console.log('Number of documents fetched:', snapshot.size);

    const fighters = snapshot.docs.map((doc) => ({
      fighter_id: doc.id,
      ...doc.data(),
    }));

    console.log('Fighters returned:', fighters);

    return NextResponse.json({ fighters });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error searching fighters:', error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }
    console.error('Unknown error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
