// app/api/calculate-records/route.ts
import { calculateAllFighterRecords } from '@/utils/records/processRecords_pmt';
import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const result = await calculateAllFighterRecords();
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error calculating fighter records:', error); // Log the error
    return NextResponse.json(
      { error: 'Failed to calculate records' },
      { status: 500 }
    );
  }
}