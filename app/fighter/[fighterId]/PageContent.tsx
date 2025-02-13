// app/fighter/[fighterId]/PageContent.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import BoutSearch from "@/components/database/BoutSearch";
import { PmtFighterRecord } from '@/utils/types';

const defaultPhotoUrl =
  "https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/Fighter_Photos%2FIcon_grey.png?alt=media&token=8e8beffa-a6b3-4329-93fc-db64b7045c0a";

interface FighterPageContentProps {
  fighter: PmtFighterRecord;
}

export function FighterPageContent({ fighter }: FighterPageContentProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);
  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  return (
    <div className="min-h-screen bg-[#f5f0e6] py-12">
      <div className="max-w-6xl mx-auto px-4">
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
                  src={defaultPhotoUrl}
                  alt={`${fighter.first} ${fighter.last}`}
                  fill
                  className="rounded-lg object-cover shadow-md"
                />
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: "Record", value: `${fighter.wins}-${fighter.losses}` },
                { label: "Gym", value: fighter.gym || "Unknown" },
              ].map((item, index) => (
                <div key={index} className="bg-[#f8f5f0] p-4 rounded-lg text-center">
                  <h2 className="text-[#8B7355] font-semibold text-sm">
                    {item.label}
                  </h2>
                  <p className="text-gray-800 font-bold mt-1">{item.value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* PMT Fighter Data Section */}
        {fighter.fights && fighter.fights.length > 0 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
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
              fighterId={fighter.pmt_id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
