// purist-app/components/gymMap.tsx

import React, { useEffect, useState } from 'react';
import { Map, Marker, NavigationControl, Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { ResultsFighter } from '@/utils/types';
import { GeocodeResult, getGeocode } from '../../utils/geocode';
import { FeatureCollection, LineString, GeoJsonProperties, Feature } from 'geojson';


interface GymMapProps {
  fightCardData: ResultsFighter[];
  venueAddress: string;
}

interface GymLocation {
    location: GeocodeResult;
    name: string;
    address: string;
    gym_id: string;
    website: string;
  }

const GymMap: React.FC<GymMapProps> = ({ fightCardData, venueAddress }) => {
  const [gymLocations, setGymLocations] = useState<GymLocation[]>([]);
  const [venueLocation, setVenueLocation] = useState<GeocodeResult | null>(null);
  const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

  console.log("fightCardData", fightCardData);


  const getLogoUrl = (gym_id: string): string => {
    return `https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/gym_logos%2F${gym_id}.png?alt=media`;
  };

  useEffect(() => {
    const fetchLocations = async () => {
      console.log("Map Component: Fetching gym locations");
      console.log("HERE CAN THE Addresses to Map");
      const uniqueGyms = fightCardData.reduce((acc, fighter) => {
        if (fighter.gym_id && fighter.address && fighter.website && !acc.some(gym => gym.gymAddress === fighter.address)) {
          acc.push({
            gymName: fighter.gym,
            gymAddress: fighter.address,
            gymId: fighter.gym_id,
            website: fighter.website
          });
        }
        return acc;
      }, [] as { gymName: string, gymAddress: string, gymId: string, website: string }[]);

      console.log("Addresses being geocoded:");
      const geocodePromises = uniqueGyms.map(async (gym) => {
        console.log(`Geocoding address: ${gym.gymAddress}`);
        const location = await getGeocode(gym.gymAddress);
        return { location, name: gym.gymName, address: gym.gymAddress, gym_id: gym.gymId, website: gym.website };
      });

      const locations = await Promise.all(geocodePromises);
      setGymLocations(locations);

      console.log(`Geocoding venue address: ${venueAddress}`);
      const venueLoc = await getGeocode(venueAddress);
      setVenueLocation(venueLoc);
    };

    fetchLocations();
  }, [fightCardData, venueAddress]);


   const createCurvedLine =(start: [number, number], end: [number, number], segments: number = 100): Feature<LineString, GeoJsonProperties> => {
    const offset = 0.5; // Adjust this value to control the curvature
    const midPoint = [(start[0] + end[0]) / 2, (start[1] + end[1]) / 2];
    const controlPoint = [midPoint[0], midPoint[1] + offset];

    const bezierCurve = (t: number, p0: number[], p1: number[], p2: number[]): number[] => {
      const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t ** 2 * p2[0];
      const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t ** 2 * p2[1];
      return [x, y];
    };

    const points = [];
    for (let i = 0; i <= segments; i++) {
      points.push(bezierCurve(i / segments, start, controlPoint, end));
    }

    return {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: points
      },
      properties: {}
    };
  };


  const lineData: FeatureCollection<LineString, GeoJsonProperties> = {
    type: 'FeatureCollection',
    features: gymLocations.map((gym) => createCurvedLine(
      [gym.location.longitude, gym.location.latitude],
      venueLocation ? [venueLocation.longitude, venueLocation.latitude] : [0, 0]
    ))
  };

  return (
    <Map
      initialViewState={{
        latitude: 38.1000,
        longitude: -121.0000,
        zoom: 6,
      }}
      style={{ marginTop:'30px', width: '80%', height: '400px', border:'1px solid black', borderRadius:'7px' }}
      mapStyle="mapbox://styles/mapbox/streets-v11"
      mapboxAccessToken={mapboxToken}
    >
      <NavigationControl position="top-left" />
      {gymLocations.map((gym, index) => (
       
       <Marker
          key={index}
          latitude={gym.location.latitude}
          longitude={gym.location.longitude}
          anchor="center"
          onClick={() => window.open(gym.website, '_blank')}
        >
          <img src={getLogoUrl(gym.gym_id)} alt="Gym Location" style={{ width: '30px', height: '30px', cursor: 'pointer' }} />
        </Marker>
        
      ))}

      {venueLocation && (

        <Marker latitude={venueLocation.latitude} longitude={venueLocation.longitude} anchor="bottom">
          <img src="/ringIcon.png" alt="Venue Location" style={{ width: '40px', height: '40px'}} />
        </Marker>

      )}

      {venueLocation && (
        <Source id="lineData" type="geojson" data={lineData}>
          <Layer
            id="lineLayer"
            type="line"
            paint={{
              'line-color': '#888',
              'line-width': 2,
            }}
            layout={{
              'line-join': 'round',
              'line-cap': 'round'
            }}
          />
        </Source>
      )}
    </Map>
  );
};

export default GymMap;
