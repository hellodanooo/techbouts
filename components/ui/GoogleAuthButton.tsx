// components/ui/GoogleAuthButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaGooglePlusG } from "react-icons/fa6";


export default function GoogleAuthButton() {
  const { signInWithGoogle } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      const { user } = await signInWithGoogle();
      if (user) {
        console.log('Successfully signed in with Google');
      }
    } catch (error) {
      console.error('Error signing in with Google:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleGoogleSignIn}
      disabled={isLoading}
      className="flex items-center justify-center gap-2 w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
    >
      {isLoading ? (
        <div className="w-5 h-5 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin" />
      ) : (
        <FaGooglePlusG />
      )}
      <span>{isLoading ? 'Signing in...' : 'Sign in with Google'}</span>
    </button>
  );
}