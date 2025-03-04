// components/ui/GoogleAuthButton.tsx
'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { FaGooglePlusG } from "react-icons/fa6";
import { ExternalLink, AlertTriangle, Copy } from 'lucide-react';

export default function GoogleAuthButton() {
  const { signInWithGoogle, isAuthLoading, authError, isInEmbeddedBrowser } = useAuth();
  const [showCopyOption, setShowCopyOption] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleGoogleSignIn = async () => {
    try {
      await signInWithGoogle();
      // No need to handle success here as the auth state will be updated
    } catch (error) {
      console.error('Error in Google sign-in button handler:', error);
      // Error is already handled in the auth context
    }
  };

  const copyToClipboard = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href)
        .then(() => {
          setCopySuccess(true);
          setTimeout(() => setCopySuccess(false), 3000);
        })
        .catch(err => {
          console.error('Failed to copy URL:', err);
        });
    }
  };

  return (
    <div className="w-full space-y-4">
      {isInEmbeddedBrowser && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg shadow-sm">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="font-medium text-amber-800 text-sm">Youre using an embedded browser</h3>
              <p className="mt-1 text-xs text-amber-700">
                Google sign-in may not work properly in Facebook Messenger and other app browsers.
                For the best experience, copy the URL and open in your devices browser.
              </p>
              <button 
                onClick={() => setShowCopyOption(!showCopyOption)}
                className="mt-2 text-xs font-medium text-amber-600 hover:text-amber-800"
              >
                {showCopyOption ? "Hide copy option" : "Show copy option"}
              </button>
            </div>
          </div>
          
          {showCopyOption && (
            <div className="mt-3 flex items-center gap-2 p-2 bg-white rounded border border-amber-200">
              <input
                type="text"
                value={typeof window !== 'undefined' ? window.location.href : ''}
                readOnly
                className="flex-1 text-xs p-1 bg-gray-50 border border-gray-200 rounded"
              />
              <button
                onClick={copyToClipboard}
                className="p-1.5 bg-amber-100 rounded hover:bg-amber-200 transition-colors"
                title="Copy URL"
              >
                <Copy size={16} className="text-amber-700" />
              </button>
              
              {copySuccess && (
                <span className="text-xs text-green-600 animate-fade-in">Copied!</span>
              )}
            </div>
          )}
        </div>
      )}
      
      {authError && (
        <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-600">
          {authError}
        </div>
      )}
      
      <button
        onClick={handleGoogleSignIn}
        disabled={isAuthLoading}
        className="flex items-center justify-center gap-2 w-full px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {isAuthLoading ? (
          <div className="w-5 h-5 border-t-2 border-b-2 border-gray-900 rounded-full animate-spin" />
        ) : (
          <FaGooglePlusG className="text-xl" />
        )}
        <span>{isAuthLoading ? 'Signing in...' : 'Sign in with Google'}</span>
      </button>
      
      {isInEmbeddedBrowser && (
        <div className="flex justify-center">
          <a 
            href={typeof window !== 'undefined' ? window.location.href : ''}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
          >
            <ExternalLink size={12} />
            <span>Open in browser</span>
          </a>
        </div>
      )}
    </div>
  );
}