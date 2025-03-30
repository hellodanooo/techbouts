'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { Bout } from '@/utils/types';


interface VerifiedBoutsDisplayProps {
  fighterId: string;
  refreshTrigger?: number; 
  isFighter?: boolean;

}

const VerifiedBoutsDisplay: React.FC<VerifiedBoutsDisplayProps> = ({ 
  fighterId,
  refreshTrigger = 0
}) => {
  const [fighterBouts, setFighterBouts] = useState<Bout[]>([]);
  const [isLoadingBouts, setIsLoadingBouts] = useState(false);
  const [boutsError, setBoutsError] = useState<string | null>(null);

  const fetchFighterBouts = async () => {
    if (!fighterId) return;
    
    setIsLoadingBouts(true);
    setBoutsError(null);
    
    try {
      // Create a query against the bouts collection
      const boutsRef = collection(db, 'techbouts_verified_bouts');
      const fighterQuery = query(boutsRef, where('fighter_id', '==', fighterId));
      
      const querySnapshot = await getDocs(fighterQuery);
      const bouts: Bout[] = [];
      
      querySnapshot.forEach((doc) => {
        // Get the data from each document
        const boutData = doc.data() as Bout;
        // Add an id field to identify the document later if needed
        bouts.push({
          ...boutData,
          boutId: doc.id
        });
      });
      
      // Sort bouts by date (most recent first)
      bouts.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return dateB - dateA;
      });
      
      setFighterBouts(bouts);
    } catch (error) {
      console.error('Error fetching fighter bouts:', error);
      setBoutsError('Failed to load fighter bouts. Please try again.');
    } finally {
      setIsLoadingBouts(false);
    }
  };

  // Fetch bouts when the component mounts or fighterId changes
  useEffect(() => {
    fetchFighterBouts();
  }, [fighterId, refreshTrigger]);


  return (
    <div className="mt-8 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Fighters Bout History</h2>
        {fighterBouts.length > 0 && (
          <div className="text-sm font-medium bg-gray-100 px-3 py-1 rounded">
            Record: Need to Make
          </div>
        )}
      </div>
      
      {isLoadingBouts ? (
        <div className="flex justify-center items-center py-4">
          <div className="animate-spin mr-2 h-5 w-5 border-t-2 border-[#8B7355] border-r-2 rounded-full"></div>
          <span className="text-gray-600">Loading bout history...</span>
        </div>
      ) : boutsError ? (
        <div className="p-3 rounded-lg text-center bg-red-100 text-red-700">
          {boutsError}
        </div>
      ) : fighterBouts.length === 0 ? (
        <div className="text-center py-4 text-gray-500">
          No bout history found for this fighter.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Date</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Opponent</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Result</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Promotion</th>
                <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
        
            </tbody>
          </table>
        </div>
      )}
      
     
    </div>
  );
};

export default VerifiedBoutsDisplay;