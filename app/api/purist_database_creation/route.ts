// app/api/purist_database_creation/route.ts
import {  NextResponse } from 'next/server';

// Define interfaces for Firestore document structures
interface FirestoreDocument {
  name: string;
  fields?: Record<string, unknown>;
  createTime?: string;
  updateTime?: string;
}

interface FirestoreQueryResponse {
  documents?: FirestoreDocument[];
  nextPageToken?: string;
}

interface ApiResponse {
  success: boolean;
  rosterCount?: number;
  rosters?: FirestoreDocument[];
  error?: string;
  details?: string;
}

const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;
const baseUrl = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents`;

// Helper function to get all Purist events
async function getAllPuristEvents(): Promise<string[]> {
  try {
    const eventsUrl = `${baseUrl}/purist_events?key=${apiKey}`;
    const response = await fetch(eventsUrl);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json() as FirestoreQueryResponse;
    if (!data.documents) return [];

    return data.documents.map((doc: FirestoreDocument) => {
      const parts = doc.name.split('/');
      return parts[parts.length - 1];
    });
  } catch (error) {
    console.error("Error fetching Purist events:", error);
    throw error;
  }
}

// Helper function to fetch roster for a single event
async function fetchEventRoster(eventId: string): Promise<FirestoreDocument[] | null> {
  try {
    const rosterUrl = `${baseUrl}/purist_events/${eventId}/roster?key=${apiKey}`;
    const response = await fetch(rosterUrl);
    
    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`HTTP error! status: ${response.status} for event ${eventId}`);
    }
    
    const data = await response.json() as FirestoreQueryResponse;
    return data.documents || [];
  } catch (error) {
    console.error(`Error fetching roster for event ${eventId}:`, error);
    return null;
  }
}

export const dynamic = 'force-dynamic'; // Disable caching
export const revalidate = 0;

export async function GET(): Promise<NextResponse<ApiResponse>> {
  try {
    console.log("Starting Purist database creation API call");
    
    // Get all event IDs
    const eventIds = await getAllPuristEvents();
    console.log(`Found ${eventIds.length} Purist events`);

    // Fetch roster for each event in parallel
    const rosterPromises = eventIds.map(fetchEventRoster);
    const rosters = await Promise.all(rosterPromises);
    
    // Combine all rosters and filter out null results
    const allRosterDocs = rosters
      .flat()
      .filter((roster): roster is FirestoreDocument => roster !== null);
    
    return NextResponse.json({ 
      success: true,
      rosterCount: allRosterDocs.length,
      rosters: allRosterDocs
    });

  } catch (error) {
    console.error("Error in purist database creation:", error);
    return NextResponse.json(
      { 
        success: false,
        error: "Failed to create Purist database", 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}