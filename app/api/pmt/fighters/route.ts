// app/api/pmt/fighters/route.ts
import { NextResponse } from 'next/server';
import { FirebaseService } from '@/lib/services/firebase';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const years = JSON.parse(url.searchParams.get('years') || '{}');
  const states = JSON.parse(url.searchParams.get('states') || '{}');
  
  try {
    const fighters = await FirebaseService.getPMTFighters(
      years, 
      states,
      (message) => console.log(message)
    );
    return NextResponse.json({ fighters });
  } catch (error) {
    console.error('Failed to fetch fighters:', error); // Log the error
    return NextResponse.json(
      { error: 'Failed to fetch fighters' },
      { status: 500 }
    );
  }
}