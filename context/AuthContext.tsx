// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase_techbouts/config';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isPromoter: boolean;
  isNewUser: boolean;
  promoterId: string | null; // Added promoterId
  isAuthLoading: boolean;
  authError: string | null;
  isInEmbeddedBrowser: boolean;
  signInWithGoogle: () => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
  debugInfo: Record<string, any>;
}

const ADMIN_EMAIL = 'info@nakmuay.foundation';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// Detect if we're in an embedded browser
const isEmbeddedBrowser = (): boolean => {
  if (typeof window === 'undefined') return false;
  
  const userAgent = navigator.userAgent.toLowerCase();
  return (
    userAgent.includes('fban') || // Facebook app
    userAgent.includes('fbav') || // Facebook browser
    userAgent.includes('instagram') ||
    userAgent.includes('linkedin') ||
    userAgent.includes('wv') || // WebView
    (userAgent.includes('facebook') && userAgent.includes('messenger'))
  );
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPromoter, setIsPromoter] = useState(false);
  const [promoterId, setPromoterId] = useState<string | null>(null); // Added state for promoterId
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isInEmbeddedBrowser, setIsInEmbeddedBrowser] = useState(false);
  const [debugInfo, setDebugInfo] = useState<Record<string, any>>({});
  const router = useRouter();

  // Debug logging helper
  const logDebug = (message: string, data?: any) => {
    const timestamp = Date.now().toString();
    console.log(`[AUTH] ${message}`, data || '');
    setDebugInfo(prev => ({
      ...prev,
      [timestamp]: { message, data }
    }));
  };

  // Check if email exists in promoters using the API
  const checkPromoterStatus = async (email: string) => {
    try {
      logDebug('Checking promoter status for email:', email);

      const response = await fetch('/api/promoters');
      if (!response.ok) {
        throw new Error('Failed to fetch promoters');
      }

      const data = await response.json();
      logDebug('Promoters data from API:', data);

      if (data.promoters) {
        // Log all promoter emails for comparison
        const promoterEmails = data.promoters.map((p: any) => p.email.toLowerCase());
        logDebug('All promoter emails:', promoterEmails);

        // Find the promoter with the matching email
        const matchingPromoter = data.promoters.find(
          (promoter: any) => promoter.email.toLowerCase() === email.toLowerCase()
        );

        if (matchingPromoter) {
          logDebug('Found matching promoter:', matchingPromoter);
          // Set the promoterId if found
          setPromoterId(matchingPromoter.id || null);
          return true;
        }

        logDebug('No matching promoter found');
        setPromoterId(null);
        return false;
      }

      logDebug('No promoters data found');
      setPromoterId(null);
      return false;
    } catch (error) {
      console.error('Error checking promoter status:', error);
      logDebug('Error checking promoter status:', error);
      setPromoterId(null);
      return false;
    }
  };

  // Check for embedded browser and handle redirect results
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const embedded = isEmbeddedBrowser();
      setIsInEmbeddedBrowser(embedded);
      logDebug('Browser check', { isEmbeddedBrowser: embedded, userAgent: navigator.userAgent });
      
      // Check for redirect result
      const handleRedirectResult = async () => {
        try {
          logDebug('Checking for redirect result');
          const result = await getRedirectResult(auth);
          if (result?.user) {
            logDebug('Successfully signed in after redirect', { email: result.user.email });
          }
        } catch (error) {
          console.error('Error processing redirect result:', error);
          logDebug('Error processing redirect result', error);
          setAuthError('Authentication failed after redirect. Please try again.');
        }
      };
      
      handleRedirectResult();
    }
  }, []);

  // Main auth state listener
  useEffect(() => {
    logDebug('Setting up auth state listener');
    
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      logDebug('Auth state changed', { user: currentUser?.email || 'null' });
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser?.email) {
        const email = currentUser.email.toLowerCase();
        logDebug('Current user email:', email);

        // Check admin status
        const adminStatus = email === ADMIN_EMAIL;
        setIsAdmin(adminStatus);
        logDebug('Is admin:', adminStatus);

        // Check promoter status
        if (!adminStatus) {
          const promoterStatus = await checkPromoterStatus(email);
          setIsPromoter(promoterStatus);
          logDebug('Setting isPromoter to:', promoterStatus);
        } else {
          setIsPromoter(false);
          setPromoterId(null);
        }
      } else {
        setIsAdmin(false);
        setIsPromoter(false);
        setPromoterId(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      setIsAuthLoading(true);
      setAuthError(null);
      
      logDebug('Starting Google sign-in process', { isEmbeddedBrowser: isInEmbeddedBrowser });
      
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      
      // Important: Always use the original popup method first since it's working
      // Only fall back to redirect if we get an error specific to embedded browsers
      logDebug('Using popup for authentication');
      try {
        const result = await signInWithPopup(auth, provider);
        logDebug('Popup auth successful', { email: result.user.email });
        return { user: result.user };
      } catch (popupError: any) {
        // Check if this is an embedded browser error
        if (
          isInEmbeddedBrowser && 
          (popupError.code === 'auth/popup-blocked' || 
           popupError.code === 'auth/cancelled-popup-request' ||
           popupError.code === 'auth/popup-closed-by-user' ||
           popupError.message?.includes('disallowed_useragent'))
        ) {
          logDebug('Popup blocked in embedded browser, trying redirect', popupError);
          await signInWithRedirect(auth, provider);
          return { user: null };
        } else {
          // Re-throw for other errors
          throw popupError;
        }
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      logDebug('Google sign-in error', error);
      setAuthError('Authentication failed. Please try again.');
      return { user: null };
    } finally {
      // Don't set loading to false if we're redirecting
      if (typeof window !== 'undefined' && window.location.href === window.location.href) {
        setIsAuthLoading(false);
      }
    }
  };

  const signOut = async () => {
    try {
      logDebug('Signing out');
      setIsAuthLoading(true);
      await firebaseSignOut(auth);
      setIsAdmin(false);
      setIsPromoter(false);
      setPromoterId(null);
      logDebug('Sign out successful');
    } catch (error) {
      console.error('Sign out error:', error);
      logDebug('Sign out error', error);
    } finally {
      setIsAuthLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin,
      isPromoter,
      isNewUser: !(isAdmin || isPromoter),
      promoterId, // Added promoterId to the context
      isAuthLoading,
      authError,
      isInEmbeddedBrowser,
      signInWithGoogle,
      signOut,
      debugInfo
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);