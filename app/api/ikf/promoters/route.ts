// app/api/ikf/promoters/route.ts
import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase_techbouts/config'; // Use the same Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import { Promoter } from '../../../../utils/types';

export async function GET() {
  console.log("IKF Promoters API Route: Starting fetch...");
  let promoters: Promoter[] = [];

  try {
    const jsonDocRef = doc(db, 'promotions', 'promotions_json');
    const jsonDocSnap = await getDoc(jsonDocRef);
    console.log("IKF Promoter API Route: Got Firestore snapshot");

    if (jsonDocSnap.exists()) {
      const jsonData = jsonDocSnap.data();
      
      if (jsonData?.promoters) {
        promoters = jsonData.promoters
          .filter((promoter: Promoter) => 
            Array.isArray(promoter.sanctioning) 
              ? promoter.sanctioning.includes('IKF')
              : promoter.sanctioning === 'IKF'
          )
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
            logo: promoter.logo,
          }));
      }
    } else {
      console.log("API Route: No snapshot exists");
    }

    console.log(`Promoters API Route: Sending ${promoters.length} Promoters`);
    return NextResponse.json({ promoters });
    
  } catch (error) {
    const err = error as Error;
    console.error("API Route: Error fetching promoters from Firestore:", err.message);
    console.error(err.stack);

    return NextResponse.json(
      { error: "Failed to fetch promoters", details: err.message },
      { status: 500 }
    );
  }
}