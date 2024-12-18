"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import BoutSearch from "../../../components/database/BoutSearch";

interface Fighter {
  fighter_id: string;
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
  bouts?: {
    result: string;
    opponentName: string;
    date: string;
    promotionName: string;
    sanctioningBody: string;
  }[];
}

const defaultPhotoUrl =
  "https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/Fighter_Photos%2FIcon_grey.png?alt=media&token=8e8beffa-a6b3-4329-93fc-db64b7045c0a";

export default function FighterPage({
  params: paramsPromise,
}: {
  params: Promise<{ fighterId: string }>;
}) {
  const [fighter, setFighter] = useState<Fighter | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCollapsed, setIsCollapsed] = useState(true);

  useEffect(() => {
    async function fetchFighterData() {
      try {
        const params = await paramsPromise;
        const response = await fetch(`/api/fighters/${params.fighterId}`);
        if (!response.ok) throw new Error("Fighter not found");
        const data: Fighter = await response.json();
        setFighter(data);
      } catch (error) {
        console.error("Error fetching fighter data:", error);
        setFighter(null);
      } finally {
        setLoading(false);
      }
    }
    fetchFighterData();
  }, [paramsPromise]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e6]">
        <h1 className="text-2xl font-bold text-[#8B7355]">Loading...</h1>
      </div>
    );

  if (!fighter)
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e6]">
        <h1 className="text-2xl font-bold text-red-600">Fighter not found</h1>
      </div>
    );

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
  { label: "Weight Class", value: fighter.weightclass },
  { label: "Record", value: `${fighter.win}-${fighter.loss}` },
  { label: "Gym", value: fighter.gym },
  { label: "Age", value: fighter.age.toString() }, // Ensure value is a string
  { label: "Gender", value: fighter.gender },
  fighter.city
    ? {
        label: "Location",
        value: `${fighter.city}, ${fighter.state || ""}`,
      }
    : null,
]
  .filter((item): item is { label: string; value: string } => item !== null) // Type guard
  .map((item, index) => (
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

        {/* Bout History */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-[#8B7355] mb-4">
            Bout History
          </h2>
          {fighter.bouts && fighter.bouts.length > 0 ? (
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
                  {fighter.bouts.map((bout, index) => (
                    <tr key={index} className="border-b border-[#d4c5b1]">
                      <td className="px-4 py-2 font-bold text-green-600">
                        {bout.result}
                      </td>
                      <td className="px-4 py-2">{bout.opponentName}</td>
                      <td className="px-4 py-2">
                        {new Date(bout.date).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-2">{bout.promotionName}</td>
                      <td className="px-4 py-2">{bout.sanctioningBody}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-gray-500 text-center">No bout history available</p>
          )}
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
              fighterId={fighter.fighter_id}
            />
          )}
        </div>
      </div>
    </div>
  );
}
