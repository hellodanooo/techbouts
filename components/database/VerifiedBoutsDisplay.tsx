'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';

// Define the BoutData interface for type safety
interface BoutData {
  id?: string;
  fighter_id: string;
  fighterName: string;
  opponentName: string;
  url: string;
  date: string;
  result: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW';
  promotionName: string;
  sanctioningBody: string;
  promotionId?: string;
  sanctioningId?: string;
  opponentId?: string;
  namePresent: boolean;
  datePresent: boolean;
  promotionPresent: boolean;
  sanctioningPresent: boolean;
  opponentPresent: boolean;
  resultVerified: boolean;
  timestamp: string;
  inputDate: string;
  inputOpponentFirst: string;
  inputOpponentLast: string;
}

interface VerifiedBoutsDisplayProps {
  fighterId: string;
  refreshTrigger?: number; 
  isFighter?: boolean;

}

const VerifiedBoutsDisplay: React.FC<VerifiedBoutsDisplayProps> = ({ 
  fighterId,
  refreshTrigger = 0
}) => {
  const [fighterBouts, setFighterBouts] = useState<BoutData[]>([]);
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
      const bouts: BoutData[] = [];
      
      querySnapshot.forEach((doc) => {
        // Get the data from each document
        const boutData = doc.data() as BoutData;
        // Add an id field to identify the document later if needed
        bouts.push({
          ...boutData,
          id: doc.id
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

  // Get the fighter's record (W-L-D)
  const getRecord = () => {
    const wins = fighterBouts.filter(bout => bout.result === 'W').length;
    const losses = fighterBouts.filter(bout => bout.result === 'L').length;
    const draws = fighterBouts.filter(bout => bout.result === 'DRAW').length;
    const nc = fighterBouts.filter(bout => bout.result === 'NC').length;
    const dq = fighterBouts.filter(bout => bout.result === 'DQ').length;
    
    if (nc > 0 || dq > 0) {
      return `${wins}-${losses}-${draws} (${nc} NC, ${dq} DQ)`;
    }
    return `${wins}-${losses}-${draws}`;
  };

  return (
    <div className="mt-8 p-4 bg-white rounded-lg shadow">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold">Fighters Bout History</h2>
        {fighterBouts.length > 0 && (
          <div className="text-sm font-medium bg-gray-100 px-3 py-1 rounded">
            Record: {getRecord()}
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
              {fighterBouts.map((bout, index) => (
                <tr key={bout.id || index} className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {new Date(bout.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {bout.opponentName}
                  </td>
                  <td className={`px-4 py-2 text-sm font-semibold ${
                    bout.result === 'W' ? 'text-green-700' : 
                    bout.result === 'L' ? 'text-red-700' : 
                    'text-gray-700'
                  }`}>
                    {bout.result}
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-700">
                    {bout.promotionName}
                  </td>
                  <td className="px-4 py-2 text-sm">
                    <a 
                      href={bout.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      View Source
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      
     
    </div>
  );
};

export default VerifiedBoutsDisplay;