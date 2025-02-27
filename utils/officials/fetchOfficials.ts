// utils/officials/fetchOfficials.ts
import { collection, doc, getDoc, updateDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { Official } from '@/utils/types';

/**
 * Fetches officials data from Firebase Firestore
 * @returns Promise containing an array of Official objects
 */
export async function fetchOfficials(): Promise<Official[]> {
  try {
    const officialsRef = collection(db, 'officials');
    const officialsDoc = doc(officialsRef, 'officials_json');
    const docSnap = await getDoc(officialsDoc);

    if (docSnap.exists()) {
      const officialsData = docSnap.data();
      return officialsData.data || [];
    }
    
    return [];
  } catch (error) {
    console.error('Error fetching officials:', error);
    throw new Error('Failed to fetch officials');
  }
}

/**
 * Updates an official in the Firestore database
 * @param updatedOfficial - The official with updated data
 * @param allOfficials - The current list of all officials
 * @returns Promise containing the updated officials array
 */
export async function updateOfficial(
  updatedOfficial: Official, 
  allOfficials: Official[]
): Promise<Official[]> {
  try {
    const officialsRef = collection(db, 'officials');
    const officialsDoc = doc(officialsRef, 'officials_json');
    
    // Update the specific official in the array
    const updatedOfficials = allOfficials.map(o => 
      o.id === updatedOfficial.id ? updatedOfficial : o
    );

    await updateDoc(officialsDoc, {
      data: updatedOfficials
    });

    return updatedOfficials;
  } catch (error) {
    console.error('Error updating official:', error);
    throw new Error('Failed to update official');
  }
}

/**
 * Adds a new official to the Firestore database
 * @param newOfficial - The new official to add
 * @param allOfficials - The current list of all officials
 * @returns Promise containing the updated officials array
 */
export async function addOfficial(
  newOfficial: Official, 
  allOfficials: Official[]
): Promise<Official[]> {
  try {
    const officialsRef = collection(db, 'officials');
    const officialsDoc = doc(officialsRef, 'officials_json');
    
    // Add the new official to the array
    const updatedOfficials = [...allOfficials, newOfficial];

    await updateDoc(officialsDoc, {
      data: updatedOfficials
    });

    return updatedOfficials;
  } catch (error) {
    console.error('Error adding official:', error);
    throw new Error('Failed to add official');
  }
}

/**
 * Deletes an official from the Firestore database
 * @param officialId - The ID of the official to delete
 * @param allOfficials - The current list of all officials
 * @returns Promise containing the updated officials array
 */
export async function deleteOfficial(
  officialId: string, 
  allOfficials: Official[]
): Promise<Official[]> {
  try {
    const officialsRef = collection(db, 'officials');
    const officialsDoc = doc(officialsRef, 'officials_json');
    
    // Filter out the official to delete
    const updatedOfficials = allOfficials.filter(o => o.id !== officialId);

    await updateDoc(officialsDoc, {
      data: updatedOfficials
    });

    return updatedOfficials;
  } catch (error) {
    console.error('Error deleting official:', error);
    throw new Error('Failed to delete official');
  }
}

/**
 * Fetches a single official by ID
 * @param officialId - The ID of the official to fetch
 * @returns Promise containing the official or null if not found
 */
export async function fetchOfficialById(officialId: string): Promise<Official | null> {
  try {
    const officials = await fetchOfficials();
    const official = officials.find(o => o.officialId === officialId || o.id === officialId);
    return official || null;
  } catch (error) {
    console.error('Error fetching official by ID:', error);
    throw new Error('Failed to fetch official');
  }
}