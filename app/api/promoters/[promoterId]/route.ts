import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase_techbouts/config';
import { collection, query, where, getDocs } from 'firebase/firestore'; // Updated imports
import { Promoter } from '@/utils/types';

export async function GET(
  request: Request,
  context: { params: Promise<{ promoterId: string }> }
) {
  const { promoterId } = await context.params;

  console.log(`Fetching promoter with ID: ${promoterId}`);

  try {
    // Create a query against the promoters collection
    const promotersRef = collection(db, 'promotions');
    const q = query(promotersRef, where('promoterId', '==', promoterId));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
      console.log("No matching promoter found");
      return NextResponse.json(
        { error: "Promoter not found" },
        { status: 404 }
      );
    }

    // Since promoterId should be unique, we'll take the first match
    const promoterDoc = querySnapshot.docs[0];
    const promoterData = promoterDoc.data() as Omit<Promoter, 'sanctioning'> & { sanctioning: string | string[] };

    // Ensure sanctioning is always an array
    const formattedPromoter = {
      id: promoterData.promoterId,
      city: promoterData.city,
      email: promoterData.email,
      firstName: promoterData.firstName,
      lastName: promoterData.lastName,
      name: promoterData.promotion,
      phone: promoterData.phone,
      promoterId: promoterData.promoterId,
      promotion: promoterData.promotion,
      sanctioning: Array.isArray(promoterData.sanctioning) 
        ? promoterData.sanctioning 
        : [promoterData.sanctioning], // Convert string to array if necessary
      state: promoterData.state,
    };

    return NextResponse.json({ promoter: formattedPromoter });

  } catch (error) {
    const err = error as Error;
    console.error("Error fetching promoter:", err.message);
    console.error(err.stack);

    return NextResponse.json(
      { error: "Failed to fetch promoter", details: err.message },
      { status: 500 }
    );
  }
}