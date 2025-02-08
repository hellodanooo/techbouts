// context/MultiFirebaseContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, Auth } from 'firebase/auth';
import { getDatabase, ref, get } from 'firebase/database';
import { auth as techboutsAuth } from '@/lib/firebase_techbouts/config';
import { auth as pmtAuth } from '@/lib/firebase_pmt/config';

interface FirebaseUser {
  techbouts: User | null;
  pmt: User | null;
}

interface AuthState {
  isAdmin: boolean;
  isPromoter: boolean;
  authorizedPromoterId: string | null;
}

interface MultiFirebaseContextType {
  user: FirebaseUser;
  loading: boolean;
  authState: AuthState;
  techboutsAuth: Auth;
  pmtAuth: Auth;
  checkPromoterAuthorization: (promoterId: string) => Promise<boolean>;
  checkDashboardAccess: (promoterEmail: string) => boolean;
  refreshAuthState: () => Promise<void>;
}

const MultiFirebaseContext = createContext<MultiFirebaseContextType>({} as MultiFirebaseContextType);

export function MultiFirebaseProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<FirebaseUser>({ techbouts: null, pmt: null });
  const [loading, setLoading] = useState(true);
  const [authState, setAuthState] = useState<AuthState>({
    isAdmin: false,
    isPromoter: false,
    authorizedPromoterId: null
  });

  const checkPromoterAuthorization = async (promoterId: string): Promise<boolean> => {
    const userEmail = user.techbouts?.email || '';
    
    if (!userEmail) return false;
  
    try {
      const db = getDatabase();
      const promotersRef = ref(db, 'promoters');
      const snapshot = await get(promotersRef);
  
      if (snapshot.exists()) {
        const promoters = snapshot.val();
        const promoter = promoters.find((p: any) => 
          p.promoterId === promoterId && 
          p.email.toLowerCase() === userEmail.toLowerCase()
        );
  
        // Return the result without setting state
        return !!promoter;
      }
    } catch (error) {
      console.error('Error checking promoter authorization:', error);
    }
  
    return false;
  };


  const checkDashboardAccess = (promoterEmail: string): boolean => {
    const userEmail = user.techbouts?.email;
    if (!userEmail || !promoterEmail) return false;
    return promoterEmail.toLowerCase() === userEmail.toLowerCase();
  };

  const refreshAuthState = async () => {
    // This function now just triggers a re-render which will cause the useEffect above to run
    setUser(prev => ({ ...prev }));
  };

  useEffect(() => {
    const updateAuthState = async () => {
      const userEmail = user.techbouts?.email;
      
      if (!userEmail) {
        setAuthState({
          isAdmin: false,
          isPromoter: false,
          authorizedPromoterId: null
        });
        return;
      }
    
      // Check admin status
      const isAdmin = userEmail.toLowerCase() === 'info@nakmuay.foundation';
      
      // If there's a stored promoterId, verify it's still valid
      const currentPromoterId = authState.authorizedPromoterId;
      let isStillAuthorized = false;
      
      if (currentPromoterId) {
        isStillAuthorized = await checkPromoterAuthorization(currentPromoterId);
      }
    
      setAuthState({
        isAdmin,
        isPromoter: isStillAuthorized,
        authorizedPromoterId: isStillAuthorized ? currentPromoterId : null
      });
    };

    updateAuthState();
  }, [user.techbouts?.email]);

  useEffect(() => {
    const unsubscribeTechbouts = techboutsAuth.onAuthStateChanged((techboutsUser) => {
      setUser(prev => ({ ...prev, techbouts: techboutsUser }));
    });
  
    const unsubscribePmt = pmtAuth.onAuthStateChanged((pmtUser) => {
      setUser(prev => ({ ...prev, pmt: pmtUser }));
      setLoading(false);
    });
  
    return () => {
      unsubscribeTechbouts();
      unsubscribePmt();
    };
  }, []);

  return (
    <MultiFirebaseContext.Provider value={{ 
      user, 
      loading,
      authState,
      techboutsAuth,
      pmtAuth,
      checkPromoterAuthorization,
      checkDashboardAccess,
      refreshAuthState
    }}>
      {!loading && children}
    </MultiFirebaseContext.Provider>
  );
}

// Custom hook for easy access
export const useMultiFirebase = () => useContext(MultiFirebaseContext);