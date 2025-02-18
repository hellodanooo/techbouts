// app/api/promoters/route.ts
import { NextResponse } from 'next/server';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { Promoter } from '../../../utils/types';

export async function GET(request: Request) {
  console.log("Promoters API Route: Starting fetch...");
  
  const { searchParams } = new URL(request.url);
  const sanctioningBody = searchParams.get('sanctioning');

  try {
    // Get the promotions_json document from the promotions collection
    const docRef = doc(db, 'promotions', 'promotions_json');
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      console.log("Document not found!");
      return NextResponse.json({ promoters: [] });
    }

    const data = docSnap.data();
    console.log("Raw data from Firestore:", data);

    let promoters: Promoter[] = [];
    
    if (data?.promoters && Array.isArray(data.promoters)) {
      promoters = data.promoters
        .filter((promoter: Promoter) => {
          if (!sanctioningBody) return true;
          return Array.isArray(promoter.sanctioning)
            ? promoter.sanctioning.includes(sanctioningBody)
            : promoter.sanctioning === sanctioningBody;
        })
        .map((promoter: Promoter) => ({
          id: promoter.promoterId,
          city: promoter.city,
          email: promoter.email,
          firstName: promoter.firstName,
          lastName: promoter.lastName,
          name: promoter.promotionName,
          phone: promoter.phone,
          promoterId: promoter.promoterId,
          promotionName: promoter.promotionName,
          sanctioning: promoter.sanctioning,
          state: promoter.state,

        }));
    }

    console.log(`Promoters API Route: Found ${promoters.length} promoters`);
    console.log("Promoter emails:", promoters.map(p => p.email));
    
    return NextResponse.json({ promoters });
  } catch (error) {
    const err = error as Error;
    console.error("API Route: Error fetching promoters:", err.message);
    console.error(err.stack);

    return NextResponse.json(
      { error: "Failed to fetch promoters", details: err.message },
      { status: 500 }
    );
  }
}


