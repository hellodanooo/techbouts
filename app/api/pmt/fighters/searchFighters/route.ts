// app/api/pmt/fighters/searchFighters/route.ts
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Define types for Firestore response values.
interface FirestoreValue {
  stringValue?: string;
  integerValue?: string;
  doubleValue?: string;
  booleanValue?: boolean;
  arrayValue?: {
    values?: FirestoreValue[];
  };
  mapValue?: {
    fields: Record<string, FirestoreValue>;
  };
}

export type FirestoreValueType =
  | string
  | number
  | boolean
  | FirestoreValueType[]
  | { [key: string]: FirestoreValueType }
  | null;

interface FirestoreDocument {
  name: string;
  fields: Record<string, FirestoreValue>;
}

interface FirestoreQueryResult {
  document?: FirestoreDocument;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const year = searchParams.get('year');
  const terms = searchParams.get('terms');

  console.log('Search query parameters:', { year, terms });

  if (!year || !terms) {
    console.error('Missing or invalid parameters:', { year, terms });
    return NextResponse.json(
      { error: 'Missing or invalid parameters' },
      { status: 400 }
    );
  }

  // Configure Firestore REST API URL using environment variables
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;
  if (!projectId || !apiKey) {
    console.error('Missing Firebase configuration');
    return NextResponse.json(
      { error: 'Missing Firebase configuration' },
      { status: 500 }
    );
  }
  const firestoreURL = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents:runQuery?key=${apiKey}`;

  try {
    // Process search terms: split by comma, trim, and filter out empty strings.
    const termArray: string[] = terms
      .split(',')
      .map((t: string) => t.trim())
      .filter((t): t is string => t !== '');

    console.log('Term array:', termArray);

    // Build the structured query for Firestore using the searchKeywords field.
    const queryBody = {
      structuredQuery: {
        from: [
          {
            collectionId: `records_pmt_${year}`,
          },
        ],
        where: {
          fieldFilter: {
            field: { fieldPath: 'searchKeywords' },
            op: 'ARRAY_CONTAINS_ANY', // For array fields
            value: {
              arrayValue: {
                values: termArray.map((term: string): FirestoreValue => ({
                  stringValue: term.toLowerCase(),
                })),
              },
            },
          },
        },
        limit: 100,
      },
    };

    const res = await fetch(firestoreURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(queryBody),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('Error response from Firestore:', data);
      return NextResponse.json(
        { error: data.error || 'Error querying fighters' },
        { status: res.status }
      );
    }

    // A helper function to convert Firestore field values into plain JavaScript values.
    const extractValue = (field: FirestoreValue): FirestoreValueType => {
      if ('stringValue' in field && field.stringValue !== undefined) {
        return field.stringValue;
      }
      if ('integerValue' in field && field.integerValue !== undefined) {
        return Number(field.integerValue);
      }
      if ('doubleValue' in field && field.doubleValue !== undefined) {
        return Number(field.doubleValue);
      }
      if ('booleanValue' in field && field.booleanValue !== undefined) {
        return field.booleanValue;
      }
      if ('arrayValue' in field && field.arrayValue?.values) {
        return field.arrayValue.values.map((val: FirestoreValue) =>
          extractValue(val)
        );
      }
      if (field.mapValue && field.mapValue.fields) {
        const obj: { [key: string]: FirestoreValueType } = {};
        for (const key in field.mapValue.fields) {
          const value: FirestoreValue = field.mapValue.fields[key];
          obj[key] = extractValue(value);
        }
        return obj;
      }
      return null;
    };

    // Process the Firestore query results
    const fighters = (data as FirestoreQueryResult[])
      .filter(
        (result: FirestoreQueryResult): result is { document: FirestoreDocument } =>
          Boolean(result.document)
      )
      .map((result: FirestoreQueryResult) => {
        const doc = result.document!;
        // Extract documentId from the document name.
        const parts = doc.name.split('/');
        const fighter_id = parts[parts.length - 1];

        const fields: Record<string, FirestoreValue> = doc.fields || {};
        const fighter: { [key: string]: FirestoreValueType } = { fighter_id };

        for (const key in fields) {
          const fieldValue: FirestoreValue = fields[key];
          fighter[key] = extractValue(fieldValue);
        }
        return fighter;
      });

    console.log('Fighters returned:', fighters);

    return NextResponse.json({ fighters });
  } catch (error) {
    console.error('Error searching fighters:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    );
  }
}
