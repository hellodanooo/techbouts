// app/api/pmt/events/[eventId]/route.ts
// this api works

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;

// Base URLs for Firestore REST API
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const eventsCollection = `${baseUrl}/events`;
const calendarDoc = `${baseUrl}/event_calendar/upcoming_events`;

// Type definitions for Firestore data structures
interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: number;
  booleanValue?: boolean;
  timestampValue?: string;
  arrayValue?: {
    values?: FirestoreValue[];
  };
  mapValue?: {
    fields: Record<string, FirestoreValue>;
  };
}

interface FirestoreDocument {
  fields?: Record<string, FirestoreValue>;
}

interface CalendarEvent {
  eventId: string;
  title: string;
  date: string;
  location: string;
  description: string;
  [key: string]: string | number | boolean | string[]; // For other potential fields
}

// Helper function to convert Firestore REST response to regular JSON
const convertFromFirestoreFormat = (firestoreData: FirestoreDocument): Record<string, unknown> | null => {
  const result: Record<string, unknown> = {};
  
  if (!firestoreData.fields) return null;
  
  Object.entries(firestoreData.fields).forEach(([key, value]: [string, FirestoreValue]) => {
    if (value.stringValue !== undefined) result[key] = value.stringValue;
    else if (value.integerValue !== undefined) result[key] = parseInt(value.integerValue);
    else if (value.doubleValue !== undefined) result[key] = value.doubleValue;
    else if (value.booleanValue !== undefined) result[key] = value.booleanValue;
    else if (value.timestampValue !== undefined) result[key] = value.timestampValue;
    else if (value.mapValue !== undefined) {
      // Handle nested objects
      result[key] = convertFromFirestoreFormat({ fields: value.mapValue.fields });
    }
    else if (value.arrayValue !== undefined && value.arrayValue.values) {
      result[key] = value.arrayValue.values.map((v) => {
        if (v.mapValue) {
          return convertFromFirestoreFormat({ fields: v.mapValue.fields });
        }
        if (v.stringValue !== undefined) return v.stringValue;
        if (v.integerValue !== undefined) return parseInt(v.integerValue);
        if (v.doubleValue !== undefined) return v.doubleValue;
        if (v.booleanValue !== undefined) return v.booleanValue;
        return null;
      }).filter(Boolean);
    }
  });
  
  return result;
};

// Helper function to convert regular JSON to Firestore format
const convertToFirestoreFormat = (data: Record<string, unknown>): FirestoreDocument => {
  const fields: Record<string, FirestoreValue> = {};
  
  Object.entries(data).forEach(([key, value]) => {
    if (typeof value === 'string') {
      fields[key] = { stringValue: value };
    } else if (typeof value === 'number') {
      fields[key] = Number.isInteger(value) 
        ? { integerValue: value.toString() }
        : { doubleValue: value };
    } else if (typeof value === 'boolean') {
      fields[key] = { booleanValue: value };
    } else if (Array.isArray(value)) {
      fields[key] = {
        arrayValue: {
          values: value.map(item => {
            if (typeof item === 'string') return { stringValue: item };
            if (typeof item === 'number') return { integerValue: item.toString() };
            return { stringValue: String(item) };
          })
        }
      };
    }
  });
  
  return { fields };
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Fetching event", eventId);

  try {
    const response = await fetch(`${eventsCollection}/${eventId}?key=${apiKey}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Event not found" }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const firestoreData = await response.json() as FirestoreDocument;
    const eventData = convertFromFirestoreFormat(firestoreData);
    
    return NextResponse.json({ event: eventData });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch event" },
      { status: 500 }
    );
  }
}







export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Updating event", eventId);

  try {
    const updatedData = await request.json() as Record<string, unknown>;
    console.log("Received update data:", updatedData);
    const firestoreFormat = convertToFirestoreFormat(updatedData);
    console.log("Converted to Firestore format:", firestoreFormat);

    // Update the event document
    const eventUpdateResponse = await fetch(
      `${eventsCollection}/${eventId}?updateMask.fieldPaths=${Object.keys(updatedData).join('&updateMask.fieldPaths=')}&key=${apiKey}`,
      {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(firestoreFormat)
      }
    );

    if (!eventUpdateResponse.ok) {
      console.error("Failed to update event document:", await eventUpdateResponse.text());
      throw new Error(`Failed to update event: ${eventUpdateResponse.status}`);
    }

    // Get the calendar document
    console.log("Fetching calendar document");
    const calendarResponse = await fetch(`${calendarDoc}?key=${apiKey}`);
    if (!calendarResponse.ok) {
      console.error("Failed to fetch calendar:", await calendarResponse.text());
      throw new Error(`Failed to fetch calendar: ${calendarResponse.status}`);
    }

    const calendarData = await calendarResponse.json() as FirestoreDocument;
    console.log("Raw calendar data fields:", JSON.stringify(calendarData.fields, null, 2));

    console.log("Calendar data:", calendarData);

    const events = (convertFromFirestoreFormat(calendarData)?.events as CalendarEvent[]) || [];
    console.log("Converted events:", JSON.stringify(events, null, 2));
    
    // Find and update the event in the calendar
    const eventIndex = events.findIndex((event) => event.eventId === eventId);
    console.log("Found event at index:", eventIndex);
    
    if (eventIndex !== -1) {
      events[eventIndex] = { ...events[eventIndex], ...updatedData as CalendarEvent };
      console.log("Updated event in array:", events[eventIndex]);
      
      const calendarUpdatePayload = {
        fields: {
          events: {
            arrayValue: {
              values: events.map((event) => ({
                mapValue: { fields: convertToFirestoreFormat(event as Record<string, unknown>).fields }
              }))
            }
          }
        }
      };
      console.log("Calendar update payload:", calendarUpdatePayload);

      // Update the calendar document
      const calendarUpdateResponse = await fetch(
        `${calendarDoc}?updateMask.fieldPaths=events&key=${apiKey}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(calendarUpdatePayload)
        }
      );

      if (!calendarUpdateResponse.ok) {
        console.error("Failed to update calendar:", await calendarUpdateResponse.text());
        throw new Error(`Failed to update calendar: ${calendarUpdateResponse.status}`);
      }
      console.log("Calendar update successful");
    } else {
      console.log("Event not found in calendar document");
    }

    // Fetch and return the updated event data
    const updatedEventResponse = await fetch(`${eventsCollection}/${eventId}?key=${apiKey}`);
    const updatedEventData = await updatedEventResponse.json() as FirestoreDocument;
    
    return NextResponse.json({
      message: "Event updated successfully",
      event: convertFromFirestoreFormat(updatedEventData)
    });

  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to update event", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}