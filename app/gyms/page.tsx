'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Map, { Marker } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN;

type GymData = {
  win?: number;
  loss?: number;
  address?: {
    latitude?: number;
    longitude?: number;
  };
  [key: string]: unknown;
};

const GymMarker = () => (
  <div className="w-6 h-6 bg-red-500 rounded-full border-2 border-white shadow-lg flex items-center justify-center">
    <div className="w-2 h-2 bg-white rounded-full"></div>
  </div>
);

const GymsPage: React.FC = () => {
  const [gyms, setGyms] = useState<Record<string, GymData>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGyms = async () => {
      try {
        const response = await fetch('/api/gyms');
        const data = await response.json();
        if (data.success) {
          setGyms(data.gyms);
        } else {
          setError('Failed to load gym data');
        }
      } catch (error) {
        setError('Error connecting to the server');
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchGyms();
  }, []);

  const filteredGyms = Object.entries(gyms).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const sortedGyms = [...filteredGyms].sort((a, b) => (b[1].win || 0) - (a[1].win || 0));

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center text-red-500">
        {error}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Muay Thai Gyms</h1>
          <div className="max-w-xl mx-auto">
            <div className="relative">
              <input
                type="text"
                placeholder="Search gyms..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              />
              <Search className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Gym List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {sortedGyms.map(([gymName, data]) => (
            <div
              key={gymName}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden"
            >
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 truncate">{gymName}</h2>
                {/* Map */}
                {data.address?.latitude && data.address?.longitude && (
                  <div className="mb-4 h-48 rounded-lg overflow-hidden">
                    <Map
                      mapboxAccessToken={MAPBOX_TOKEN}
                      initialViewState={{
                        longitude: data.address.longitude,
                        latitude: data.address.latitude,
                        zoom: 13,
                      }}
                      style={{ width: '100%', height: '100%' }}
                      mapStyle="mapbox://styles/mapbox/streets-v11"
                    >
                      <Marker longitude={data.address.longitude} latitude={data.address.latitude}>
                        <GymMarker />
                      </Marker>
                    </Map>
                  </div>
                )}
                {/* Stats */}
                <div className="flex justify-between items-center">
                  <div className="flex gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Wins</p>
                      <p className="text-lg font-bold text-green-600">{data.win || 0}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Losses</p>
                      <p className="text-lg font-bold text-red-600">{data.loss || 0}</p>
                    </div>
                  </div>
                  <div className="bg-gray-100 px-3 py-1 rounded-full">
                  <p className="text-sm font-medium">
      {(
        ((data.win ?? 0) / ((data.win ?? 0) + (data.loss ?? 0))) * 100
      ).toFixed(1)}%
    </p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* No Results */}
        {sortedGyms.length === 0 && (
          <div className="text-center text-gray-500 mt-8">No gyms found matching your search.</div>
        )}
      </div>
    </div>
  );
};

export default GymsPage;
