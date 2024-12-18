'use client';

import React, { useState, useEffect } from 'react';
import { Search } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image'; // Added Next.js Image component
import 'mapbox-gl/dist/mapbox-gl.css';
import fetchGyms from '@/utils/gyms/gyms';
import Head from 'next/head';
import { GymProfile } from '@/utils/types';

const GymsPage: React.FC = () => {
  const [gyms, setGyms] = useState<Record<string, GymProfile>>({});
  const [topGyms, setTopGyms] = useState<GymProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetchGyms();
        if (response.success) {
          setGyms(response.gyms);
          setTopGyms(response.topGyms);
        } else {
          setError(response.error || 'Unknown error occurred');
        }
      } catch (err) {
        setError('Error fetching gyms');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredGyms = Object.entries(gyms).filter(([gymName]) =>
    gymName.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const sortedGyms = [...filteredGyms].sort((a, b) => (b[1].win || 0) - (a[1].win || 0));

  const seoDescription = topGyms
    .map((gym) => gym.gym)
    .slice(0, 10)
    .join(', ');

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
      <Head>
        <title>Muay Thai Gyms - Top Gyms</title>
        <meta
          name="description"
          content={`Explore the top 10 Muay Thai gyms: ${seoDescription}. Find the best gym for your training needs.`}
        />
      </Head>
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
      {/* eslint-disable-next-line @typescript-eslint/no-unused-vars */}
{sortedGyms.map(([_, data]) => (
  <Link 
    key={data.id} 
    href={`/gyms/${data.id}`}
    className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden cursor-pointer"
  >
              {data.logo && (
                <div className="relative w-full h-32">
                  <Image
                    src={data.logo}
                    alt={`${data.gym} logo`}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-2 truncate">{data.gym}</h2>
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
            </Link>
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