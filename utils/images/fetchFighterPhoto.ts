// utils/fetchFighterPhoto.ts
import { getStorage, ref, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase_techbouts/config';

/**
 * Fetches a fighter's photo URL from Firebase Storage
 * 
 * @param fighterId - The unique ID of the fighter
 * @returns Promise that resolves to the photo download URL or null if not found
 */
export const fetchFighterPhoto = async (fighterId: string): Promise<string | null> => {
  if (!fighterId) {
    console.error('Fighter ID is required to fetch photo');
    return null;
  }

  try {
    const storage = getStorage(app);
    const photoRef = ref(storage, `fighter_photos/${fighterId}.jpg`);
    const downloadUrl = await getDownloadURL(photoRef);
    return downloadUrl;
  } catch (error) {
    // Handle the error when the image doesn't exist
    if ((error as any)?.code === 'storage/object-not-found') {
      console.log(`No photo found for fighter ${fighterId}`);
      return null;
    }
    
    console.error('Error fetching fighter photo:', error);
    return null;
  }
};

/**
 * Example usage:
 * 
 * import { fetchFighterPhoto } from '@/utils/fetchFighterPhoto';
 * 
 * // In a component:
 * const [photoUrl, setPhotoUrl] = useState<string | null>(null);
 * 
 * useEffect(() => {
 *   const loadFighterPhoto = async () => {
 *     const url = await fetchFighterPhoto(fighterId);
 *     if (url) {
 *       setPhotoUrl(url);
 *     }
 *   };
 *   
 *   loadFighterPhoto();
 * }, [fighterId]);
 */