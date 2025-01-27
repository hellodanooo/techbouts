'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { setDoc, doc } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { useAuth } from '@/context/AuthContext';
import { auth } from '@/lib/firebase_techbouts/config';

type Fighter = {
  address: string;
  age: number;
  city: string;
  coach: string;
  coach_phone: string;
  coach_email: string;
  email: string;
  dob: string;
  docId: string;
  fighter_id: string;
  first: string;
  gender: string;
  gym: string;
  gym_id: string;
  height: number;
  last: string;
  loss: number;
  mtp_id: string;
  photo: string;
  state: string;
  website: string;
  weightclass: number;
  win: string | number;
};

type FighterTableProps = {
  fighters: Fighter[];
  editable?: boolean;
  onEditFighter?: (fighter: Fighter) => void;
  onDeleteFighter?: (fighterId: string) => void;
};

const defaultPhotoUrl = '/images/techbouts_fighter_icon.png';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const FighterTable: React.FC<FighterTableProps> = ({ fighters, editable, onEditFighter, onDeleteFighter }) => {
  const router = useRouter();
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferStatus, setTransferStatus] = useState<string>('');
  const { user } = useAuth();

  const transferFightersToDB = async () => {
    if (!user || !auth.currentUser) {
      setTransferStatus('Please sign in to transfer fighters');
      return;
    }

    if (!confirm('Are you sure you want to transfer all fighters to Techbouts database?')) {
      return;
    }

    setIsTransferring(true);
    setTransferStatus('Starting transfer...');

    try {

      const groupedFighters = fighters.reduce((acc, fighter) => {
        const gymId = fighter.gym_id || 'NO_GYM';
        if (!acc[gymId]) {
          acc[gymId] = [];
        }
        acc[gymId].push({
          address: fighter.address || '',
          age: Number(fighter.age) || 0,
          city: fighter.city || '',
          coach: fighter.coach || '',
          coach_phone: fighter.coach_phone || '',
          dob: fighter.dob || '',
          docId: fighter.docId || fighter.fighter_id || '',
          fighter_id: fighter.fighter_id || '',
          first: fighter.first || '',
          gender: fighter.gender || '',
          gym: fighter.gym || '',
          gym_id: fighter.gym_id || '',
          height: Number(fighter.height) || 0,
          last: fighter.last || '',
          loss: Number(fighter.loss) || 0,
          mtp_id: fighter.mtp_id || '',
          photo: fighter.photo || '',
          state: fighter.state || '',
          website: fighter.website || '',
          weightclass: Number(fighter.weightclass) || 0,
          win: fighter.win || 0,
          email: fighter.email || '',
          coach_email: fighter.coach_email || '',
        });
        return acc;
      }, {} as Record<string, Fighter[]>);



      let completed = 0;
  for (const [gymId, gymFighters] of Object.entries(groupedFighters)) {
    const docRef = doc(techboutsDb, 'fighters_database', gymId);
    await setDoc(docRef, {
      fighters: gymFighters,
      gym_name: gymFighters[0].gym,
      total_fighters: gymFighters.length,
      last_updated: new Date().toISOString(),
      updated_by: user.email
    });

    completed += gymFighters.length;
    setTransferStatus(`Transferred ${completed} of ${fighters.length} fighters...`);
  }

  setTransferStatus(`Successfully transferred ${fighters.length} fighters!`);
  setTimeout(() => setTransferStatus(''), 5000);
} catch (error) {
  console.error('Transfer error:', error);
  setTransferStatus('Transfer failed. Please check console for details.');
} finally {
  setIsTransferring(false);
}
  }


  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <button
          onClick={transferFightersToDB}
          disabled={isTransferring || !user}
          className={`px-4 py-2 rounded ${
            isTransferring || !user
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {isTransferring ? 'Transferring...' : 'Send All Fighters to Techbouts'}
        </button>
        {transferStatus && (
          <span className={`ml-4 ${
            transferStatus.includes('failed') || transferStatus.includes('Please sign in')
              ? 'text-red-500' 
              : 'text-green-500'
          }`}>
            {transferStatus}
          </span>
        )}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead>
            <tr>
              <th>Photo</th>
              <th>First Name</th>
              <th>Last Name</th>
              <th>Weight</th>
              <th>Gym</th>
              <th>Age</th>
              <th>Gender</th>
              <th>Wins</th>
              <th>Losses</th>
              <th>City</th>
              <th>State</th>
              <th>Fighter ID</th>
              {editable && <th>Actions</th>}
            </tr>
          </thead>
          <tbody>
            {fighters.map((fighter) => (
              <tr 
                key={fighter.fighter_id} 
                onClick={() => router.push(`/fighter/${fighter.fighter_id}`)}
                style={{ cursor: 'pointer' }}
              >
                <td>
                  <Image
                    src={isValidUrl(fighter.photo || '') ? fighter.photo! : defaultPhotoUrl}
                    alt={`${fighter.first} ${fighter.last}`}
                    width={50}
                    height={50}
                    style={{ objectFit: 'cover' }}
                  />
                </td>
                <td>{fighter.first}</td>
                <td>{fighter.last}</td>
                <td>{fighter.weightclass}</td>
                <td>{fighter.gym}</td>
                <td>{fighter.age}</td>
                <td>{fighter.gender}</td>
                <td>{fighter.win}</td>
                <td>{fighter.loss}</td>
                <td>{fighter.city}</td>
                <td>{fighter.state}</td>
                <td>{fighter.fighter_id}</td>
                {editable && (
                  <td>
                    <button onClick={() => onEditFighter?.(fighter)}>Edit</button>
                    <button onClick={() => onDeleteFighter?.(fighter.fighter_id)}>Delete</button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FighterTable;