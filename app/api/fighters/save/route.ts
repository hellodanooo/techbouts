// app/api/fighters/save/route.ts

import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, getDoc, writeBatch } from 'firebase/firestore';
import { RosterFighter } from '@/utils/types';

export async function POST(request: Request) {
  console.log('[API_SAVE_FIGHTER] Request received');

  try {
    // Parse the request body as JSON
    const body = await request.json();
    const { 
      eventId, 
      fighterData, 
      currentDate, 
      promoterId 
    } = body;

    if (!fighterData.fighter_id) {
      console.error(`[API_SAVE_FIGHTER_ERROR] No fighter_id provided`);
      return NextResponse.json(
        { success: false, message: 'Missing fighter_id' },
        { status: 400 }
      );
    }
    
    console.log(`[API_SAVE_FIGHTER] Processing fighter: ${fighterData.fighter_id} in event: ${eventId}`);
    
    // Create payment info object from the nested structure sent by the client
    const payment_info = {
      paymentIntentId: fighterData.payment_info?.paymentIntentId || '',
      paymentAmount: fighterData.payment_info?.paymentAmount || 0,
      paymentCurrency: fighterData.payment_info?.paymentCurrency || 'USD'
    };
    
    console.log(`[API_SAVE_FIGHTER] Payment info prepared: ${JSON.stringify(payment_info)}`);

    // Determine age_gender classification
    const ageGenderClassification = determineAgeGender(fighterData.age, fighterData.gender);
    console.log(`[API_SAVE_FIGHTER] Age-gender classification: ${ageGenderClassification}`);

    // Prepare fighter data to match RosterFighter interface
    const fullContactFighterData: Partial<RosterFighter> = {
      // Basic Information
      fighter_id: fighterData.fighter_id,
      first: fighterData.first,
      last: fighterData.last,
      dob: fighterData.dob,
      age: fighterData.age,
      gender: fighterData.gender,
      email: fighterData.email.toLowerCase(),
      phone: fighterData.phone,
      heightFoot: fighterData.heightFoot || 0,
      heightInch: fighterData.heightInch || 0,
      heightCm: fighterData.heightCm || 0,
      
      // Gym Information
      gym: fighterData.gym,
      coach: fighterData.coach_name,
      coach_email: fighterData.coach_email || '',
      coach_name: fighterData.coach_name,
      coach_phone: fighterData.coach_phone,

      // Location Information
      state: fighterData.state || '',
      city: fighterData.city || '',

      // Physical Information
      weightclass: fighterData.weightclass,

      // Record
      mt_win: fighterData.mt_win || 0,
      mt_loss: fighterData.mt_loss || 0,
      boxing_win: fighterData.boxing_win || 0,
      boxing_loss: fighterData.boxing_loss || 0,
      mma_win: fighterData.mma_win || 0,
      mma_loss: fighterData.mma_loss || 0,
      pmt_win: fighterData.pmt_win || 0,
      pmt_loss: fighterData.pmt_loss || 0,

      // Experience & Classification
      years_exp: fighterData.years_exp || 0,
      age_gender: ageGenderClassification,

      // Documentation
      docId: fighterData.fighter_id,
      payment_info: payment_info,
      
      // Required fields for RosterFighter
      result: '-' as 'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-',
      weighin: 0,
      date_registered: currentDate
    };

    console.log(`[API_SAVE_FIGHTER] Fighter data prepared for Firestore`);

    // Reference to the roster_json document
    const rosterJsonRef = doc(db, 'events', 'promotions', promoterId, eventId, 'roster_json', 'fighters');
    console.log(`[API_SAVE_FIGHTER] Firestore path: events/promotions/${promoterId}/${eventId}/roster_json/fighters`);

    // Check if the document exists
    console.log(`[API_SAVE_FIGHTER] Checking if roster document exists`);
    const rosterJsonDoc = await getDoc(rosterJsonRef);
    
    const batch = writeBatch(db);

    if (rosterJsonDoc.exists()) {
      console.log(`[API_SAVE_FIGHTER] Roster document exists, updating existing document`);
      // Document exists, get the current fighters array
      const data = rosterJsonDoc.data();
      const fighters = data.fighters || [];
      console.log(`[API_SAVE_FIGHTER] Current roster count: ${fighters.length}`);

      // Check if fighter already exists in the array (by fighter_id)
      const existingFighterIndex = fighters.findIndex(
        (f: RosterFighter) => f.fighter_id === fighterData.fighter_id
      );

      if (existingFighterIndex >= 0) {
        console.log(`[API_SAVE_FIGHTER] Fighter already exists in roster, updating existing record`);
        fighters[existingFighterIndex] = {
          ...fighters[existingFighterIndex],
          ...fullContactFighterData,
          updated_at: currentDate
        };
      } else {
        // Add the new fighter to the array
        fighters.push(fullContactFighterData);
        console.log(`[API_SAVE_FIGHTER] Added fighter to existing array, new count: ${fighters.length}`);
      }

      // Update the document with the new array
      batch.update(rosterJsonRef, { fighters: fighters });
    } else {
      console.log(`[API_SAVE_FIGHTER] Roster document doesn't exist, creating new document`);
      // Document doesn't exist, create it with the fighter as the first item in the array
      batch.set(rosterJsonRef, { fighters: [fullContactFighterData] });
    }

    // Commit the batch
    console.log(`[API_SAVE_FIGHTER] Committing batch write to Firestore`);
    await batch.commit();
    console.log(`[API_SAVE_FIGHTER] Batch write successful for fighter: ${fighterData.fighter_id}`);

    return NextResponse.json({ 
      success: true, 
      message: 'Fighter saved successfully',
      fighter: {
        id: fighterData.fighter_id,
        name: `${fighterData.first} ${fighterData.last}`,
        email: fighterData.email
      }
    });
  } catch (error) {
    console.error(`[API_SAVE_FIGHTER_ERROR] Error saving fighter:`, error);
    return NextResponse.json({ 
      success: false, 
      message: 'Failed to save fighter data',
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

// Helper function to determine age_gender classification
function determineAgeGender(age: number, gender: string): 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS' {
  if (age >= 18) {
    return gender.toLowerCase() === 'male' ? 'MEN' : 'WOMEN';
  } else {
    return gender.toLowerCase() === 'male' ? 'BOYS' : 'GIRLS';
  }
}