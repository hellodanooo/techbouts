import { NextResponse } from 'next/server';
import { fetchResultsFighters } from './fighters';

export async function GET(request: Request) {
  // Get years and state from query parameters
  const url = new URL(request.url);
  const years = JSON.parse(url.searchParams.get('years') || '{}');
  const states = JSON.parse(url.searchParams.get('states') || '{}');
  
  const updateLog = (message: string) => {
    console.log(message);
  };

  const fighters = await fetchResultsFighters(years, states, updateLog);
  
  return NextResponse.json({ fighters });
}