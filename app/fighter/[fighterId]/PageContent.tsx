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



{fighter.bouts && fighter.bouts.length > 0 && (
  <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
    <h2 className="text-2xl font-bold text-[#8B7355] mb-4">
      Verified Bouts
    </h2>
    <div className="overflow-x-auto">
      <table className="min-w-full bg-white border border-gray-300">
        <thead>
          <tr className="bg-[#f8f5f0]">
            <th className="px-4 py-2 border">Date</th>
            <th className="px-4 py-2 border">Result</th>
            <th className="px-4 py-2 border">Opponent</th>
            <th className="px-4 py-2 border">Promotion</th>
            <th className="px-4 py-2 border">Sanctioning Body</th>
            <th className="px-4 py-2 border">Verification</th>
            <th className="px-4 py-2 border">Link</th>
          </tr>
        </thead>
        <tbody>
          {fighter.bouts.map((bout, index) => (
            <tr key={index} className="text-center border-t">
              <td className="px-4 py-2">{bout.date}</td>
              <td className="px-4 py-2 font-bold">
                {bout.result === 'W' ? (
                  <span className="text-green-600">Win</span>
                ) : bout.result === 'L' ? (
                  <span className="text-red-600">Loss</span>
                ) : bout.result === 'DRAW' ? (
                  <span className="text-blue-600">Draw</span>
                ) : bout.result === 'NC' ? (
                  <span className="text-gray-600">No Contest</span>
                ) : bout.result === 'DQ' ? (
                  <span className="text-orange-600">DQ</span>
                ) : (
                  <span className="text-gray-600">{bout.result}</span>
                )}
              </td>
              <td className="px-4 py-2">{bout.opponentName}</td>
              <td className="px-4 py-2">{bout.promotionName}</td>
              <td className="px-4 py-2">{bout.sanctioningBody}</td>
              <td className="px-4 py-2">
                <div className="flex flex-col items-center">
                  {bout.namePresent && bout.opponentPresent && bout.datePresent ? (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path>
                      </svg>
                      Verified
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800">
                      <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"></path>
                      </svg>
                      Partial
                    </span>
                  )}
                </div>
              </td>
              <td className="px-4 py-2">
                {bout.url && (
                  <a 
                    href={bout.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                )}
              </td>
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