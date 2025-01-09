// app/api/promoters/route.ts
import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';
import { Promoter } from '../../../utils/types';

// Specify Node.js runtime
export const runtime = 'nodejs';

interface FirebaseCalendarDoc {
  promoters: Promoter[];
}

export async function GET(request: Request) {
  console.log("Promoters API Route: Starting fetch...");
  
  // Get the sanctioning body from query parameters
  const { searchParams } = new URL(request.url);
  const sanctioningBody = searchParams.get('sanctioning');

  // Initialize Firestore REST client
  const db = new Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID_TECHBOUTS,
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL_TECHBOUTS,
      private_key: process.env.FIREBASE_PRIVATE_KEY_TECHBOUTS?.replace(/\\n/g, '\n'),
    },
    preferRest: true,
  });

  console.log("Environment Variables:");
  console.log("Project ID:", process.env.FIREBASE_PROJECT_ID_TECHBOUTS);
  console.log("Client Email:", process.env.FIREBASE_CLIENT_EMAIL_TECHBOUTS);
  console.log("Private Key Length:", process.env.FIREBASE_PRIVATE_KEY_TECHBOUTS?.length);
  console.log("Private Key Preview:", process.env.FIREBASE_PRIVATE_KEY_TECHBOUTS?.slice(0, 100));

  let promoters: Promoter[] = [];

  try {
    const promoterRef = db.collection("promotions").doc("promotions_json");
    const snapshot = await promoterRef.get();
    console.log("Promoters API Route: Got Firestore snapshot");

    if (snapshot.exists) {
      const data = snapshot.data() as FirebaseCalendarDoc;

      if (data?.promoters) {
        // Filter promoters based on sanctioning body if specified
        promoters = data.promoters
          .filter(promoter => {
            if (!sanctioningBody) return true; // Return all promoters if no sanctioning body specified
            
            return Array.isArray(promoter.sanctioning)
              ? promoter.sanctioning.includes(sanctioningBody)
              : promoter.sanctioning === sanctioningBody;
          })
          .map((promoter: Promoter) => {
            const docId = promoter.promoterId;
            return {
              id: docId,
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
          });
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