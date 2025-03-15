'use client';

import React, { useState, useEffect } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface GoogleAutocompleteProps {
  onSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
}

const GoogleAutocomplete: React.FC<GoogleAutocompleteProps> = ({ onSelect }) => {
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<'us' | 'mx'>('us'); // Default to US
  const [isLoading, setIsLoading] = useState(false);
  
  // Check if Google Maps API is available
  const googleAvailable = typeof window !== 'undefined' && 
                           !!window.google && 
                           !!window.google.maps;

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['address'],
      componentRestrictions: { country },
    },
    debounce: 300,
    cache: 86400, // Cache for 1 day
  });

  // Log the ready state for debugging
  useEffect(() => {
    console.log("Places Autocomplete ready state:", ready);
    console.log("Google Maps available:", googleAvailable);
  }, [ready, googleAvailable]);

  const handleSelect = async (description: string) => {
    try {
      setIsLoading(true);
      setValue(description, false);
      clearSuggestions();
  
      const results = await getGeocode({ address: description });
      if (!results || results.length === 0) {
        throw new Error("No geocoding results found");
      }
      
      const { lat, lng } = await getLatLng(results[0]);
  
      onSelect(description, { lat, lng });
      setIsLoading(false);
    } catch (error) {
      console.error("Error selecting place:", error);
      setError("Error selecting location. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <div className="relative">
      {/* Country Selector */}
      <select
        className="w-full p-2 border rounded mb-2"
        value={country}
        onChange={(e) => setCountry(e.target.value as 'us' | 'mx')}
        disabled={!ready}
      >
        <option value="us">United States</option>
        <option value="mx">Mexico</option>
      </select>

      {/* Address Input */}
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            setError(null);
          }}
          disabled={!ready}
          placeholder={ready 
            ? `Search address in ${country === 'us' ? 'United States' : 'Mexico'}`
            : "Loading Google Maps..."}
          className={`w-full p-2 border rounded ${!ready ? 'bg-gray-100 cursor-not-allowed' : ''}`}
          aria-label="Address search"
        />
        
        {!ready && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="animate-spin h-4 w-4 border-2 border-gray-500 rounded-full border-t-transparent"></div>
          </div>
        )}
      </div>

      {/* API Status Indicator */}
      {!ready && (
        <div className="text-yellow-600 text-sm mt-1 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          Waiting for Google Maps to load...
        </div>
      )}

      {/* Suggestions Dropdown */}
      {status === 'OK' && (
        <ul className="absolute z-10 border rounded bg-white w-full max-h-60 overflow-y-auto shadow-md">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="p-2 cursor-pointer hover:bg-gray-100 text-sm"
              onClick={() => handleSelect(description)}
            >
              {description}
            </li>
          ))}
        </ul>
      )}

      {/* No results message */}
      {status === 'ZERO_RESULTS' && value && (
        <div className="text-gray-500 text-sm mt-1">
          No matching addresses found
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="text-red-500 text-sm mt-1 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}
      
      {/* Loading indicator */}
      {isLoading && (
        <div className="text-blue-500 text-sm mt-1 flex items-center">
          <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          Processing address...
        </div>
      )}
    </div>
  );
};

export default GoogleAutocomplete;