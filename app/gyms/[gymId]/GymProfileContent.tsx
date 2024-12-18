'use client';

import { useState } from 'react';
import { Elements } from '@stripe/react-stripe-js';
import { loadStripe } from '@stripe/stripe-js';
import EditGymDetails from '@/components/gyms/EditGymDetails';
import { GymProfile } from '@/utils/types';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY!);

interface GymProfileContentProps {
  gymProfile: GymProfile;
  logoUrl: string | null;
  gymId: string;
}

export default function GymProfileContent({ gymProfile, logoUrl, gymId }: GymProfileContentProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleEditSuccess = () => {
    window.location.reload();
  };

  const { gym: gymName, win, loss, boysWin, girlsWin, menWin, womanWin, address, state, city } = gymProfile;

  return (
    <main className="container mx-auto px-4 py-8">
      <div className="gymProfile bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">{gymName} Profile</h1>
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors"
          >
            Edit Gym Details
          </button>
        </div>

        <img
          src={logoUrl || '/default-gym-logo.png'}
          alt={`${gymName} logo`}
          className="w-48 h-auto mb-4 rounded-lg"
        />

        <div className="stats grid grid-cols-2 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <div className="stat-item">
            <p className="font-semibold">Total Wins</p>
            <p className="text-lg">{win || 0}</p>
          </div>
          <div className="stat-item">
            <p className="font-semibold">Total Losses</p>
            <p className="text-lg">{loss || 0}</p>
          </div>
          <div className="stat-item">
            <p className="font-semibold">Boys Wins</p>
            <p className="text-lg">{boysWin || 0}</p>
          </div>
          <div className="stat-item">
            <p className="font-semibold">Girls Wins</p>
            <p className="text-lg">{girlsWin || 0}</p>
          </div>
          <div className="stat-item">
            <p className="font-semibold">Men Wins</p>
            <p className="text-lg">{menWin || 0}</p>
          </div>
          <div className="stat-item">
            <p className="font-semibold">Women Wins</p>
            <p className="text-lg">{womanWin || 0}</p>
          </div>
        </div>

        <div className="mt-6 bg-gray-50 p-4 rounded-lg">
          <h2 className="text-xl font-semibold mb-2">Location</h2>
          <p>{address || 'Address not available'}</p>
          <p className="mt-1">
            {city}, {state}
          </p>
        </div>

        <Elements stripe={stripePromise}>
          <EditGymDetails
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onSuccess={handleEditSuccess}
            gymId={gymId}
            initialData={gymProfile}
          />
        </Elements>
        
      </div>
    </main>
  );
}