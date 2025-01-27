// app/api/pmt/events/[eventId]/route.ts
// THIS ONE IS NOT WORKING TO FETCH ONE EVENTS DETAILS
import { NextRequest, NextResponse } from 'next/server';
import { Firestore } from '@google-cloud/firestore';
import { Event } from '@/utils/types';

export const runtime = 'nodejs';

interface EventCalendarData {
    events: Array<{
      eventId: string;
      flyer: string;
      [key: string]: unknown;
    }>;
  }

////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  console.log("API Route: Starting fetch for eventId:", eventId);

  const db = new Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID_PMT,
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL_PMT,
      private_key: process.env.FIREBASE_PRIVATE_KEY_PMT?.replace(/\\n/g, '\n'),
    },
    preferRest: true,
  });

  try {
    // First, get the document from the events collection
    const eventRef = db.collection("events").doc(eventId);
    const snapshot = await eventRef.get();
    console.log("API Route: Got Firestore snapshot");

    if (!snapshot.exists) {
      console.log("API Route: Event not found");
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    const rawEventData = snapshot.data();
    if (!rawEventData) {
      throw new Error("Event data is empty");
    }

    // Format the event data with proper defaults
    const formattedEventData: Event = {
      id: eventId,
      eventId: eventId,
      docId: eventId,
      event_name: rawEventData.event_name || rawEventData.name || "Unnamed Event",
      name: rawEventData.event_name || rawEventData.name || "Unnamed Event",
      address: rawEventData.address || "",
      city: rawEventData.city || "",
      state: rawEventData.state || "",
      date: rawEventData.date || "",
      flyer: rawEventData.flyer || "/default-flyer.png",
      sanctioning: rawEventData.sanctioning || "pmt",
      competition_type: rawEventData.competition_type || "Tournament",
      
      // Location details
      venue_name: rawEventData.venue_name || "",
      street: rawEventData.street || "",
      postal_code: rawEventData.postal_code || "",
      country: rawEventData.country || "",
      colonia: rawEventData.colonia || "",
      municipality: rawEventData.municipality || "",
      zip: rawEventData.zip || "",
      
      // Time details
      doors_open: rawEventData.doors_open || "07:30",
      weighin_date: rawEventData.weighin_date || rawEventData.date,
      weighin_start_time: rawEventData.weighin_start_time || rawEventData.weighin_time || "08:00",
      weighin_end_time: rawEventData.weighin_end_time || "09:00",
      rules_meeting_time: rawEventData.rules_meeting_time || "09:15",
      bouts_start_time: rawEventData.bouts_start_time || "10:00",
      
      // Event details
      event_details: rawEventData.event_details || "",
      spectator_info: rawEventData.spectator_info || "",
      numMats: rawEventData.numMats || 1,
      
      // Registration
      registration_enabled: !rawEventData.disableRegistration,
      registration_fee: rawEventData.registration_fee || 0,
      registration_link: rawEventData.registration_link || "",
      
      // Tickets
      tickets_enabled: rawEventData.ticket_enabled || false,
      ticket_enabled: rawEventData.ticket_enabled || false,
      ticket_system_option: rawEventData.ticket_system_option || "none",
      ticket_link: rawEventData.ticket_link || "",
      ticket_price: rawEventData.ticket_price || 0,
      ticket_price_description: rawEventData.ticket_price_description || "General Admission",
      ticket_price2: rawEventData.ticket_price2 || 0,
      ticket_price2_description: rawEventData.ticket_price2_description || "VIP",
      
      // Additional services
      coach_enabled: rawEventData.coachRegEnabled || false,
      coach_price: rawEventData.coachRegPrice || 0,
      photos_enabled: rawEventData.photoPackageEnabled || false,
      photos_price: rawEventData.photoPackagePrice || 0,
      
      // Promoter info
      promotion: rawEventData.promotion || "",
      email: rawEventData.promoterEmail || "",
      promoterId: rawEventData.promoterId || "",
      promoterEmail: rawEventData.promoterEmail || "",
      
      // Status
      status: rawEventData.status || "confirmed",
    };

    console.log("API Route: Sending event data");
    return NextResponse.json({ event: formattedEventData });
  } catch (error) {
    const err = error as Error;
    console.error("API Route: Error fetching event from Firestore:", err.message);
    console.error(err.stack);

    return NextResponse.json(
      { error: "Failed to fetch event", details: err.message },
      { status: 500 }
    );
  }
}


