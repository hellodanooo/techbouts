'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut as firebaseSignOut,
  AuthError
} from 'firebase/auth';
import { auth } from '../lib/firebase/config';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const getAuthErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact the administrator.';
    case 'auth/popup-closed-by-user':
      return 'Sign-in popup was closed before completion.';
    case 'auth/cancelled-popup-request':
      return 'Another sign-in popup is already open.';
    case 'auth/invalid-email':
      return 'The email address is invalid.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/user-not-found':
      return 'No account found with this email.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    case 'auth/too-many-requests':
      return 'Too many unsuccessful attempts. Please try again later.';
    default:
      return 'An error occurred during authentication. Please try again.';
  }
};

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error('Sign in error:', error);
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
    
      const result = await signInWithPopup(auth, provider);
      console.log('Google Login Success:', result.user);
    } catch (error) {
      const err = error as AuthError; // Explicitly cast error to AuthError
      console.error('Google sign-in error:', err);
      console.log('Error Code:', err.code); // Logs the error code
      console.log('Error Message:', err.message); // Logs the error message
      throw new Error(getAuthErrorMessage(err)); // Pass the casted error
    }
  };
  
  

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      router.push('/auth/login');
    } catch (error) {
      console.error('Sign out error:', error);
      throw new Error(getAuthErrorMessage(error as AuthError));
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signInWithGoogle, signOut }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);