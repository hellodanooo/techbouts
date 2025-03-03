// utils/calculateDistance.ts
import axios from 'axios';

interface DistanceResponse {
  data: number[];
}

export const calculateDistance = async (origins: string[], destination: string): Promise<number[]> => {
  // Input validation
  if (!origins || origins.length === 0) {
    console.error('No origins provided');
    return [];
  }

  if (!destination) {
    console.error('No destination provided');
    return Array(origins.length).fill(-1);
  }

  // Clean and validate addresses
  const cleanedOrigins = origins.map(origin => 
    origin ? origin.trim().replace(/\s+/g, ' ') : ''
  ).filter(origin => origin !== '');

  const cleanedDestination = destination.trim().replace(/\s+/g, ' ');

  if (cleanedOrigins.length === 0 || !cleanedDestination) {
    console.error('Invalid addresses after cleaning');
    return Array(origins.length).fill(-1);
  }

  try {
    // Build URL with proper encoding
    const queryParams = new URLSearchParams({
      origins: cleanedOrigins.join('|'),
      destination: cleanedDestination
    });

    const url = `/api/distance?${queryParams.toString()}`;
    
    // Make request with timeout and retry logic
    const response = await axios.get<DistanceResponse>(url, {
      timeout: 10000, // 10 second timeout
      headers: {
        'Accept': 'application/json'
      }
    });

    if (response.data && Array.isArray(response.data)) {
      return response.data;
    }

    throw new Error('Invalid response format');

  } catch (error) {
    if (axios.isAxiosError(error)) {
      console.error('Distance calculation failed:', {
        status: error.response?.status,
        message: error.message,
        data: error.response?.data
      });

      // Return array of -1 values with same length as origins array
      return Array(origins.length).fill(-1);
    }

    console.error('Unexpected error during distance calculation:', error);
    return Array(origins.length).fill(-1);
  }
};