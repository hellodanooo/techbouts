"use client";

import React, { useEffect, useState, useMemo } from "react";
import { EventType } from "../utils/types";
import { format, parseISO, eachMonthOfInterval, startOfYear, endOfYear, isPast } from "date-fns";
import Image from "next/image";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface MonthTableProps {
  events: EventType[];
  isPromoter?: boolean;
  isAdmin?: boolean;
  activeSanctioning?: string;
}

// Helper function to determine if a city is in Northern or Southern California
const isNorthernCalifornia = (city: string): boolean => {
  // List of major Northern California cities (can be expanded)
  const northernCities = [
    'sacramento', 'san francisco', 'oakland', 'san jose', 'fresno','gilroy','alameda',
    'modesto', 'stockton', 'santa rosa', 'redding', 'eureka',
    'chico', 'santa cruz', 'monterey', 'berkeley', 'watsonville', 'roseville', 'el cerrito','santa clara'
  ];
  return northernCities.includes(city.toLowerCase());
};

const MonthTable: React.FC<MonthTableProps> = ({ events, isAdmin }) => {
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("upcoming");
  const [eventsByStateAndMonth, setEventsByStateAndMonth] = useState<{
    [state: string]: { [month: string]: EventType[] };
  }>({});

  // Modified states array to include NorCal and SoCal
  const states = useMemo(() => ["NorCal", "SoCal", "TX", "CO", "ID", "WA", "NV"], []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const months = useMemo(
    () =>
      eachMonthOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 11, 31)),
      }),
    [currentYear]
  );

  const handleEventClick = (event: EventType) => {
   
      window.location.href = `/events/${event.promoterId}/${event.id}`;
   
  };

  useEffect(() => {
    const organizedEvents: { [state: string]: { [month: string]: EventType[] } } = {};

    // Initialize the structure for all states including NorCal and SoCal
    states.forEach((state) => {
      organizedEvents[state] = {};
      months.forEach((month) => {
        organizedEvents[state][format(month, "MMM")] = [];
      });
    });

    // Filter events based on date, status, and time filter
    const filteredEvents = events.filter(event => {
      const eventDate = parseISO(event.date);
      const isPastEvent = isPast(eventDate);

      if (timeFilter === "upcoming" && isPastEvent) return false;
      if (timeFilter === "past" && !isPastEvent) return false;
      if (eventTypeFilter === "confirmed") return event.status === "confirmed";
      if (eventTypeFilter === "pending") return event.status === "pending";
      return true;
    });

    filteredEvents.forEach((event) => {
      if (event.date) {
        let stateKey;
        if (event.state?.toUpperCase() === 'CA') {
          // Determine if the event is in NorCal or SoCal
          stateKey = isNorthernCalifornia(event.city) ? 'NorCal' : 'SoCal';
        } else {
          stateKey = event.state?.toUpperCase() || '';
        }

        const monthKey = format(parseISO(event.date), "MMM");

        if (organizedEvents[stateKey]?.[monthKey]) {
          organizedEvents[stateKey][monthKey].push(event);
        }
      }
    });

    setEventsByStateAndMonth(organizedEvents);
  }, [events, months, states, eventTypeFilter, timeFilter]);




  const getSanctioningLogo = (sanctioning: string): string => {
    switch (sanctioning?.toUpperCase()) {
      case 'IKF':
        return '/logos/ikf_logo.png';
      case 'PBSC':
        return '/logos/pbsc_logo.png';
      case 'PMT':
        return '/logos/pmt_logo_2024_sm.png';
      default:
        return '/logos/pmt_logo_2024_sm.png';
    }
  };


  return (
    <>
      <div className="space-y-4 border border-zinc-600 rounded-sm">
        {isAdmin && (
          <div className="p-3">
            Admin Enabled
          </div>
        )}

        <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm">
          {/* Time filter */}
          <div className="flex gap-8">
            {['all', 'upcoming', 'past'].map(filterType => (
              <label key={filterType} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="timeFilter"
                  value={filterType}
                  checked={timeFilter === filterType}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium capitalize">
                  {filterType} Events
                </span>
              </label>
            ))}
          </div>

          {/* Status filter */}
          <div className="flex gap-8">
            {['all', 'confirmed', 'pending'].map(filterType => (
              <label key={filterType} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="eventType"
                  value={filterType}
                  checked={eventTypeFilter === filterType}
                  onChange={(e) => setEventTypeFilter(e.target.value)}
                  className="w-4 h-4 text-blue-600"
                />
                <span className="text-sm font-medium">
                  {filterType.charAt(0).toUpperCase() + filterType.slice(1)}
                  {filterType !== 'all' ? ' Only' : ' Status'}
                </span>
              </label>
            ))}
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="table-auto w-full border-collapse border border-gray-300">
            <thead>
              <tr>
                <th className="px-4 py-2 border border-gray-300 bg-gray-100">State</th>
                {months.map((month) => (
                  <th
                    key={format(month, "MMM")}
                    className="px-4 py-2 border border-gray-300 bg-gray-100"
                  >
                    {format(month, "MMM")}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {states.map((state) => (
                <tr key={state}>
                  <td className="px-4 py-2 border border-gray-300 bg-gray-50 font-medium">{state}</td>
                  {months.map((month) => {
                    const monthKey = format(month, "MMM");
                    const monthEvents = eventsByStateAndMonth[state]?.[monthKey] || [];
                    return (
                      <td key={monthKey} className="px-4 py-2 border border-gray-300 min-width-[150px]">
                        {monthEvents.length > 0 ? (
                          <div className="grid grid-cols-1 gap-2 justify-items-center">
                            {monthEvents.map((event) => {
                              const isPastEvent = isPast(parseISO(event.date));
                              return (
                                <Card
                                  key={event.id}
                                  className={`relative transition-colors cursor-pointer h-32 w-32 flex flex-col ${
                                    event.status === 'confirmed' ? 'bg-green-50 hover:bg-green-100' :
                                    event.status === 'approved' ? 'bg-blue-50 hover:bg-blue-100' :
                                    event.status === 'pending' ? 'bg-orange-50 hover:bg-orange-100' : 'bg-white'
                                  } ${isPastEvent ? 'opacity-50' : ''}`}
                                  onClick={() => handleEventClick(event)}
                                >
                                  <CardHeader className="p-2 flex-1 flex flex-col">
                                    <div className="flex items-start justify-between h-full">
                                      <div className="flex-1 overflow-hidden">
                                        <CardTitle className="text-sm font-medium truncate">
                                          {event.event_name}
                                        </CardTitle>
                                        <CardDescription className="text-xs mt-1">
                                          {format(parseISO(event.date), "MMM d, yyyy")}
                                          <br />
                                          <span className="truncate block">{event.city}</span>
                                          {event.status === 'pending' && (
  <span className="font-bold text-orange-700">PENDING</span>
)}
                                        </CardDescription>
                                      </div>
                                      <div className="w-6 h-6 relative flex-shrink-0 overflow-hidden ml-1">
                                        <Image
                                          src={getSanctioningLogo(event.sanctioning)}
                                          alt={`${event.sanctioning || 'PMT'} logo`}
                                          fill
                                          sizes="24px"
                                          className="object-contain pointer-events-none"
                                        />
                                      </div>
                                    </div>
                                  </CardHeader>
                                </Card>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="h-32 w-32 flex items-center justify-center mx-auto">
                            <span className="text-sm text-gray-400">No events</span>
                          </div>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
};

export default MonthTable;