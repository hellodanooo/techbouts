"use client";

import { useEffect, useState } from "react";
import MonthTable from "@/components/MonthTable";
import { EventType } from "@/utils/types";
import { fetchEvents } from "@/utils/pmt/events";

export default function SchedulePage() {
  const [events, setEvents] = useState<EventType[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<EventType[]>([]);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [eventCount, setEventCount] = useState<number | null>(null);
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    const loadEvents = async () => {
      try {
        const fetchedEvents = await fetchEvents();
        setEvents(fetchedEvents);
        setFilteredEvents(fetchedEvents); // Initialize with all events
        setEventCount(fetchedEvents.length);

        // Show popup for 2 seconds
        setShowPopup(true);
        setTimeout(() => {
          setShowPopup(false);
        }, 2000);
      } catch (error) {
        console.error("Error loading events:", error);
      } finally {
        setLoading(false);
      }
    };

    loadEvents();
  }, []);

  // Update filtered events when selectedState changes
  useEffect(() => {
    if (selectedState) {
      setFilteredEvents(events.filter((event) => event.state === selectedState));
    } else {
      setFilteredEvents(events);
    }
  }, [selectedState, events]);

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-900 p-4">
        <div className="text-center text-white">Loading events...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-900 p-4">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Event Schedule</h1>
          <p className="text-gray-400">
            View and manage events across different promoters and months.
          </p>
        </div>

        {/* State Filter */}
        <div className="flex items-center space-x-4">
          <label htmlFor="stateFilter" className="text-gray-400">
            Filter by State:
          </label>
          <select
            id="stateFilter"
            value={selectedState || ""}
            onChange={(e) => setSelectedState(e.target.value || null)}
            className="bg-gray-800 text-white px-4 py-2 rounded"
          >
            <option value="">All States</option>
            <option value="CA">California (CA)</option>
            <option value="TX">Texas (TX)</option>
            <option value="CO">Colorado (CO)</option>
            <option value="ID">Idaho (ID)</option>
          </select>
        </div>

        {/* Popup */}
        {showPopup && eventCount !== null && (
          <div
            className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-green-500 text-white px-6 py-3 rounded shadow-lg"
            role="alert"
          >
            {`${eventCount} events fetched successfully!`}
          </div>
        )}

        {/* Pass filtered events as a prop to the MonthTable */}
        <MonthTable events={filteredEvents} />
      </div>
    </main>
  );
}
