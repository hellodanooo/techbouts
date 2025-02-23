// components/loading_screens/LandingLoading.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function LandingLoading() {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  if (!show) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-50 dark:bg-gray-900 animate-fade-out">
      <div className="text-center space-y-8 animate-scale-down">
        <div className="relative w-64 h-64 mx-auto">
          <Image
            src="/logos/techboutsLogo.png"
            fill
            className="object-contain"
            alt="TechBouts Logo"
          />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 dark:text-white">
          Welcome to TechBouts
        </h1>
        <p className="text-xl text-gray-600 dark:text-gray-400 mb-4">
          LOADING
        </p>
      </div>
    </div>
  );
}

