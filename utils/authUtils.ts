import { getDatabase, ref, get } from 'firebase/database';

/**
 * Check if a user is authorized as a promoter.
 * @param promoterId - ID of the promoter
 * @param userEmail - Email of the logged-in user
 * @returns {Promise<boolean>} - Returns true if the user is authorized, false otherwise
 */
export const checkAuthorization = async (
  promoterId: string,
  userEmail: string | null
): Promise<boolean> => {
  if (!userEmail) return false;

  try {
    const db = getDatabase();
    const promoterRef = ref(db, `promoters/${promoterId}/authorizedEmails`);
    const snapshot = await get(promoterRef);

    if (snapshot.exists()) {
      const authorizedEmails = snapshot.val();
      const isAuthorizedUser =
        Array.isArray(authorizedEmails) &&
        authorizedEmails.some(
          (email) => email.toLowerCase() === userEmail.toLowerCase()
        );

      return isAuthorizedUser;
    }
  } catch (error) {
    console.error('Error checking authorization:', error);
  }

  return false;
};
