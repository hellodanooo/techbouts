// app/api/pmt/events/route.ts
// THIS ONE IS WORKING
import { NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';
import { Event } from '../../../../utils/types';

// Specify Node.js runtime
export const runtime = 'nodejs';

interface FirebaseEventData {
  name?: string;
  city?: string;
  state?: string;
  date: string;
  address?: string;
  flyer?: string;
  registration_fee?: number;
  ticket_system_option?: "inHouse" | "thirdParty" | "none";
  promoterId?: string;
  status?: string;
  eventId: string;
  competition_type: 'FightCard' | 'Tournament';
}

interface FirebaseCalendarDoc {
  events: FirebaseEventData[];
}

export async function GET() {
  console.log("API Route: Starting fetch...");

  // Initialize Firestore REST client
  const db = new Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID_PMT,
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL_PMT,
      // Ensure newlines are preserved
      private_key: process.env.FIREBASE_PRIVATE_KEY_PMT?.replace(/\\n/g, '\n'),
    },
    preferRest: true, // Use REST API instead of gRPC
  });

console.log("PMT Environment Variables:");
console.log("PMT Project ID:", process.env.FIREBASE_PROJECT_ID_PMT);
console.log("PMT Client Email:", process.env.FIREBASE_CLIENT_EMAIL_PMT);
console.log("PMT Private Key Length:", process.env.FIREBASE_PRIVATE_KEY_PMT?.length);
console.log("PMT Private Key Preview:", process.env.FIREBASE_PRIVATE_KEY_PMT?.slice(0, 100));
  let events: Event[] = [];

  try {
    const eventCalendarRef = db.collection("event_calendar").doc("upcoming_events");
    const snapshot = await eventCalendarRef.get();
    console.log("API Route: Got Firestore snapshot");

    if (snapshot.exists) {
      const data = snapshot.data() as FirebaseCalendarDoc;

      if (data?.events) {
        events = data.events.map((event: FirebaseEventData) => {
          const docId = event.eventId
        
          return {
            id: docId,
            eventId: event.eventId,
            event_name: event.name ?? "Unnamed Event",
            name: event.name ?? "Unnamed Event",
            address: event.address ?? "No address provided",
            city: event.city ?? "Unknown City",
            state: event.state ?? "Unknown State",
            date: event.date,
            flyer: event.flyer && event.flyer !== "" ? event.flyer : "/default-flyer.png",
            registration_fee: event.registration_fee ?? 0,
            ticket_system_option: event.ticket_system_option ?? "none",
            promoterId: event.promoterId ?? "",
            status: event.status ?? "confirmed",
            docId,
            doors_open: "07:30",
        
            venue_name: "",
            weighin_date: event.date,
            weighin_start_time: "08:00",
            weighin_end_time: "09:00",
            rules_meeting_time: "09:15",
            bouts_start_time: "10:00",
            spectator_info: "",
            registration_enabled: false,
            tickets_enabled: false,
            ticket_enabled: false,
            ticket_price: 0,
            ticket_price_description: "General Admission",
            ticket_price2: 0,
            ticket_price2_description: "VIP",
            event_details: "",
            coach_price: 0,
            coach_enabled: false,
            photos_enabled: false,
            photos_price: 0,
            sanctioning: "",
            promotion: "",
            email: "",
            promoterEmail: "",
            competition_type: "Tournament",
          };
        });
        
      }
    } else {
      console.log("API Route: No snapshot exists");
    }

    console.log(`API Route: Sending ${events.length} events`);
    return NextResponse.json({ events });
  } catch (error) {
    const err = error as Error;
    console.error("API Route: Error fetching events from Firestore:", err.message);
    console.error(err.stack);

    return NextResponse.json(
      { error: "Failed to fetch events", details: err.message },
      { status: 500 }
    );
  }
}
