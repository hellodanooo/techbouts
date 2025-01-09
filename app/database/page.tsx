import React from 'react';
import { Metadata } from 'next';
import FighterTable from '../../components/FightersTable';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase_pmt/config';

type Fighter = {
  fighter_id: string;
  mtp_id?: string;
  first: string;
  last: string;
  weightclass: string;
  gym: string;
  age: number;
  gender: string;
  win: number;
  loss: number;
  city?: string;
  state?: string;
  photo?: string;
};

const fetchFighters = async (): Promise<Fighter[]> => {
  try {
    const fightersRef = collection(db, 'fighters_database');
    const fightersSnapshot = await getDocs(fightersRef);

    const allFighters: Fighter[] = [];
    fightersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fighters) {
        allFighters.push(...data.fighters);
      }
    });

    return allFighters;
  } catch (error) {
    console.error('Error fetching fighters:', error);
    return [];
  }
};

export async function generateMetadata(): Promise<Metadata> {
  const fighters = await fetchFighters();
  return {
    title: `Fighter Database - ${fighters.length} Fighters`,
    description: `Explore our fighter database with ${fighters.length} fighters grouped by weight class, gym, and more.`,
  };
}

export default async function FighterDatabase() {
  const fighters = await fetchFighters();

  return (
    <div className="database_page">
      <h1>Fighter Database</h1>
      <p>Total Fighters: {fighters.length}</p>
      <FighterTable fighters={fighters} />
    </div>
  );
}
