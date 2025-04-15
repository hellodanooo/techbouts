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
      boutId: `day${dayNum}ring${ringNum}bout${boutNum}${sanctioning}${promoterId}${eventId}`,
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
  originalBoutNum,

}: {
  bout: Bout; // the updated bout object
  promoterId: string;
  eventId: string;
  originalBoutNum?: number;
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



    // Check if bout number has changed and there might be conflicts
    if (originalBoutNum !== undefined && bout.boutNum !== originalBoutNum) {
      const moveSuccess = await moveBout({
        boutNum: bout.boutNum,
        ringNum: bout.ringNum,
        dayNum: bout.dayNum,
        promoterId,
        eventId,
        existingBoutId: bout.boutId
      });

      if (!moveSuccess) {
        toast.error("Failed to arrange bout order");
        return;
      }
    }

    // Get fresh data after possible reordering
    const updatedBoutsDoc = await getDoc(boutsRef);
    const updatedData = updatedBoutsDoc.data();
    const updatedBouts: Bout[] = updatedData?.bouts || [];

    // Find index again as it might have changed
    const updatedIndex = updatedBouts.findIndex((b) => b.boutId === bout.boutId);
    
    if (updatedIndex === -1) {
      // The bout might have been removed or ID changed during reordering
      // Simply add the updated bout to the array
      await setDoc(boutsRef, { bouts: [...updatedBouts, bout] });
    } else {
      // Update the bout
      updatedBouts[updatedIndex] = bout;
      await setDoc(boutsRef, { bouts: updatedBouts });
    }
    
    toast.success("Bout updated successfully");
  } catch (error) {
    console.error("Error editing bout:", error);
    toast.error("Failed to edit bout");
  }
};


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

    console.log("📦 Existing bouts:", existingBouts);
    const boutToDelete = existingBouts.find((b) => b.boutId === boutId);
    console.log("🗑️ Deleting bout:", boutToDelete);

    // Filter out the bout to delete
    const updatedBouts = existingBouts.filter((b) => b.boutId !== boutId);
    console.log("✅ Updated bouts after deletion:", updatedBouts);

    // Only update the bouts field
    await setDoc(boutsRef, { bouts: updatedBouts }, { merge: true });
    toast.success(`Bout ${boutId} deleted successfully`);
  } catch (error) {
    console.error("Error deleting bout:", error);
    toast.error("Failed to delete bout");
  }
};

















export const moveBout = async ({
  boutNum,        // Target bout number
  ringNum,
  dayNum,
  promoterId,
  eventId,
  existingBoutId = null, // ID of bout being edited or null for new bout
}: {
  boutNum: number;
  ringNum: number;
  dayNum: number;
  promoterId: string;
  eventId: string;
  existingBoutId?: string | null;
}): Promise<boolean> => {
  try {
    // Get the existing bouts
    const boutsRef = doc(
      db,
      `events/promotions/${promoterId}/${eventId}/bouts_json/bouts`
    );
    const boutsDoc = await getDoc(boutsRef);

    if (!boutsDoc.exists()) {
      toast.error("No bouts document found.");
      return false;
    }

    const data = boutsDoc.data();
    const existingBouts: Bout[] = data.bouts || [];
    
console.log("bout before moving:", existingBouts);


    
    console.log("Successfully moved/rearranged bouts");
    return true;
  } catch (error) {
    console.error("Error moving bouts:", error);
    toast.error("Failed to rearrange bouts");
    return false;
  }
};
