// context/AuthContext.tsx
'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  AuthError
} from 'firebase/auth';
import { auth } from '../lib/firebase_techbouts/config';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isPromoter: boolean;
  isAdmin: boolean;
  checkUserAuthorization: () => Promise<void>;
  signInWithGoogle: () => Promise<{ user: User | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

const fetchPMTPromoters = async () => {
  try {
    const response = await fetch('/api/pmt/promoters');
    const data = await response.json();
    if (data.promoters) {
      return data.promoters.map((promoter: any) => promoter.email).filter(Boolean);
    }
    return [];
  } catch (error) {
    console.error('Error fetching PMT promoters:', error);
    return [];
  }
};

export const AuthProvider = ({ 
  children,
  pmtPromoters = [],
  ikfPromoters = []
}: { 
  children: React.ReactNode;
  pmtPromoters?: any[];
  ikfPromoters?: any[];
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isPromoter, setIsPromoter] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [pmtPromoterEmails, setPmtPromoterEmails] = useState<string[]>([]);

  const router = useRouter();

  useEffect(() => {
    const loadPromoters = async () => {
      const emails = await fetchPMTPromoters();
      setPmtPromoterEmails(emails);
    };
    loadPromoters();
  }, []);

  const checkUserAuthorization = async () => {
    if (!user?.email) {
      setIsPromoter(false);
      setIsAdmin(false);
      return;
    }

    const userEmail = user.email.toLowerCase();
    const isAdminEmail = userEmail === 'info@nakmuay.foundation';
    
    if (isAdminEmail) {
      setIsAdmin(true);
      return;
    }

    const isPMTPromoter = pmtPromoterEmails.includes(userEmail);
    setIsPromoter(isPMTPromoter);
  };

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    checkUserAuthorization();
  }, [user, pmtPromoterEmails]);

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
      setIsPromoter(false);
      setIsAdmin(false);
      router.push('/');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      isPromoter,
      isAdmin,
      checkUserAuthorization,
      signInWithGoogle,
      signOut 
    }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);