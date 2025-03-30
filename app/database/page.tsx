// app/database/page.tsx
import React from 'react';
import { Metadata } from 'next';
import Image from 'next/image';
import { Suspense } from 'react';
import { collection, getDocs, query, limit, orderBy, getCountFromServer } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import EnhancedFighterTable from '@/components/tables/EnhancedFighterTable';
import { FullContactFighter } from '@/utils/types';
import Header from '@/components/headers/Header';
//import TransferPmtToTechbouts from './TransferPmtToTechbouts';

// Placeholder loading component
const LoadingFighters = () => (
  <div className="flex flex-col items-center justify-center h-64">
    <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent mb-4"></div>
    <p>Loading fighters...</p>
  </div>
);

// Function to get initial data directly from Firestore
async function getInitialData() {
  try {
    // Get total count
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    const countSnapshot = await getCountFromServer(fightersRef);
    const totalCount = countSnapshot.data().count;
    
    // Get initial batch of fighters
    const fightersQuery = query(
      fightersRef,
      orderBy('last'),
      limit(50)
    );
    
    const fightersSnapshot = await getDocs(fightersQuery);
    
    // Get the last document for cursor-based pagination
    const lastVisible = fightersSnapshot.docs[fightersSnapshot.docs.length - 1];
    const nextLastDocId = lastVisible ? lastVisible.id : null;
    
    // Map the fighters data
    const fighters = fightersSnapshot.docs.map(doc => {
      const data = doc.data();
      
      return {
        fighter_id: data.fighter_id || doc.id,
        first: data.first || '',
        last: data.last || '',
        gym: data.gym || '',
        email: data.email || '',
        weightclass: Number(data.weightclass) || 0,
        age: data.age || (data.age_gender ? data.age_gender.split('/')[0] : ''),
        gender: data.gender || (data.age_gender ? data.age_gender.split('/')[1] : ''),
        mt_win: data.win || 0,
        mt_loss: data.loss || 0,
        boxing_win: data.boxing_win || 0,
        boxing_loss: data.boxing_loss || 0,
        mma_win: data.mmawin || 0,
        mma_loss: data.mmaloss || 0,
        photo: data.photo || '',
        state: data.state || '',
        nc: data.nc || 0,
        dq: data.dq || 0,
        years_exp: data.years_exp || 0,
        class: data.class || '',
        docId: doc.id,
        id: data.id || '',
        dob: data.dob || '',
        phone: data.phone || '',
        gym_id: data.gym_id || '',
        coach: data.coach || '',
        coach_email: data.coach_email || '',
        coach_name: data.coach_name || '',
        coach_phone: data.coach_phone || '',
        fight_record: data.fight_record || '',
        fight_style: data.fight_style || '',
        fight_team: data.fight_team || '',
        pmt_win: data.pmt_win || 0,
        pmt_loss: data.pmt_loss || 0,
        pb_win: data.pb_win || 0,
        pb_loss: data.pb_loss || 0,
        age_gender: data.age_gender || '',
        city: data.city || '',
        other_exp: data.other_exp || '',
        pmt_fights: data.pmt_fights || [],
        gym_website: data.gym_website || '',
        gym_address: data.gym_address || '',

      } as FullContactFighter;
    });
    
    return {
      fighters,
      totalCount,
      pagination: {
        hasMore: fighters.length === 50,
        nextLastDocId
      }
    };
  } catch (error) {
    console.error('Error fetching initial data:', error);
    return { 
      fighters: [], 
      totalCount: 0, 
      pagination: { 
        hasMore: false, 
        nextLastDocId: null 
      } 
    };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    // Get the data including total count
    const { totalCount } = await getInitialData();
    
    return {
      title: `TechBouts Fighter Database - ${totalCount} Fighters`,
      description: `Explore our TechBouts fighter database with ${totalCount} fighters grouped by weight class, gym, and more.`,
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'TechBouts Fighter Database',
      description: 'Explore our TechBouts fighter database grouped by weight class, gym, and more.',
    };
  }
}

export default async function FighterDatabase() {
  try {
    // Get initial fighters (just a small subset of 50)
    const { fighters: initialFighters, totalCount, pagination } = await getInitialData();

    return (
      <div className="w-full flex flex-col items-center space-y-6">
        
        
        <Header />
        <h1 className="text-2xl font-bold">TechBouts Fighter Database</h1>
 

        <Image
          src="/logos/techboutslogoFlat.png"
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
            
            <EnhancedFighterTable 
              initialFighters={initialFighters} 
              totalCount={totalCount}
              initialHasMore={pagination.hasMore}
              initialNextLastDocId={pagination.nextLastDocId}
            />
            
          </Suspense>
        </div>
      </div>
    );
  } catch (error) {
    console.error('Error rendering FighterDatabase:', error);
    
    // Fallback UI in case of error
    return (
      <div className="w-full flex flex-col items-center space-y-6">
        <h1 className="text-2xl font-bold">TechBouts Fighter Database</h1>
        <div className="p-6 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">There was an error loading the fighter database. Please try again later.</p>
          <p className="text-sm text-gray-500 mt-2">Details: {error instanceof Error ? error.message : String(error)}</p>
        </div>
      </div>
    );
  }
}