import { doc, getDoc, setDoc } from 'firebase/firestore';
import { toast } from 'sonner';
import { db } from '@/lib/firebase_techbouts/config';
import { RosterFighter, Bout } from '../types';


export const createMatch = async ({
  red,
  blue,
  weightclass,
  boutNum,
  ringNum,
  eventId,
  promoterId,
  eventName,
  promotionName,
  date,
  sanctioning,
  bout_type,
  dayNum,
  setIsCreatingMatch,
  setRed,
  setBlue,
}: {
  red: RosterFighter | null;
  blue: RosterFighter | null;
  weightclass: number;
  boutNum: number;
  ringNum: number;
  eventId: string;
  promoterId: string;
  eventName: string;
  promotionName: string;
  date: string;
  sanctioning: string;
  bout_type: string;
  dayNum: number;
  setIsCreatingMatch: (value: boolean) => void;
  setRed: (fighter: RosterFighter | null) => void;
  setBlue: (fighter: RosterFighter | null) => void;
}) => {
  if (!red || !blue || !eventId || !promoterId) {
    toast.error("Missing fighters or event/promoter IDs");
    return;
  }

  setIsCreatingMatch(true);

  try {
    const redId = red.fighter_id;
    const blueId = blue.fighter_id;

    if (!redId || !blueId) {
      toast.error("Fighter IDs are missing");
      return;
    }

    const bout: Bout = {
      
      weightclass: weightclass,
      ringNum: ringNum,
      boutNum: boutNum,
      red,
      blue,
      methodOfVictory: '',
      confirmed: false,
      eventId,
      eventName,
      url: '',
      date,
      promotionId: promoterId,
      promotionName,
      sanctioning,
      bout_type,
      dayNum,
      class: '',
      boutId: `${sanctioning}${promoterId}${eventId}${ringNum}${boutNum}`,
    };


console.log('bout', bout)

    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (boutsDoc.exists()) {
      const data = boutsDoc.data();
      const existingBouts = data.bouts || [];
      await setDoc(boutsRef, { bouts: [...existingBouts, bout] });
    } else {
      await setDoc(boutsRef, { bouts: [bout] });
    }

    toast.success(
      `Match created: ${red.first} ${red.last} vs ${blue.first} ${blue.last}`
    );

    setRed(null);
    setBlue(null);
  } catch (error) {
    console.error("Error creating match:", error);
    toast.error("Failed to create match");
  } finally {
    setIsCreatingMatch(false);
  }
};


export const editBout = async ({
  bout,
  promoterId,
  eventId,
}: {
  bout: Bout; // the updated bout object
  promoterId: string;
  eventId: string;
}) => {
  try {
    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (!boutsDoc.exists()) {
      toast.error("No bouts found to edit.");
      return;
    }

    const data = boutsDoc.data();
    const existingBouts: Bout[] = data.bouts || [];

    // Find index of the existing bout in the array
    const index = existingBouts.findIndex((b) => b.boutId === bout.boutId);
    if (index === -1) {
      toast.error(`Bout ID ${bout.boutId} not found`);
      return;
    }

    // Overwrite fields at that index
    existingBouts[index] = bout;

    // Now re-save
    await setDoc(boutsRef, { bouts: existingBouts });
    toast.success("Bout updated successfully");
  } catch (error) {
    console.error("Error editing bout:", error);
    toast.error("Failed to edit bout");
  }
};

// 2) DELETE a bout from the array
export const deleteBout = async ({
  boutId,
  promoterId,
  eventId,
}: {
  boutId: string;
  promoterId: string;
  eventId: string;
}) => {
  try {
    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (!boutsDoc.exists()) {
      toast.error("No bouts found to delete.");
      return;
    }

    const data = boutsDoc.data();
    const existingBouts: Bout[] = data.bouts || [];

    // Filter out the bout to delete
    const updatedBouts = existingBouts.filter((b) => b.boutId !== boutId);

    await setDoc(boutsRef, { bouts: updatedBouts });
    toast.success(`Bout ${boutId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting bout:", error);
    toast.error("Failed to delete bout");
  }
};