////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////


async function patchEventCollection(
  db: Firestore,
  eventId: string,
  updateData: Partial<Event>,
  batch: FirebaseFirestore.WriteBatch
) {
  console.log("Starting patchEventCollection for eventId:", eventId);

  const eventRef = db.collection("events").doc(eventId);

  // Validate that the event exists
  const snapshot = await eventRef.get();
  if (!snapshot.exists) {
    throw new Error("Event not found");
  }

  // Update main events collection
  batch.update(eventRef, {
    ...updateData,
    updatedAt: new Date().toISOString()
  });

  return snapshot;
}

async function patchEventJson(
  db: Firestore,
  eventId: string,
  updateData: Partial<Event>,
  batch: FirebaseFirestore.WriteBatch
) {
  console.log("Starting patchEventJson for eventId:", eventId);

  // Check if there's a flyer update; exit early if not
  if (!updateData.flyer) {
    console.log("No flyer update detected; skipping patchEventJson");
    return;
  }

  console.log("Flyer update detected:", updateData.flyer);

  // Reference the event_calendar document
  const eventCalendarRef = db.collection("event_calendar").doc("upcoming_events");
  const eventCalendarSnapshot = await eventCalendarRef.get();

  // Ensure the document exists
  if (!eventCalendarSnapshot.exists) {
    console.log("Event calendar document does not exist; skipping update");
    return;
  }

  console.log("Event calendar document exists");

  const eventCalendarData = eventCalendarSnapshot.data() as EventCalendarData;
  const events = eventCalendarData?.events || [];

  // Find the event to update
  const eventIndex = events.findIndex((e) => e.eventId === eventId);

  if (eventIndex === -1) {
    console.log("Event not found in events array; skipping update");
    return;
  }

  console.log("Found event in events array; updating flyer");

  // Update the specific event
  events[eventIndex] = {
    ...events[eventIndex],
    flyer: updateData.flyer,
  };

  console.log("Updated event data:", events[eventIndex]);

  // Update the event_calendar document
  batch.update(eventCalendarRef, {
    events,
  });
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await context.params;
  console.log("API Route: Starting update for eventId:", eventId);

  const db = new Firestore({
    projectId: process.env.FIREBASE_PROJECT_ID_PMT,
    credentials: {
      client_email: process.env.FIREBASE_CLIENT_EMAIL_PMT,
      private_key: process.env.FIREBASE_PRIVATE_KEY_PMT?.replace(/\\n/g, '\n'),
    },
    preferRest: true,
  });

  try {
    const updateData = await request.json();
    console.log("Update data received:", updateData);

    // Start a batch write
    const batch = db.batch();

    // Update main events collection
    const eventSnapshot = await patchEventCollection(db, eventId, updateData, batch);

    // Update JSON documents
    await patchEventJson(db, eventId, updateData, batch);

    // Commit all updates
    console.log("Committing batch updates");
    await batch.commit();
    console.log("Batch updates committed successfully");

    // Return updated event data
    const eventData = eventSnapshot.data() as Event;
    console.log("API Route: Successfully updated event across all collections");

    return NextResponse.json({
      message: "Event updated successfully",
      eventData,
    });
  } catch (error) {
    const err = error as Error;
    console.error("API Route: Error updating event in Firestore:", err.message);
    console.error(err.stack);

    return NextResponse.json(
      { error: "Failed to update event", details: err.message },
      { status: 500 }
    );
  }
}
