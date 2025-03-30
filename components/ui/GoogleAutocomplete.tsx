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

  const [showManualEntry, setShowManualEntry] = useState(false);
  const [manualTimeoutReached, setManualTimeoutReached] = useState(false);
  const [manualAddress, setManualAddress] = useState({
    street: '',
    city: '',
    state: '',
    zip: '',
  });
  
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

  useEffect(() => {
    const timer = setTimeout(() => {
      if (!ready) setManualTimeoutReached(true);
    }, 5000);
    return () => clearTimeout(timer);
  }, [ready]);

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

  const handleManualSubmit = () => {
    const fullAddress = `${manualAddress.street}, ${manualAddress.city}, ${manualAddress.state} ${manualAddress.zip}`;
    onSelect(fullAddress, { lat: 0, lng: 0 }); // Use dummy coordinates or integrate geocoding here
  };



  return (
    <div className="relative">
      <select
        className="w-full p-2 border rounded mb-2"
        value={country}
        onChange={(e) => setCountry(e.target.value as 'us' | 'mx')}
        disabled={!ready}
      >
        <option value="us">United States</option>
        <option value="mx">Mexico</option>
      </select>

      {!showManualEntry && (
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
      )}

      {manualTimeoutReached && (
        <label className="block mt-2">
          <input
            type="checkbox"
            className="mr-2"
            checked={showManualEntry}
            onChange={(e) => setShowManualEntry(e.target.checked)}
          />
          Enter address manually
        </label>
      )}

      {status === 'OK' && !showManualEntry && (
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

      {status === 'ZERO_RESULTS' && value && (
        <div className="text-gray-500 text-sm mt-1">
          No matching addresses found
        </div>
      )}

      {error && (
        <div className="text-red-500 text-sm mt-1 flex items-center">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {error}
        </div>
      )}

      {isLoading && (
        <div className="text-blue-500 text-sm mt-1 flex items-center">
          <div className="animate-spin h-3 w-3 border-2 border-blue-500 rounded-full border-t-transparent mr-2"></div>
          Processing address...
        </div>
      )}

      {showManualEntry && (
        <div className="mt-4 space-y-2">
          <input
            type="text"
            placeholder="Street"
            className="w-full p-2 border rounded"
            value={manualAddress.street}
            onChange={(e) => setManualAddress({ ...manualAddress, street: e.target.value })}
          />
          <input
            type="text"
            placeholder="City"
            className="w-full p-2 border rounded"
            value={manualAddress.city}
            onChange={(e) => setManualAddress({ ...manualAddress, city: e.target.value })}
          />
          <input
            type="text"
            placeholder="State"
            className="w-full p-2 border rounded"
            value={manualAddress.state}
            onChange={(e) => setManualAddress({ ...manualAddress, state: e.target.value })}
          />
          <input
            type="text"
            placeholder="ZIP Code"
            className="w-full p-2 border rounded"
            value={manualAddress.zip}
            onChange={(e) => setManualAddress({ ...manualAddress, zip: e.target.value })}
          />
          <button
            className="w-full bg-blue-600 text-white py-2 rounded"
            onClick={handleManualSubmit}
          >
            Submit Manual Address
          </button>
        </div>
      )}
    </div>
  );
};

export default GoogleAutocomplete;