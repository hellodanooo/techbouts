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

    // Using the PMT Firebase API key directly
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID_PMT}/databases/(default)/documents/emails_pmt_${year}/emails_json?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY_PMT}`
    );

    if (!response.ok) {
      throw new Error(`Firebase API error: ${response.statusText}`);
    }

    const data = (await response.json()) as FirestoreDocument;
    
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
    console.error('Error fetching emails:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}