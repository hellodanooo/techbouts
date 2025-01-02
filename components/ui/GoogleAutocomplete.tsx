'use client';

import React, { useState } from 'react';
import usePlacesAutocomplete, {
  getGeocode,
  getLatLng,
} from 'use-places-autocomplete';

interface GoogleAutocompleteProps {
  onSelect: (address: string, coordinates: { lat: number; lng: number }) => void;
}

const GoogleAutocomplete: React.FC<GoogleAutocompleteProps> = ({ onSelect }) => {
  const [error, setError] = useState<string | null>(null);
  
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete({
    requestOptions: {
      types: ['address'],
      componentRestrictions: { country: 'us' }
    },
    debounce: 300,
  });

  const handleSelect = async (description: string) => {
    try {
      setValue(description, false);
      clearSuggestions();

      // First try to get coordinates using getGeocode
      try {
        const results = await getGeocode({ address: description });
        const { lat, lng } = await getLatLng(results[0]);
        setError(null);
        onSelect(description, { lat, lng });
      } catch (geocodeError) {
        console.error('Geocode error:', geocodeError);
        // If geocoding fails, try to get coordinates from Places API directly
        const placesService = new google.maps.places.PlacesService(
          document.createElement('div')
        );

        placesService.findPlaceFromQuery(
          {
            query: description,
            fields: ['formatted_address', 'geometry']
          },
          (results, status) => {
            if (status === google.maps.places.PlacesServiceStatus.OK && results?.[0]) {
              const place = results[0];
              if (place.geometry?.location) {
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                setError(null);
                onSelect(description, { lat, lng });
              } else {
                setError('Could not determine location coordinates');
              }
            } else {
              setError('Could not find location details');
            }
          }
        );
      }
    } catch (error) {
      console.error('Error selecting place:', error);
      setError('Error selecting location. Please try again.');
    }
  };

  return (
    <div className="relative">
      <input
        type="text"
        value={value}
        onChange={(e) => {
          setValue(e.target.value);
          setError(null);
        }}
        disabled={!ready}
        placeholder="Search address"
        className="w-full p-2 border rounded"
      />
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
      {error && (
        <div className="text-red-500 text-sm mt-1">
          {error}
        </div>
      )}
    </div>
  );
};

export default GoogleAutocomplete;