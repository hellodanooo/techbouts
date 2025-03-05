// app/fighter/[fighterId]/PageContent.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import BoutSearch from "@/components/database/BoutSearch";
import { FullContactFighter } from '@/utils/types';

const defaultPhotoUrl = "/images/techbouts_fighter_icon.png";

interface FighterPageContentProps {
  fighter: FullContactFighter;
}

export function FighterPageContent({ fighter }: FighterPageContentProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);
  
  // Calculate total record for display
  const totalWins = 
    (fighter.mt_win || 0) + 
    (fighter.boxing_win || 0) + 
    (fighter.mma_win || 0) + 
    (fighter.pmt_win || 0);
  
  const totalLosses = 
    (fighter.mt_loss || 0) + 
    (fighter.boxing_loss || 0) + 
    (fighter.mma_loss || 0) + 
    (fighter.pmt_loss || 0);
  
  // Determine if a URL is valid
  const isValidUrl = (url: string | undefined): boolean => {
    if (!url) return false;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };
  
  const photoUrl = isValidUrl(fighter.photo) ? fighter.photo : defaultPhotoUrl;

  return (
    <div className="min-h-screen bg-[#f5f0e6] py-12">
      <div className="max-w-6xl mx-auto px-4">
        {/* Back Button */}
        <div className="mb-6">
          <Link href="/database" className="text-[#8B7355] hover:underline flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-1" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clipRule="evenodd" />
            </svg>
            Back to Database
          </Link>
        </div>
        
        {/* Fighter Profile */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="bg-[#8B7355] p-6">
            <h1 className="text-4xl font-bold text-white">
              {fighter.first} {fighter.last}
            </h1>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 p-6">
            <div className="flex justify-center lg:justify-start">
              <div className="relative w-64 h-64">
                <Image
                  src={photoUrl || defaultPhotoUrl}
                  alt={`${fighter.first} ${fighter.last}`}
                  fill
                  className="rounded-lg object-cover shadow-md"
                />
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Fighter stats and info */}
              <div className="bg-[#f8f5f0] p-4 rounded-lg text-center">
                <h2 className="text-[#8B7355] font-semibold text-sm">Record</h2>
                <p className="text-gray-800 font-bold mt-1">{totalWins}-{totalLosses}</p>
              </div>
              
              <div className="bg-[#f8f5f0] p-4 rounded-lg text-center">
                <h2 className="text-[#8B7355] font-semibold text-sm">Gym</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.gym || "Unknown"}</p>
              </div>
              
              <div className="bg-[#f8f5f0] p-4 rounded-lg text-center">
                <h2 className="text-[#8B7355] font-semibold text-sm">Weight</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.weightclass || "Unknown"} lbs</p>
              </div>
              
              <div className="bg-[#f8f5f0] p-4 rounded-lg text-center">
                <h2 className="text-[#8B7355] font-semibold text-sm">Class</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.class || "Unknown"}</p>
              </div>
              
              <div className="bg-[#f8f5f0] p-4 rounded-lg text-center">
                <h2 className="text-[#8B7355] font-semibold text-sm">Gender</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.gender || "Unknown"}</p>
              </div>
              
              <div className="bg-[#f8f5f0] p-4 rounded-lg text-center">
                <h2 className="text-[#8B7355] font-semibold text-sm">Age</h2>
                <p className="text-gray-800 font-bold mt-1">{fighter.age || "Unknown"}</p>
              </div>
            </div>
          </div>
          
          {/* Additional Fighter Details */}
          <div className="px-6 pb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold text-[#8B7355] mb-3">Fighter Details</h3>
                <div className="space-y-2">
                  {fighter.dob && (
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-600">Date of Birth:</span>
                      <span className="font-medium">{fighter.dob}</span>
                    </div>
                  )}
                  {fighter.height > 0 && (
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-600">Height:</span>
                      <span className="font-medium">{fighter.height}</span>
                    </div>
                  )}
                  {fighter.years_exp > 0 && (
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-600">Years Experience:</span>
                      <span className="font-medium">{fighter.years_exp}</span>
                    </div>
                  )}
                  {fighter.state && (
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-600">State:</span>
                      <span className="font-medium">{fighter.state}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div>
                <h3 className="text-xl font-semibold text-[#8B7355] mb-3">Fight Records</h3>
                <div className="space-y-2">
                  <div className="flex justify-between border-b border-gray-200 pb-1">
                    <span className="text-gray-600">Muay Thai:</span>
                    <span className="font-medium">{fighter.mt_win}-{fighter.mt_loss}</span>
                  </div>
                  {(fighter.boxing_win > 0 || fighter.boxing_loss > 0) && (
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-600">Boxing:</span>
                      <span className="font-medium">{fighter.boxing_win}-{fighter.boxing_loss}</span>
                    </div>
                  )}
                  {(fighter.mma_win > 0 || fighter.mma_loss > 0) && (
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-600">MMA:</span>
                      <span className="font-medium">{fighter.mma_win}-{fighter.mma_loss}</span>
                    </div>
                  )}
                  {(fighter.pmt_win > 0 || fighter.pmt_loss > 0) && (
                    <div className="flex justify-between border-b border-gray-200 pb-1">
                      <span className="text-gray-600">PMT:</span>
                      <span className="font-medium">{fighter.pmt_win}-{fighter.pmt_loss}</span>
                    </div>
                  )}
                  <div className="flex justify-between border-b border-gray-200 pb-1 font-semibold">
                    <span className="text-gray-800">Total Record:</span>
                    <span className="font-bold">{totalWins}-{totalLosses}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Fight History Section */}
        {fighter.fights && fighter.fights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-[#8B7355] mb-4">
              Fight History
            </h2>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-300">
                <thead>
                  <tr className="bg-[#f8f5f0]">
                    <th className="px-4 py-2 border">Date</th>
                    <th className="px-4 py-2 border">Event</th>
                    <th className="px-4 py-2 border">Result</th>
                    <th className="px-4 py-2 border">Opponent</th>
                    <th className="px-4 py-2 border">Weightclass</th>
                    <th className="px-4 py-2 border">Bout Type</th>
                  </tr>
                </thead>
                <tbody>
                  {fighter.fights.map((fight, index) => (
                    <tr key={index} className="text-center border-t">
                      <td className="px-4 py-2">{fight.date}</td>
                      <td className="px-4 py-2">{fight.eventName}</td>
                      <td className="px-4 py-2 font-bold">
                        {fight.result === 'W' ? (
                          <span className="text-green-600">Win</span>
                        ) : fight.result === 'L' ? (
                          <span className="text-red-600">Loss</span>
                        ) : (
                          <span className="text-gray-600">{fight.result}</span>
                        )}
                      </td>
                      <td className="px-4 py-2">{fight.opponent_id || 'N/A'}</td>
                      <td className="px-4 py-2">{fight.weightclass} lbs</td>
                      <td className="px-4 py-2">{fight.bout_type}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Bout Form */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-2xl font-bold text-[#8B7355] mb-4">
            Add Bout Result
          </h2>
          <div className="border-b border-[#d4c5b1] pb-4 mb-6 flex justify-between items-center">
            <button
              onClick={toggleCollapse}
              className="text-[#8B7355] font-semibold"
            >
              {isCollapsed ? "Show" : "Hide"}
            </button>
          </div>
          {!isCollapsed && (
            <BoutSearch
              firstName={fighter.first}
              lastName={fighter.last}
              fighterId={fighter.fighter_id}
            />
          )}
        </div>
      </div>
    </div>
  );
}