// app/api/distance/route.ts
import { NextRequest, NextResponse } from 'next/server';
import axios from 'axios';

const GOOGLE_MAPS_API_KEY = 'AIzaSyCII2u3yYqXU5MTd6ZITybYpi-zllVpN2U';

interface DistanceMatrixResponse {
  status: string;
  rows: {
    elements: {
      status: string;
      distance?: {
        value: number;
      };
    }[];
  }[];
}

const calculateDistance = async (origins: string[], destination: string): Promise<number[]> => {
  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=imperial&origins=${encodeURIComponent(origins.join('|'))}&destinations=${encodeURIComponent(destination)}&key=${GOOGLE_MAPS_API_KEY}`;

  try {
    const response = await axios.get<DistanceMatrixResponse>(url);
    console.log('Distance API Response:', response.data);  // Log to see the actual API response
    
    if (response.data.status === 'OK') {
      return response.data.rows.map((row) => {
        const element = row.elements[0];
        if (element.status === 'OK' && element.distance) {
          return element.distance.value / 1609.34; // Convert meters to miles
        } else {
          return -1; // Indicate that the distance couldn't be calculated
        }
      });
    } else {
      throw new Error('Error fetching distance data');
    }
  } catch (error) {
    console.error('Error calculating distance:', error);
    throw error;
  }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const origins = searchParams.getAll('origins');
  const destination = searchParams.get('destination');

  if (!origins.length || !destination) {
    return NextResponse.json(
      { error: 'Origins and destination are required' },
      { status: 400 }
    );
  }

  try {
    const distances = await calculateDistance(origins, destination);
    return NextResponse.json(distances);
  } catch (error) {
    console.error('Failed to calculate distances:', error);
    return NextResponse.json(
      { error: 'Failed to calculate distances' },
      { status: 500 }
    );
  }
}