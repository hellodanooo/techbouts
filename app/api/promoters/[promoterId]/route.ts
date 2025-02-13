import { NextResponse } from 'next/server';
import { db } from '../../../../lib/firebase_techbouts/config'; // Change to use the same db instance
import { doc, getDoc } from 'firebase/firestore'; // Add these imports
import { Promoter } from '@/utils/types'; // Import the Promoter type

export async function GET(
  request: Request,
  context: { params: Promise<{ promoterId: string }> }
) {
  const { promoterId } = await context.params;

  console.log(`Fetching promoter with ID: ${promoterId}`);

  try {
    const jsonDocRef = doc(db, 'promotions', 'promotions_json'); // Changed to match working API
    const snapshot = await getDoc(jsonDocRef); // Changed to use getDoc

    if (!snapshot.exists()) { // Changed to use exists()
      console.log("Document does not exist");
      return NextResponse.json(
        { error: "Promoter document not found" },
        { status: 404 }
      );
    }

    const data = snapshot.data() as { promoters: Promoter[] }; // Explicitly type the data as containing an array of Promoters

    if (!data?.promoters) {
      return NextResponse.json(
        { error: "No promoters data found" },
        { status: 404 }
      );
    }

    const promoter = data.promoters.find((p) => p.promoterId === promoterId);

    if (!promoter) {
      return NextResponse.json(
        { error: "Promoter not found" },
        { status: 404 }
      );
    }

    // Format the response to match the structure used in the list API
    const formattedPromoter = {
      id: promoter.promoterId,
      city: promoter.city,
      email: promoter.email,
      firstName: promoter.firstName,
      lastName: promoter.lastName,
      name: promoter.promotion,
      phone: promoter.phone,
      promoterId: promoter.promoterId,
      promotion: promoter.promotion,
      sanctioning: promoter.sanctioning,
      state: promoter.state,
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
