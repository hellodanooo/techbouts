import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '@/lib/firebase_techbouts/config';

/**
 * Uploads an event flyer image to Firebase Storage and returns the download URL.
 * @param file The image file to upload.
 * @param imageName The unique event ID to use in the storage path.
 * @returns The download URL of the uploaded image.
 */
export const uploadEmailImage = async (file: File, imageName: string): Promise<string> => {
  try {
    const storage = getStorage(app);
    const flyerRef = ref(storage, `email_images/${imageName}.png`);
    
    // Upload the file
    await uploadBytes(flyerRef, file);
    
    // Get the download URL
    const downloadURL = await getDownloadURL(flyerRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading event flyer:', error);
    throw new Error('Failed to upload event flyer');
  }
};
