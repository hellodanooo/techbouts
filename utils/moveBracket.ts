import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { app } from '@/lib/firebase_techbouts/config';  

import { ResultsFighter } from '../utils/types';



export const shiftBrackets = async (
  allFighters: ResultsFighter[],
  oldBracketNum: number,
  newBracketNum: number,
  eventId: string
) => {
  const db = getFirestore(app);
  const fightersToMove = allFighters.filter(fighter => fighter.bracket === oldBracketNum);
  console.log('Fighters to move:', fightersToMove);

  // Log the new bracket number
  console.log('New bracket number:', newBracketNum);

  if (newBracketNum < oldBracketNum) {
    const fightersToShiftUp = allFighters.filter(fighter =>
      fighter.bracket !== undefined &&
      fighter.bracket !== 0 &&
      fighter.bracket >= newBracketNum &&
      fighter.bracket < oldBracketNum
    );
    console.log('Fighters that need to shift Up:', fightersToShiftUp.map(fighter => fighter.id));

    // Create a batch to update multiple documents
    const batch = writeBatch(db);

    // Increment the bracket value for each fighter that needs to shift
    fightersToShiftUp.forEach(fighter => {
      if (fighter.bracket !== undefined) {
        const fighterRef = doc(db, 'purist_events', eventId, 'fightcard', fighter.id);
        batch.update(fighterRef, { bracket: fighter.bracket + 1 });
      }
      fightersToMove.forEach(fighter => {
        const fighterRef = doc(db, 'purist_events', eventId, 'fightcard', fighter.id);
        batch.update(fighterRef, { bracket: newBracketNum });
      }
      );
    });

    // Commit the batch
    try {
      await batch.commit();
      console.log('Successfully updated shifted fighters in Firestore');
    } catch (error) {
      console.error('Error updating shifted fighters in Firestore:', error);
    }
  }


  if (newBracketNum > oldBracketNum) {
  console.log('new bracket number higher than old')
  const fightersToShiftDown = allFighters.filter(fighter =>
    fighter.bracket !== undefined &&
    fighter.bracket !== 0 &&
    fighter.bracket <= newBracketNum &&
    fighter.bracket > oldBracketNum
  );
  console.log('Fighters that need to shift Down:', fightersToShiftDown.map(fighter => fighter.id));
  const batch = writeBatch(db);
  fightersToShiftDown.forEach(fighter => {
    if (fighter.bracket !== undefined) {
      const fighterRef = doc(db, 'purist_events', eventId, 'fightcard', fighter.id);
      batch.update(fighterRef, { bracket: fighter.bracket - 1 });
    }
    fightersToMove.forEach(fighter => {
      const fighterRef = doc(db, 'purist_events', eventId, 'fightcard', fighter.id);
      batch.update(fighterRef, { bracket: newBracketNum });
    }
    );
  });

  try {
    await batch.commit();
    console.log('Successfully updated shifted fighters in Firestore');
  } catch (error) {
    console.error('Error updating shifted fighters in Firestore:', error);
  }
  
  }






  console.log('Shifting completed.');
};