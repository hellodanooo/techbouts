'use client';

import React, { useState } from 'react';
import usePlacesAutocomplete, { getGeocode, getLatLng } from 'use-places-autocomplete';

interface GoogleAutocompleteProps {
  onSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
}

const GoogleAutocomplete: React.FC<GoogleAutocompleteProps> = ({ onSelect }) => {
  const [error, setError] = useState<string | null>(null);
  const [country, setCountry] = useState<'us' | 'mx'>('us'); // Default to US

  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['address'],
      componentRestrictions: { country }, // Dynamically restrict search to selected country
    },
    debounce: 300,
  });

  const handleSelect = async (description: string) => {
    try {
      setValue(description, false);
      clearSuggestions();
  
      const results = await getGeocode({ address: description });
      const { lat, lng } = await getLatLng(results[0]);
  
      onSelect(description, { lat, lng });
    } catch (error) {
      console.error("Error selecting place:", error);
      setError("Error selecting location. Please try again.");
    }
  };

  return (
    <div className="relative">
      {/* Country Selector */}
      <select
        className="w-full p-2 border rounded mb-2"
        value={country}
        onChange={(e) => setCountry(e.target.value as 'us' | 'mx')}
      >
        <option value="us">United States</option>
        <option value="mx">Mexico</option>
      </select>

      {/* Address Input */}
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        disabled={!ready}
        placeholder={`Search address in ${country === 'us' ? 'United States' : 'Mexico'}`}
        className="w-full p-2 border rounded"
      />

      {/* Suggestions Dropdown */}
      {status === 'OK' && (
        <ul className="absolute z-10 border rounded bg-white w-full max-h-40 overflow-y-auto">
          {data.map(({ place_id, description }) => (
            <li
              key={place_id}
              className="p-2 cursor-pointer hover:bg-gray-200"
              onClick={() => handleSelect(description)}
            >
              {description}
            </li>
          ))}
        </ul>
      )}

      {/* Error Message */}
      {error && <div className="text-red-500 text-sm mt-1">{error}</div>}
    </div>
  );
};

export default GoogleAutocomplete;
