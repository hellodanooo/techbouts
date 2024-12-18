// app/fighter/[fighterId]/page.tsx
import React from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../../utils/firebase';
import Image from 'next/image';
import BoutSearch from '../../../components/database/BoutSearch';
import { Metadata } from 'next';




interface BoutData {
    url: string;
    namePresent: boolean;
    date: string;
    datePresent: boolean;
    promotionName: string;
    promotionPresent: boolean;
    sanctioningBody: string;
    sanctioningPresent: boolean;
    opponentName: string;
    opponentPresent: boolean;
    timestamp: string;
    inputDate: string;
    inputOpponentFirst: string;
    inputOpponentLast: string;
    result: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW';  // Just keep this one
  }

interface Fighter {
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
    bouts?: BoutData[];  // Add this line
  }

const defaultPhotoUrl =
  'https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/Fighter_Photos%2FIcon_grey.png?alt=media&token=8e8beffa-a6b3-4329-93fc-db64b7045c0a';

async function getFighterById(fighterId: string): Promise<Fighter | null> {
  try {
    const fightersRef = collection(db, 'fighters_database');
    const fightersSnapshot = await getDocs(fightersRef);
    
    let fighter: Fighter | null = null;
    
    fightersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fighters) {
        const foundFighter = data.fighters.find((f: Fighter) => f.fighter_id === fighterId);
        if (foundFighter) {
          fighter = foundFighter;
        }
      }
    });
    
    return fighter;
  } catch (error) {
    console.error('Error fetching fighter:', error);
    return null;
  }
}


export async function generateMetadata({
  params,
}: {
  params: Promise<{ fighterId: string }>;
}): Promise<Metadata> {
  const { fighterId } = await params; // Await to resolve the Promise.
  const fighter = await getFighterById(fighterId);

  if (!fighter) {
    return {
      title: 'Fighter Not Found',
      description: 'The requested fighter could not be found.',
    };
  }

  return {
    title: `${fighter.first} ${fighter.last} - Fighter Profile`,
    description: `Fighter profile for ${fighter.first} ${fighter.last}, ${fighter.weightclass} weight class, ${fighter.win}-${fighter.loss} record`,
  };
}

export default async function FighterPage({
  params,
}: {
  params: Promise<{ fighterId: string }>;
}) {
  const { fighterId } = await params; // Await to resolve the Promise.
  const fighter = await getFighterById(fighterId);

  if (!fighter) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e6]">
        <h1 className="text-2xl font-bold text-red-600">Fighter not found</h1>
      </div>
    );
  }

  const FighterBouts: React.FC<{ bouts?: BoutData[] }> = ({ bouts }) => {
    if (!bouts || bouts.length === 0) {
      return (
        <div className="text-center py-8 text-gray-500">
          No bout history available
        </div>
      );
    }
  
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-[#f8f5f0] text-[#8B7355]">
              <th className="px-4 py-2 text-left">Result</th>
              <th className="px-4 py-2 text-left">Opponent</th>
              <th className="px-4 py-2 text-left">Date</th>
              <th className="px-4 py-2 text-left">Promotion</th>
              <th className="px-4 py-2 text-left">Sanctioning Body</th>
            </tr>
          </thead>
          <tbody>
            {bouts.map((bout, index) => (
              <tr key={index} className="border-b border-[#d4c5b1]">
                <td className="px-4 py-2">
                  <span className={`font-bold ${
                    bout.result === 'W' ? 'text-green-600' :
                    bout.result === 'L' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {bout.result}
                  </span>
                </td>
                <td className="px-4 py-2">{bout.opponentName}</td>
                <td className="px-4 py-2">{new Date(bout.date).toLocaleDateString()}</td>
                <td className="px-4 py-2">{bout.promotionName}</td>
                <td className="px-4 py-2">{bout.sanctioningBody}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#f5f0e6] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Fighter Profile Card */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-[#8B7355] p-6">
            <h1 className="text-4xl font-bold text-white">
              {fighter.first} {fighter.last}
            </h1>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
            {/* Profile Image */}
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-64 h-64">
                <Image
                  src={fighter.photo && isValidUrl(fighter.photo) ? fighter.photo : defaultPhotoUrl}
                  alt={`${fighter.first} ${fighter.last}`}
                  fill
                  className="rounded-lg object-cover shadow-md"
                />
              </div>
            </div>

            {/* Fighter Details */}
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6">
              <div className="bg-[#f8f5f0] p-4 rounded-lg">
                <h2 className="text-[#8B7355] font-semibold text-sm">Weight Class</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.weightclass}</p>
              </div>

              <div className="bg-[#f8f5f0] p-4 rounded-lg">
                <h2 className="text-[#8B7355] font-semibold text-sm">Record</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.win}-{fighter.loss}</p>
              </div>

              <div className="bg-[#f8f5f0] p-4 rounded-lg">
                <h2 className="text-[#8B7355] font-semibold text-sm">Gym</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.gym}</p>
              </div>

              <div className="bg-[#f8f5f0] p-4 rounded-lg">
                <h2 className="text-[#8B7355] font-semibold text-sm">Age</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.age}</p>
              </div>

              <div className="bg-[#f8f5f0] p-4 rounded-lg">
                <h2 className="text-[#8B7355] font-semibold text-sm">Gender</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.gender}</p>
              </div>

              {fighter.city && (
                <div className="bg-[#f8f5f0] p-4 rounded-lg">
                  <h2 className="text-[#8B7355] font-semibold text-sm">Location</h2>
                  <p className="text-gray-800 font-bold mt-1">
                    {fighter.city}{fighter.state ? `, ${fighter.state}` : ''}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>


        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
        <div className="border-b border-[#d4c5b1] pb-4 mb-6">
          <h2 className="text-2xl font-bold text-[#8B7355]">Bout History</h2>
        </div>
        <FighterBouts bouts={fighter.bouts} />
      </div>

        {/* Bout Form Section */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="border-b border-[#d4c5b1] pb-4 mb-6">
            <h2 className="text-2xl font-bold text-[#8B7355]">Add Bout Result</h2>
          </div>
          
          <BoutSearch 
            firstName={fighter.first}
            lastName={fighter.last}
            fighterId={fighter.fighter_id}
          />
        </div>
      </div>
    </div>
  );
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}