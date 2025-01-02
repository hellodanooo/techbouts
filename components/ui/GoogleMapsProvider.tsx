'use client'; // Mark this component as a Client Component

import React from 'react';
import { LoadScript, Libraries } from '@react-google-maps/api';

const libraries: Libraries = ['places']; // Explicitly define type

interface GoogleMapsProviderProps {
  children: React.ReactNode;
}

const GoogleMapsProvider: React.FC<GoogleMapsProviderProps> = ({ children }) => {
  return (
    <LoadScript
      googleMapsApiKey={process.env.NEXT_PUBLIC_PLACES_API_KEY!}
      libraries={libraries}
    >
      {children}
    </LoadScript>
  );
};

export default GoogleMapsProvider;
