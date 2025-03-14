// app/api/ikf/events/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase_techbouts/config'; // Import Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import { EventType } from '@/utils/types';

export async function GET() {
  console.log("API Route: Starting fetch...");
  let events: EventType[] = [];

  try {
    const eventCalendarRef = doc(db, "events", "events_json");
    const snapshot = await getDoc(eventCalendarRef);
    console.log("API Route IKF Events: Got Firestore snapshot");

    if (snapshot.exists()) {
      const data = snapshot.data() as { events?: Partial<EventType>[] };

      if (data?.events) {
        events = data.events.map((event) => {
          const docId = event.docId ?? "";

          return {
            id: docId,
            eventId: event.eventId ?? "",
            event_name: event.event_name ?? "Unnamed Event",
            name: event.name ?? "Unnamed Event",
            address: event.address ?? "No address provided",
            city: event.city ?? "Unknown City",
            state: event.state ?? "Unknown State",
            date: event.date ?? "",
            flyer: event.flyer && event.flyer !== "" ? event.flyer : "/default-flyer.png",
            registration_fee: event.registration_fee ?? 0,
            ticket_system_option: event.ticket_system_option ?? "none",
            promoterId: event.promoterId ?? "",
            status: event.status ?? "confirmed",
            docId,
            doors_open: event.doors_open ?? "07:30",
            venue_name: event.venue_name ?? "",
            weighin_date: event.weighin_date ?? event.date ?? "",
            weighin_start_time: event.weighin_start_time ?? "08:00",
            weighin_end_time: event.weighin_end_time ?? "09:00",
            rules_meeting_time: event.rules_meeting_time ?? "09:15",
            bouts_start_time: event.bouts_start_time ?? "10:00",
            spectator_info: event.spectator_info ?? "",
            registration_enabled: event.registration_enabled ?? false,
            tickets_enabled: event.tickets_enabled ?? false,
            ticket_enabled: event.ticket_enabled ?? false,
            ticket_price: event.ticket_price ?? 0,
            ticket_price_description: event.ticket_price_description ?? "General Admission",
            ticket_price2: event.ticket_price2 ?? 0,
            ticket_price2_description: event.ticket_price2_description ?? "VIP",
            event_details: event.event_details ?? "",
            coach_price: event.coach_price ?? 0,
            coach_enabled: event.coach_enabled ?? false,
            photos_enabled: event.photos_enabled ?? false,
            photos_price: event.photos_price ?? 0,
            sanctioning: event.sanctioning ?? "",
            promotionName: event.promotionName ?? "",
            email: event.email ?? "",
            promoterEmail: event.promoterEmail ?? "",
            competition_type: event.competition_type ?? "FightCard",
            disableRegistration: event.disableRegistration ?? false,
            country: event.country ?? "",
            numMats: event.numMats ?? 1,
            locale: event.locale ?? "en",
            // Add missing fields
            photoPackagePrice: event.photoPackagePrice ?? 0,
            coachRegPrice: event.coachRegPrice ?? 0,
            photoPackageEnabled: event.photoPackageEnabled ?? false,
            ticket_link: event.ticket_link ?? "",
            street: event.street ?? "",
            zip: event.zip ?? "",
      
          };
        });
      }
    } else {
      console.log("API Route IKF Events: No snapshot exists");
    }

    console.log(`API Route: Sending ${events.length} events`);
    return NextResponse.json({ events });

  } catch (error) {
    const err = error as Error;
    console.error("API Route IKF Events: Error fetching events from Firestore:", err.message);
    console.error(err.stack);

    return NextResponse.json(
      { error: "Failed to fetch IKF events", details: err.message },
      { status: 500 }
    );
  }
}
