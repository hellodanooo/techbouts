// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase_techbouts/config';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  isAdmin: boolean;
  isPromoter: boolean;
  isNewUser: boolean;
  signInWithGoogle: () => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
}

const ADMIN_EMAIL = 'info@nakmuay.foundation';

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isPromoter, setIsPromoter] = useState(false);
  const router = useRouter();

  // Check if email exists in promoters using the API
  const checkPromoterStatus = async (email: string) => {
    try {
      console.log('Checking promoter status for email:', email);

      const response = await fetch('/api/promoters');
      if (!response.ok) {
        throw new Error('Failed to fetch promoters');
      }

      const data = await response.json();
      console.log('Promoters data from API:', data);

      if (data.promoters) {
        // Log all promoter emails for comparison
        const promoterEmails = data.promoters.map((p: any) => p.email.toLowerCase());
        console.log('All promoter emails:', promoterEmails);

        const isPromoter = data.promoters.some(
          (promoter: any) => promoter.email.toLowerCase() === email.toLowerCase()
        );

        console.log('Is promoter result:', isPromoter);
        return isPromoter;
      }

      console.log('No promoters data found');
      return false;
    } catch (error) {
      console.error('Error checking promoter status:', error);
      return false;
    }
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      setUser(currentUser);

      if (currentUser?.email) {
        const email = currentUser.email.toLowerCase();
        console.log('Current user email:', email);

        // Check admin status
        const adminStatus = email === ADMIN_EMAIL;
        setIsAdmin(adminStatus);
        console.log('Is admin:', adminStatus);

        // Check promoter status
        if (!adminStatus) {
          const promoterStatus = await checkPromoterStatus(email);
          setIsPromoter(promoterStatus);
          console.log('Setting isPromoter to:', promoterStatus);
        } else {
          setIsPromoter(false);
        }
      } else {
        setIsAdmin(false);
        setIsPromoter(false);
      }

    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const result = await signInWithPopup(auth, provider);
      return { user: result.user };
    } catch (error) {
      console.error('Google sign-in error:', error);
      return { user: null };
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setIsAdmin(false);
      setIsPromoter(false);

    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      isAdmin,
      isPromoter,
      isNewUser: !(isAdmin || isPromoter),
      signInWithGoogle,
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);