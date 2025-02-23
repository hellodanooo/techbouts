// app/api/purist_events/[eventId]/roster/route.ts

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

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
  name?: string;  // Document path
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

  // Add document ID from name field if available
  if (firestoreData.name) {
    const parts = firestoreData.name.split('/');
    result.id = parts[parts.length - 1];
  }
  
  return result;
};

export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Fetching roster for event", eventId);



  try {
    // Use the correct URL format for listing collection documents
    const rosterUrl = `${baseUrl}/purist_events/${eventId}/roster?key=${apiKey}`;
    console.log("Fetching from URL:", rosterUrl);
    
    const response = await fetch(rosterUrl);
    console.log("Response status:", response.status);
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json({ error: "Roster not found" }, { status: 404 });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    console.log("Raw Firestore response:", data);

    // Check if we have documents in the response
    if (!data.documents) {
      console.log("No documents found in response");
      return NextResponse.json({ roster: [] });
    }

    // Transform each document in the collection
    const roster = data.documents.map((doc: FirestoreDocument) => {
      return convertFromFirestoreFormat(doc);
    }).filter(Boolean);

    console.log("Transformed roster:", roster);
    
    return NextResponse.json({ roster });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roster", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}