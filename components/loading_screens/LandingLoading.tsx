// components/loading_screens/LandingLoading.tsx
'use client';

import Image from 'next/image';

export default function LandingLoading() {

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="text-center space-y-8">
        <Image
        style={{display: 'block', margin: 'auto'}}
        src="/logos/techboutslogoFlat.png" width={200} height={200} alt="TechBouts Logo" />
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">Welcome to TechBouts</h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">LOADING</p>
        <div className="flex flex-col items-center gap-4">
       
        </div>
      </div>
    </div>
  );
}