// app/api/pmt/events/[eventId]/roster/route.ts

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;

// Base URL for Firestore REST API
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;
const eventsCollection = `${baseUrl}/events`;

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
  name?: string;
  fields?: Record<string, FirestoreValue>;
}

interface FirestoreResponse {
  documents?: FirestoreDocument[];
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
  
  // Extract document ID from name if available
  if (firestoreData.name) {
    const nameParts = firestoreData.name.split('/');
    result.id = nameParts[nameParts.length - 1];
  }
  
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
            if (typeof item === 'number') {
              return Number.isInteger(item) 
                ? { integerValue: item.toString() } 
                : { doubleValue: item };
            }
            if (typeof item === 'object' && item !== null) {
              const nestedFields = convertToFirestoreFormat(item as Record<string, unknown>).fields;
              return { 
                mapValue: { 
                  fields: nestedFields || {} 
                }
              };
            }
            return { stringValue: String(item) };
          })
        }
      };
    } else if (value && typeof value === 'object') {
      const nestedFields = convertToFirestoreFormat(value as Record<string, unknown>).fields;
      fields[key] = {
        mapValue: {
          fields: nestedFields || {}
        }
      };
    }
  });
  
  return { fields };
};

// API handler for listing all fighters in a roster
export async function GET(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Fetching roster for event", eventId);

  try {
    // Build the URL for the roster subcollection
    const rosterUrl = `${eventsCollection}/${eventId}/roster`;
    
    // Fetch all documents in the roster subcollection
    const response = await fetch(`${rosterUrl}?key=${apiKey}`);
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty roster instead of error for 404
        console.log("Roster collection not found, returning empty roster");
        return NextResponse.json({ roster: [] });
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const firestoreData = await response.json() as FirestoreResponse;
    
    // If there are no documents in the collection
    if (!firestoreData.documents || firestoreData.documents.length === 0) {
      console.log("No fighters found in roster");
      return NextResponse.json({ roster: [] });
    }
    
    // Convert all documents to regular JSON
    const rosterData = firestoreData.documents.map(doc => 
      convertFromFirestoreFormat(doc)
    ).filter(Boolean);
    
    console.log(`Successfully fetched ${rosterData.length} fighters from roster`);
    return NextResponse.json({ roster: rosterData });
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch roster", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// API handler for adding a fighter to the roster
export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Adding fighter to roster for event", eventId);

  try {
    const fighterData = await request.json() as Record<string, unknown>;
    
    if (!fighterData.pmt_id || !fighterData.first || !fighterData.last) {
      return NextResponse.json(
        { error: "Missing required fields (pmt_id, first, last)" },
        { status: 400 }
      );
    }
    
    const firestoreFormat = convertToFirestoreFormat(fighterData);
    
    // Add document to the roster subcollection with fighter's pmt_id as the document ID
    const rosterUrl = `${eventsCollection}/${eventId}/roster/${fighterData.pmt_id}`;
    
    const response = await fetch(`${rosterUrl}?key=${apiKey}`, {
      method: 'PUT', // Use PUT to specify document ID
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(firestoreFormat)
    });
    
    if (!response.ok) {
      console.error("Failed to add fighter to roster:", await response.text());
      throw new Error(`Failed to add fighter: ${response.status}`);
    }
    
    const responseData = await response.json();
    
    return NextResponse.json({
      message: "Fighter added to roster successfully",
      fighter: convertFromFirestoreFormat(responseData)
    });
    
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to add fighter to roster", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// API handler for removing a fighter from the roster
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  console.log("API Route Hit: Removing fighter from roster for event", eventId);
  
  const url = new URL(request.url);
  const fighterId = url.searchParams.get('fighterId');
  
  if (!fighterId) {
    return NextResponse.json(
      { error: "Missing fighter ID. Please provide a 'fighterId' query parameter" },
      { status: 400 }
    );
  }
  
  try {
    // Delete the fighter document from the roster subcollection
    const fighterUrl = `${eventsCollection}/${eventId}/roster/${fighterId}`;
    
    const response = await fetch(`${fighterUrl}?key=${apiKey}`, {
      method: 'DELETE'
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return NextResponse.json(
          { error: "Fighter not found in roster" },
          { status: 404 }
        );
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    return NextResponse.json({
      message: "Fighter removed from roster successfully",
      fighterId
    });
    
  } catch (error) {
    console.error("API Route Error:", error);
    return NextResponse.json(
      { error: "Failed to remove fighter from roster", details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}