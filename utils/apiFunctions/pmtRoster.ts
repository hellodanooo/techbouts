// utils/apiFunctions/pmtRoster.ts

import { PmtFighterRecord, RosterFighter } from '../types';
import { collection, getDocs } from "firebase/firestore";

import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { doc, updateDoc } from "firebase/firestore";


function transformPmtFighterToRosterFighter(pmt: PmtFighterRecord): RosterFighter {
  return {
    // Mapping basic info
    fighter_id: pmt.pmt_id,
    first: pmt.first,
    last: pmt.last,
    // Since PMT record doesn't provide these, we default to empty strings or reasonable defaults.
    dob: "",
    age: pmt.age ?? 0,
    gender: "MALE", // Or determine based on additional logic
    photo: "", // You might set a default image here
    gym: pmt.gym || "",
    gym_id: "",
    coach: "",
    coach_email: "",
    coach_name: "",
    state: "",
    city: "",
    weightclass: pmt.weightclass ?? 0,
    weighin: pmt.weighin ?? 0,
    age_gender: "MEN",
    docId: "",
    // Record fields: using available PMT wins/losses or defaulting to 0
    mt_win: pmt.win ?? 0,
    mt_loss: pmt.loss ?? 0,
    boxing_win: 0,
    boxing_loss: 0,
    mma_win: 0,
    mma_loss: 0,
    pmt_win: pmt.win ?? 0,
    pmt_loss: pmt.loss ?? 0,
    pb_win: 0,
    pb_loss: 0,
    other_exp: "",
    nc: pmt.nc ?? 0,
    dq: pmt.dq ?? 0,
    years_exp: 0,
    // Use the PMT fight history if available
    pmt_fights: pmt.fights || [],
    fullContactbouts: [],
    // Contact info
    email: pmt.email || "",
    phone: "",
    coach_phone: "",
    gym_website: "",
    gym_address: "",
    // RosterFighter additional fields
    result: "-", // Default value; adjust as needed
 
    photo_package: false,
    date_registered: pmt.lastUpdated || "",
    payment_info: {
      paymentIntentId: "",
      paymentAmount: 0,
      paymentCurrency: ""
    }
  };
}


export async function fetchPmtRoster(eventId: string): Promise<RosterFighter[] | null> {
  try {
    // Build a reference to the "roster" subcollection for the given event.
    const rosterCollectionRef = collection(pmtDb, "events", eventId, "roster");
    const querySnapshot = await getDocs(rosterCollectionRef);

    if (querySnapshot.empty) {
      console.log("No fighters found in PMT roster");
      return [];
    }

    // For each document, merge the document data with its ID (as pmt_id)
    const rosterFighters: RosterFighter[] = querySnapshot.docs.map((doc) => {
      const record = { ...doc.data(), pmt_id: doc.id } as PmtFighterRecord;
      return transformPmtFighterToRosterFighter(record);
    });

    console.log(`Successfully fetched ${rosterFighters.length} fighters from PMT roster`);
    return rosterFighters;
  } catch (error) {
    console.error("Error fetching PMT roster from Firebase:", error);
    return null;
  }
}


/**
 * Saves the weighin value for a fighter (using PMT Firebase).
 *
 * @param fighterId - The fighter's ID (from PMT)
 * @param eventId - The event's ID
 * @param newWeight - The new weighin value to save
 */
export async function saveWeighin(fighterId: string, eventId: string, newWeight: number): Promise<void> {
  try {
    // Build a reference to the fighter document in the roster subcollection.
    const fighterDocRef = doc(pmtDb, "events", eventId, "roster", fighterId);
    // Update the weighin field.
    await updateDoc(fighterDocRef, { weighin: newWeight });
    console.log(`Successfully updated weighin for fighter ${fighterId} in event ${eventId}`);
  } catch (error) {
    console.error("Error updating weighin:", error);
    throw error;
  }
}