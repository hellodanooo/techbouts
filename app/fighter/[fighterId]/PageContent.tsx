// app/fighter/[fighterId]/PageContent.tsx
"use client";

import React, { useState } from "react";
import Image from "next/image";
import BoutSearch from "@/components/database/BoutSearch";
import { FighterProfile } from '@/utils/types';

const defaultPhotoUrl =
  "https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/Fighter_Photos%2FIcon_grey.png?alt=media&token=8e8beffa-a6b3-4329-93fc-db64b7045c0a";

interface FighterPageContentProps {
  fighter: FighterProfile;
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
                  src={fighter.photo || defaultPhotoUrl}
                  alt={`${fighter.first} ${fighter.last}`}
                  fill
                  className="rounded-lg object-cover shadow-md"
                />
              </div>
            </div>
            <div className="lg:col-span-2 grid grid-cols-2 md:grid-cols-3 gap-6">
              {[
                { label: "Weight Class", value: fighter.weightclass.toString() },
                { label: "Record", value: `${fighter.win}-${fighter.loss}` },
                { label: "Gym", value: fighter.gym },
                { label: "Age", value: fighter.age.toString() },
                { label: "Gender", value: fighter.gender }
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
              fighterId={fighter.mtp_id}
            />
          )}
        </div>
      </div>
    </div>
  );
}