// app/database/[sanctioning]/page.tsx
import React from 'react';
import { Metadata } from 'next';
import FighterSearchTable from '@/components/tables/EnhancedFighterTable';
import Image from 'next/image';
import { Suspense } from 'react';
import { collection, getDocs, query, limit } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { FullContactFighter } from '@/utils/types';

// Placeholder loading component
const LoadingFighters = () => (
  <div className="flex flex-col items-center justify-center h-64">
    <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
    <p>Loading fighters...</p>
  </div>
);

// Function to get initial data with just a small subset of fighters
async function getInitialFighters() {
  try {
    // Only fetch a small initial batch of fighters
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    const fightersQuery = query(fightersRef, limit(50)); // Only get first 50
    
    const fightersSnapshot = await getDocs(fightersQuery);
    
    // Get the count without loading all fighters
    const countQuery = query(fightersRef);
    const countSnapshot = await getDocs(countQuery);
    const totalCount = countSnapshot.size;
    
    // Map the initial fighters
    const fighters = fightersSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        fighter_id: data.fighter_id || doc.id,
        first: data.first || '',
        last: data.last || '',
        gym: data.gym || '',
        email: data.email || '',
        weightclass: Number(data.weightclass) || 0,
        age_gender: data.age_gender || '',
        mt_win: data.win || 0,
        mt_loss: data.loss || 0,
        boxing_win: data.boxing_win || 0,
        boxing_loss: data.boxing_loss || 0,
        mma_win: data.mmawin || 0,
        mma_loss: data.mmaloss || 0,
        nc: data.nc || 0,
        dq: data.dq || 0,
        years_exp: data.years_exp || 0,
        class: data.class || '',
        docId: data.docId || doc.id,
      } as FullContactFighter;
    });
    
    return { fighters, totalCount };
  } catch (error) {
    console.error('Error fetching initial fighters:', error);
    return { fighters: [], totalCount: 0 };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  
  // Get count without loading all fighters
  const { totalCount } = await getInitialFighters();
  
  return {
    title: `TechBouts Fighter Database - ${totalCount} Fighters`,
    description: `Explore our TechBouts fighter database with ${totalCount} fighters grouped by weight class, gym, and more.`,
  };
}

export default async function FighterDatabase() {
  
  // Get initial fighters (just a small subset)
  const { fighters: initialFighters, totalCount } = await getInitialFighters();

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <h1 className="text-2xl font-bold">TechBouts Fighter Database</h1>
      
      <Image
        src="/logos/techbouts_logo.png" // Update to your actual logo path
        alt="TechBouts Database"
        width={250}
        height={125}
        className="rounded-lg shadow-lg"
      />
      
      <div className="text-center">
        <p>Total Fighters: {totalCount}</p>
        <p className="text-sm text-gray-500">Showing results in batches for better performance</p>
      </div>

      <div className="w-full overflow-x-auto">
        <Suspense fallback={<LoadingFighters />}>
          <FighterSearchTable 
            initialFighters={initialFighters} 
            totalCount={totalCount}
          />
        </Suspense>
      </div>
    </div>
  );
}