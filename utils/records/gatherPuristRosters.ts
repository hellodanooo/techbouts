// utils/records/gatherPuristRosters.ts
import { headers } from 'next/headers';

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
  name?: string;
}

export type Fighter = {
  address: string;
  age: number;
  city: string;
  coach: string;
  coach_phone: string;
  coach_email: string;
  email: string;
  dob: string;
  docId: string;
  fighter_id: string;
  first: string;
  gender: string;
  gym: string;
  gym_id: string;
  height: number;
  last: string;
  losses: number;
  mtp_id: string;
  photo: string;
  state: string;
  website: string;
  weightclass: number;
  win: string | number;
  loss: string | number;
  eventIds: string[];
};

// Helper function to convert Firestore format to regular JSON
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

// Generate fighter ID from name and birthday
const generateFighterId = (first: string, last: string, dob: string): string => {
    const cleanFirstName = first.toUpperCase().replace(/[^A-Z]/g, '');
    const cleanLastName = last.toUpperCase().replace(/[^A-Z]/g, '');
    
    // Parse the date and pad month/day if needed
    const dateParts = dob.split(/[-/]/); // Split on either hyphen or forward slash
    if (dateParts.length === 3) {
      let day, month, year;
      
      // Check if year is first (YYYY-MM-DD) or last (MM/DD/YYYY or DD/MM/YYYY)
      if (dateParts[0].length === 4) {
        // YYYY-MM-DD format
        [year, month, day] = dateParts;
      } else {
        // MM/DD/YYYY or DD/MM/YYYY format
        if (parseInt(dateParts[0]) > 12) {
          // DD/MM/YYYY format
          [day, month, year] = dateParts;
        } else {
          // MM/DD/YYYY format
          [month, day, year] = dateParts;
        }
      }
  
      // Pad month and day with leading zeros
      month = month.padStart(2, '0');
      day = day.padStart(2, '0');
      
      const cleanDob = `${day}${month}${year}`;
      return `${cleanFirstName}${cleanLastName}${cleanDob}`;
    }
    
    // Fallback if date format is unexpected
    const cleanDob = dob.replace(/[^0-9]/g, '');
    return `${cleanFirstName}${cleanLastName}${cleanDob}`;
  };


  const extractEventId = (documentName: string | undefined): string | null => {
    if (!documentName) return null;
    
    // The document name format would be something like:
    // "projects/{projectId}/databases/(default)/documents/{eventId}/roster/fighters/{fighterId}"
    const parts = documentName.split('/');
    // Get the eventId part - it should be after "documents"
    const documentsIndex = parts.indexOf('documents');
    if (documentsIndex !== -1 && parts.length > documentsIndex + 1) {
      return parts[documentsIndex + 2];
    }
    return null;
  };

export async function gatherPuristRosters(): Promise<Fighter[]> {
    try {
      console.log('Starting gatherPuristRosters');
      
      let apiUrl: string;
      
      // Check if we're running on server or client
      if (typeof window === 'undefined') {
        // Server-side: use headers
        const headersList = await headers();
        const host = headersList.get('host');
        const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
        apiUrl = `${protocol}://${host}/api/purist_database_creation`;
      } else {
        // Client-side: use window.location
        apiUrl = `${window.location.origin}/api/purist_database_creation`;
      }
      
      console.log('Fetching from:', apiUrl);
  
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
        cache: 'no-store',
        next: { revalidate: 0 }
      });
  
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}. Details: ${errorText}`);
      }
  
      const data = await response.json();
      console.log('Received data with rosters:', data.rosters?.length || 0);
      
      if (!data.rosters) {
        console.log('No rosters found in response');
        return [];
      }
  
      // Convert Firestore documents and merge fighters
      const fighterMap = new Map<string, Fighter>();
  
      data.rosters.forEach((doc: FirestoreDocument) => {
        const fighterData = convertFromFirestoreFormat(doc);
        if (!fighterData) return;
  
        try {
          const fighterId = generateFighterId(
            fighterData.first as string,
            fighterData.last as string,
            fighterData.dob as string
          );
  
          const eventId = extractEventId(doc.name);

console.log("Event ID", eventId);

          if (fighterMap.has(fighterId)) {
            const existingFighter = fighterMap.get(fighterId)!;
      
            // Make sure eventIds is initialized
            if (!existingFighter.eventIds) {
              existingFighter.eventIds = [];
            }
            
            // Add the new eventId if it exists and isn't already in the array
            if (eventId && !existingFighter.eventIds.includes(eventId)) {
              existingFighter.eventIds.push(eventId);
            }
      
            fighterMap.set(fighterId, {
              ...existingFighter,
              ...fighterData as Fighter,
              fighter_id: fighterId,
              eventIds: existingFighter.eventIds  // Keep the accumulated eventIds
            });
          } else {
            // For new fighter, initialize with the current eventId
            const newFighter = {
              ...(fighterData as Fighter),
              fighter_id: fighterId,
              eventIds: eventId ? [eventId] : []
            };
            fighterMap.set(fighterId, newFighter);
          }
        } catch (error) {
          console.error('Error processing fighter:', error, fighterData);
        }
      });
  
      const fighters = Array.from(fighterMap.values());
     console.log('Processed fighters:', fighters.length);
      return fighters;
      
    } catch (error) {
      console.error("Error gathering Purist rosters:", error);
      return [];
    }
  }