'use client';

import Link from 'next/link';

export default function Error({
  reset
}: {
  reset: () => void;
}) {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Something Went Wrong</h1>
        <p className="text-gray-600 mb-4">
          We encountered an error while trying to load the gym profile.
        </p>
        <div className="flex gap-4">
          <button
            onClick={reset}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Try Again
          </button>
          <Link 
            href="/gyms" 
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Back to Gyms
          </Link>
        </div>
      </div>
    </div>
  );
}