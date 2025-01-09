// purist-app/utils/geocode.ts

export interface GeocodeResult {
    latitude: number;
    longitude: number;
  }
  
  export const getGeocode = async (address: string): Promise<GeocodeResult> => {
    const mapboxToken = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;
    const response = await fetch(
      `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?access_token=${mapboxToken}`
    );
    const data = await response.json();
    const result = data.features[0];
  
    if (!result) {
      console.error(`Geocoding failed for address: ${address}`);
      throw new Error(`Geocoding failed for address: ${address}`);
    }
  
    return {
      latitude: result.center[1],
      longitude: result.center[0],
    };
  };