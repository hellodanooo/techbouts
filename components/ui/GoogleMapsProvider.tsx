'use client'; // Mark this component as a Client Component

import React, { useState, useEffect } from 'react';
import { LoadScript, Libraries } from '@react-google-maps/api';

const libraries: Libraries = ['places']; // Explicitly define type

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

// Create a global variable to track if the script is loaded
let isScriptLoaded = false;

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  const [scriptLoaded, setScriptLoaded] = useState(isScriptLoaded);
  
  useEffect(() => {
    // Update the state based on the global variable
    setScriptLoaded(isScriptLoaded);
    
    // If component unmounts, don't reset the global flag
    // We want to keep track that the script was loaded
    return () => {};
  }, []);
  
  // Handle successful loading
  const handleLoad = () => {
    console.log('Google Maps script loaded successfully');
    isScriptLoaded = true;
  };
  
  // Handle loading failure
  const handleError = () => {
    console.error('Google Maps script failed to load');
    isScriptLoaded = false;
  };

  // If the script is already loaded, just render children
  if (scriptLoaded) {
    return <>{children}</>;
  }

  // Otherwise, load the script
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_PLACES_API_KEY_TECHBOUTS!}
      libraries={libraries}
      onLoad={handleLoad}
      onError={handleError}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;