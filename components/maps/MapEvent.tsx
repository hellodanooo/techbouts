import React, { useState, useEffect, memo } from 'react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import axios from 'axios';

const MapEvent: React.FC<{ address?: string }> = ({ address }) => {
  const [viewport, setViewport] = useState({
    latitude: 0,
    longitude: 0,
    zoom: 10
  });
  const [location, setLocation] = useState<{ latitude: number, longitude: number } | null>(null);

  const geocodeAddress = async (address: string) => {
    try {
      const response = await axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}`);
      const { features } = response.data;
      if (features && features.length > 0) {
        const { center } = features[0];
        setLocation({ latitude: center[1], longitude: center[0] });
      } else {
        console.error('No features found in geocoding response:', response.data);
      }
    } catch (error) {
      console.error('Error in geocoding:', error);
    }
  };

  useEffect(() => {
    if (address) {
      geocodeAddress(address);
    }
  }, [address]);

  useEffect(() => {
    if (location) {
      setViewport(prevViewport => ({
        ...prevViewport,
        latitude: location.latitude,
        longitude: location.longitude
      }));
    }
  }, [location]);

  const handleMarkerClick = () => {
    if (address) {
      const googleMapsURL = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`;
      window.open(googleMapsURL, '_blank');
    }
  };

  if (!location && !address) {
    console.log('Location and address are undefined, not rendering MapEvent');
    return null;
  }

  return (
    <div style={{ width: '100%', height: '400px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{ width: '80%', height: '100%', position: 'relative' }}>
        <Map
          {...viewport}
          onMove={evt => setViewport(evt.viewState)}
          mapStyle="mapbox://styles/mapbox/streets-v11"
          mapboxAccessToken={process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN}
          style={{ width: '100%', height: '100%' }}
        >
          {location && (
            <Marker 
              latitude={location.latitude} 
              longitude={location.longitude} 
              onClick={handleMarkerClick}
            />
          )}
        </Map>
      </div>
    </div>
  );
};

export default memo(MapEvent);