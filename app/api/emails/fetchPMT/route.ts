// app/api/emails/fetchPMT/route.ts
import { NextResponse } from 'next/server';

interface FirestoreMapValue {
  mapValue: {
    fields: {
      pmt_id: { stringValue: string };
      first: { stringValue: string };
      last: { stringValue: string };
      email: { stringValue: string };
    };
  };
}

interface FirestoreDocument {
  fields: {
    emails: {
      arrayValue: {
        values: FirestoreMapValue[];
      };
    };
    lastUpdated?: {
      timestampValue: string;
    };
  };
}

export async function GET(request: Request) {
  try {
    // Get year from search params
    const { searchParams } = new URL(request.url);
    const year = searchParams.get('year');

    if (!year) {
      return NextResponse.json({ error: 'Year parameter is required' }, { status: 400 });
    }

    // Validate environment variables
    const projectId = process.env.FIREBASE_PROJECT_ID_PMT || process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT;
    const apiKey = process.env.FIREBASE_API_KEY_PMT || process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT;

    if (!projectId || !apiKey) {
      console.error('Missing environment variables:', {
        hasProjectId: !!projectId,
        hasApiKey: !!apiKey
      });
      return NextResponse.json({ error: 'Configuration error' }, { status: 500 });
    }

    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/(default)/documents/emails_pmt_${year}/emails_json?key=${apiKey}`;

    const response = await fetch(url);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firebase API error:', {
        status: response.status,
        statusText: response.statusText,
        errorText,
        url: url.replace(apiKey, '[REDACTED]') // Log URL without API key
      });
      throw new Error(`Firebase API error: ${response.statusText}`);
    }

    const data = (await response.json()) as FirestoreDocument;
    
    if (!data.fields?.emails?.arrayValue?.values) {
      console.error('Unexpected data structure:', JSON.stringify(data));
      throw new Error('Invalid data structure received from Firebase');
    }

    // Transform Firestore document format to our app format
    const emailData = data.fields.emails.arrayValue.values.map((item: FirestoreMapValue) => ({
      pmt_id: item.mapValue.fields.pmt_id.stringValue,
      first: item.mapValue.fields.first.stringValue,
      last: item.mapValue.fields.last.stringValue,
      email: item.mapValue.fields.email.stringValue,
    }));

    return NextResponse.json({
      emails: emailData,
      totalEmails: emailData.length,
      lastUpdated: data.fields.lastUpdated?.timestampValue || new Date().toISOString(),
    });
  } catch (error) {
    // Enhanced error logging
    console.error('Detailed error:', {
      error: error instanceof Error ? {
        message: error.message,
        stack: error.stack
      } : error,
      timestamp: new Date().toISOString()
    });
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}