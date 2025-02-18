// app/api/promoters/[promoterId]/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

export async function GET(
    request: Request,
    { params }: { params: Promise<{ promoterId: string }> }
  ) {
    console.log('API Route - Starting GET request');
    
    try {
      const { promoterId } = await params;
      console.log('API Route - Fetching Promoter with ID:', promoterId);
      
      const promoterRef = doc(db, 'promotions', promoterId);
      const promoterSnapshot = await getDoc(promoterRef);
  
      if (!promoterSnapshot.exists()) {
        console.log('API Route - Promoter not found in Firebase');
        return NextResponse.json({ error: 'Promoter not found' }, { status: 404 });
      }
  
      const promoterData = promoterSnapshot.data();
      console.log('API Route - Raw Firestore data:', promoterData);
  
      // Return with 'promoter' key instead of 'event'
      return NextResponse.json({ promoter: promoterData });
  
    } catch (error) {
      console.error('API Route - Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      return NextResponse.json(
        { error: 'Failed to fetch promoter', details: errorMessage },
        { status: 500 }
      );
    }
  }

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ promoterId: string }> }
) {
  try {
    const { promoterId } = await params;
    const updatedData = await request.json();
    
    const promoterRef = doc(db, 'promotions', promoterId);
    const promoterSnapshot = await getDoc(promoterRef);

    if (!promoterSnapshot.exists()) {
      return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    }

    // ✅ Use `updateDoc` instead of `eventRef.update`
    await updateDoc(promoterRef, updatedData);
    
    const updatedSnapshot = await getDoc(promoterRef);
    const updatedEventData = updatedSnapshot.data();

    return NextResponse.json({ 
      message: 'promoterId updated successfully',
      event: updatedEventData 
    });
  } catch (error) {
    console.error('API Route - Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: 'Failed to update promoterId', details: errorMessage },
      { status: 500 }
    );
  }
}
