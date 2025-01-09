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
  console.log('Starting authorization check:', {
    providedPromoterId: promoterId,
    providedUserEmail: userEmail,
  });

  if (!userEmail) {
    console.log('No user email provided, returning false');
    return false;
  }

  try {
    const db = getDatabase();
    const promotersRef = ref(db, 'promoters');
    const snapshot = await get(promotersRef);

    if (snapshot.exists()) {
      const promoters = snapshot.val();
      console.log('Found promoters in database:', promoters);

      const promoter = promoters.find((p: any) => {
        const idMatch = p.promoterId === promoterId;
        const emailMatch = p.email.toLowerCase() === userEmail.toLowerCase();

        console.log('Checking promoter:', {
          promoterId: p.promoterId,
          promoterEmail: p.email,
          idMatches: idMatch,
          emailMatches: emailMatch,
        });

        return idMatch && emailMatch;
      });

      console.log('Authorization result:', {
        isAuthorized: !!promoter,
        matchedPromoter: promoter || 'No match found',
      });

      return !!promoter;
    } else {
      console.log('No promoters found in database');
    }
  } catch (error) {
    console.error('Error checking authorization:', error);

    if (error instanceof Error) {
      console.log('Error details:', {
        message: error.message,
        code: 'code' in error ? (error as { code?: string }).code : 'N/A',
      });
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
      console.log('Custom error details:', {
        message: (error as { message: string }).message,
        code: 'code' in error ? (error as { code?: string }).code : 'N/A',
      });
    } else {
      console.log('Unknown error format:', error);
    }
  }

  return false;
};







export const checkDashboardAuthorization = (
  promoterEmail: string,
  userEmail: string | null
): boolean => {
  console.log('Checking dashboard authorization:', {
    promoterEmail,
    userEmail
  });

  if (!userEmail || !promoterEmail) {
    console.log('Missing email(s), authorization failed', {
      hasUserEmail: !!userEmail,
      hasPromoterEmail: !!promoterEmail
    });
    return false;
  }

  const isAuthorized = promoterEmail.toLowerCase() === userEmail.toLowerCase();
  
  console.log('Dashboard authorization result:', {
    isAuthorized,
    promoterEmail,
    userEmail
  });

  return isAuthorized;
};