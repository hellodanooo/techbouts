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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

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
  const [stateFilter, setStateFilter] = useState("all");
  const [countryFilter, setCountryFilter] = useState("all");




  const [eventsByStateAndMonth, setEventsByStateAndMonth] = useState<{
    [state: string]: { [month: string]: EventType[] };
  }>({});













  const getCountryFromEvent = (event: EventType): string => {
    // If the country field exists and is not empty
    if (event.country && event.country.trim() !== '') {
      // Normalize the country code
      const countryCode = event.country.toUpperCase();
      
      // Map country codes to full names for display
      switch (countryCode) {
        case 'US':
          return 'USA';
        case 'MX':
          return 'MEXICO';
        // Add more mappings as needed
        default:
          return countryCode;
      }
    }
    
    // Fallback: Infer country from other fields if possible
    if (event.state) {
      // Most states in the data are US states if not specified
      return 'USA';
    }
    
    // Default fallback
    return 'UNKNOWN';
  };
  

  const countries = useMemo(() => {
    const countryMap = new Map<string, number>();
    
    // Count events per country
    events.forEach(event => {
      const country = getCountryFromEvent(event);
      countryMap.set(country, (countryMap.get(country) || 0) + 1);
    });
    
    // Convert to array and sort by count (most events first)
    const sortedCountries = Array.from(countryMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0]);
    
    return sortedCountries.length > 0 ? sortedCountries : ['USA'];
  }, [events]);


  const getEventCountByCountry = (country: string): number => {
    if (country === 'all') {
      // Count all events
      return events.length;
    }
    
    // Count events for the specified country
    return events.filter(event => getCountryFromEvent(event) === country).length;
  };


  const handleCountryFilter = (country: string) => {
    setCountryFilter(country);
    setStateFilter("all"); // Reset state filter when country changes
  };



  const shouldShowState = (state: string): boolean => {
    if (countryFilter === "all") {
      return true;
    }


    const statesInCountry = events
    .filter(event => getCountryFromEvent(event) === countryFilter)
    .map(event => {
      if (event.state?.toUpperCase() === 'CA') {
        return isNorthernCalifornia(event.city) ? 'NorCal' : 'SoCal';
      }
      return event.state?.toUpperCase() || '';
    });
  
  return statesInCountry.includes(state);
};






















  // Dynamically create states array from events, plus add NorCal and SoCal
  const states = useMemo(() => {
    // Get unique states from events
    const uniqueStates = Array.from(
      new Set(
        events.map(event => event.state?.toUpperCase() || '')
      )
    ).filter(state => !!state); // Filter out empty values
    
    // If CA exists, remove it and add NorCal and SoCal instead
    const hasCA = uniqueStates.includes('CA');
    const statesWithoutCA = uniqueStates.filter(state => state !== 'CA');
    
    // Create final array with NorCal and SoCal (if CA exists) at the beginning
    const finalStates = hasCA 
      ? ["NorCal", "SoCal", ...statesWithoutCA]
      : [...statesWithoutCA];
      
    // If no states found, return default array
    return finalStates.length > 0 ? finalStates : ["NorCal", "SoCal", "TX", "CO", "ID", "WA", "NV"];
  }, [events]);

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const currentMonth = useMemo(() => new Date().getMonth(), []);
  
  // Generate either current month through December, or the full year based on timeFilter
  const months = useMemo(
    () => {
      // If viewing past events, show the full year
      if (timeFilter === "past") {
        return eachMonthOfInterval({
          start: startOfYear(new Date(currentYear, 0, 1)),
          end: endOfYear(new Date(currentYear, 11, 31)),
        });
      } 
      // Otherwise, show from current month through end of year
      else {
        return eachMonthOfInterval({
          start: new Date(currentYear, currentMonth, 1),
          end: endOfYear(new Date(currentYear, 11, 31)),
        });
      }
    },
    [currentYear, currentMonth, timeFilter]
  );

  const handleEventClick = (event: EventType) => {
    window.location.href = `/events/${event.promoterId}/${event.id}`;
  };

  useEffect(() => {
    const organizedEvents: { [state: string]: { [month: string]: EventType[] } } = {};

    // Initialize the structure for all states including NorCal and SoCal
    states.forEach((state) => {
      organizedEvents[state] = {};
      // For "all" time filter, ensure we have all months initialized even if not shown
      // This prevents issues when switching between time filters
      const monthsToInitialize = timeFilter === "all" ? 
        eachMonthOfInterval({
          start: startOfYear(new Date(currentYear, 0, 1)),
          end: endOfYear(new Date(currentYear, 11, 31)),
        }) : 
        months;
        
      monthsToInitialize.forEach((month) => {
        organizedEvents[state][format(month, "MMM")] = [];
      });
    });

    // Filter events based on date, status, and time filter
    const filteredEvents = events.filter(event => {
      // Apply country filter first
      if (countryFilter !== "all" && getCountryFromEvent(event) !== countryFilter) {
        return false;
      }
      
      // Apply other filters
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
  
  // Function to get count of events for each state
  const getEventCountByState = (state: string): number => {
    let count = 0;
    Object.keys(eventsByStateAndMonth[state] || {}).forEach(month => {
      count += eventsByStateAndMonth[state][month].length;
    });
    return count;
  };
  
  // Reference for row heights
  const rowRefs = React.useRef<{[key: string]: React.RefObject<HTMLTableRowElement | null>}>({});
  const stateRowRefs = React.useRef<{[key: string]: React.RefObject<HTMLDivElement | null>}>({});
  
  // Initialize refs for each state
  React.useEffect(() => {
    states.forEach(state => {
      if (!rowRefs.current[state]) {
        rowRefs.current[state] = React.createRef<HTMLTableRowElement>();
      }
      if (!stateRowRefs.current[state]) {
        stateRowRefs.current[state] = React.createRef<HTMLDivElement>();
      }
    });
  }, [states]);
  
  // Sync heights between table rows and fixed column
  React.useEffect(() => {
    // Wait for render to complete
    const syncHeights = () => {
      states
        .filter(state => stateFilter === "all" || state === stateFilter)
        .forEach(state => {
          const tableRow = rowRefs.current[state]?.current;
          const stateRow = stateRowRefs.current[state]?.current;
          
          if (tableRow && stateRow) {
            // Set fixed column height to match table row height
            stateRow.style.height = `${tableRow.offsetHeight}px`;
          }
        });
    };
    
    // Initial sync with small delay to ensure DOM is ready
    const timer = setTimeout(syncHeights, 100);
    
    // Re-sync after images might have loaded
    const timer2 = setTimeout(syncHeights, 500);
    
    return () => {
      clearTimeout(timer);
      clearTimeout(timer2);
    };
  }, [states, stateFilter, eventsByStateAndMonth, months]);
  
  // Re-sync heights when window is resized
  React.useEffect(() => {
    const handleResize = () => {
      states
        .filter(state => stateFilter === "all" || state === stateFilter)
        .forEach(state => {
          const tableRow = rowRefs.current[state]?.current;
          const stateRow = stateRowRefs.current[state]?.current;
          
          if (tableRow && stateRow) {
            stateRow.style.height = `${tableRow.offsetHeight}px`;
          }
        });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [states, stateFilter]);

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
                {filterType === 'past' && (
                  <span className="text-xs text-gray-500">(shows full year)</span>
                )}
                {filterType === 'upcoming' && (
                  <span className="text-xs text-gray-500">(from current month)</span>
                )}
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
          





          {/* State filter buttons */}
        
        
          <div className="p-4 bg-white rounded-lg border-t-8 border-black shadow-md">
  {/* Country filter */}
  <div className="mb-5">
    <div className="flex items-center mb-3">
      <span className="text-sm font-bold text-black mr-2 uppercase pixel-font">Select Country:</span>
    </div>
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => handleCountryFilter("all")}
        className={`px-4 py-2 text-sm transition-all rounded border-2 ${
          countryFilter === "all" 
            ? "bg-black text-white border-black transform -translate-y-1 shadow-md" 
            : "bg-white text-black border-gray-400 hover:bg-gray-100"
        }`}
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        ALL
      </button>
      {countries.map(country => {
        // Skip countries with no events
        const eventCount = getEventCountByCountry(country);
        if (eventCount === 0) return null;
        
        return (
          <button
            key={country}
            onClick={() => handleCountryFilter(country)}
            className={`relative px-4 py-2 text-sm transition-all rounded border-2 flex items-center ${
              countryFilter === country 
                ? "bg-black text-white border-black transform -translate-y-1 shadow-md" 
                : "bg-white text-black border-gray-400 hover:bg-gray-100"
            }`}
            title={`${eventCount} events in ${country}`}
            style={{ fontFamily: "'Press Start 2P', monospace" }}
          >
            {country}
            <span className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs rounded-full ${
              countryFilter === country 
                ? "bg-white text-black border border-black" 
                : "bg-black text-white border border-white"
            }`}>
              {eventCount}
            </span>
          </button>
        );
      })}
    </div>
  </div>

  {/* State filter - only show when a specific country is selected or all countries */}
  <div className="border-t border-gray-200 pt-4">
    <div className="flex items-center mb-3">
      <span className="text-sm font-bold text-black mr-2 uppercase pixel-font">
        {countryFilter === 'all' ? 'Select Region:' : `Select ${countryFilter} Region:`}
      </span>
    </div>
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => setStateFilter("all")}
        className={`px-4 py-2 text-sm transition-all rounded border-2 ${
          stateFilter === "all" 
            ? "bg-black text-white border-black transform -translate-y-1 shadow-md" 
            : "bg-white text-black border-gray-400 hover:bg-gray-100"
        }`}
        style={{ fontFamily: "'Press Start 2P', monospace" }}
      >
        ALL
      </button>
      {states
        .filter(state => {
          // Show states with events from the selected country
          return getEventCountByState(state) > 0 && shouldShowState(state);
        })
        .map(state => {
          const eventCount = getEventCountByState(state);
          return (
            <button
              key={state}
              onClick={() => setStateFilter(state)}
              className={`relative px-4 py-2 text-sm transition-all rounded border-2 flex items-center ${
                stateFilter === state 
                  ? "bg-black text-white border-black transform -translate-y-1 shadow-md" 
                  : "bg-white text-black border-gray-400 hover:bg-gray-100"
              }`}
              title={`${eventCount} events in ${state}`}
              style={{ fontFamily: "'Press Start 2P', monospace" }}
            >
              {state}
              <span className={`absolute -top-2 -right-2 w-5 h-5 flex items-center justify-center text-xs rounded-full ${
                stateFilter === state 
                  ? "bg-white text-black border border-black" 
                  : "bg-black text-white border border-white"
              }`}>
                {eventCount}
              </span>
            </button>
          );
        })}
    </div>
  </div>
</div>




        </div>

        <div className="relative overflow-x-auto" style={{ paddingLeft: '96px' }}>
          {/* Fixed first column overlay */}
          <div className="absolute left-0 top-0 bottom-0 z-10 w-24 shadow-md">
            <div 
              className="sticky top-0 bg-gray-100 w-full border-b border-r border-gray-300 flex items-center justify-start px-4 py-2 font-medium"
              style={{ height: '42px' }} // Match TableHead height including borders
            >
              State
            </div>
            {states
              .filter(state => stateFilter === "all" || state === stateFilter)
              .map((state, index) => (
                <div 
                  key={state} 
                  ref={stateRowRefs.current[state]}
                  className={`w-full bg-gray-50 px-4 py-2 font-medium border-b border-r border-gray-300 flex items-center ${
                    index % 2 === 1 ? 'bg-gray-50' : 'bg-white'
                  }`}
                >
                  {state}
                </div>
              ))
            }
          </div>
          
          <Table className="w-full border-collapse">
            <TableHeader>
              <TableRow>
                {/* Invisible first column to maintain spacing */}
                <TableHead className="w-24 bg-transparent border-transparent h-10"></TableHead>
                {months.map((month) => {
                  const monthName = format(month, "MMM");
                  const isCurrentMonth = month.getMonth() === new Date().getMonth();
                  return (
                    <TableHead 
                      key={monthName}
                      className={`min-w-[150px] text-center h-10 ${
                        isCurrentMonth ? 'bg-blue-100' : 'bg-gray-100'
                      }`}
                    >
                      {monthName}
                      {isCurrentMonth && (
                        <span className="block text-xs font-normal text-blue-700">Current</span>
                      )}
                    </TableHead>
                  );
                })}
              </TableRow>
            </TableHeader>
            <TableBody className="z-0">{/* Apply z-index to ensure it sits behind the fixed column */}
              {states
                .filter(state => stateFilter === "all" || state === stateFilter)
                .map((state) => (
                <TableRow 
                  key={state} 
                  ref={rowRefs.current[state]} 
                  className="border-b border-gray-200"
                >
                  {/* Invisible first cell to maintain spacing */}
                  <TableCell className="w-24 px-0 py-0 border-transparent"></TableCell>
                  {months.map((month) => {
                    const monthKey = format(month, "MMM");
                    const monthEvents = eventsByStateAndMonth[state]?.[monthKey] || [];
                    return (


                    <TableCell key={monthKey} className="p-2 align-top">
  {monthEvents.length > 0 ? (
    <div className="grid grid-cols-1 gap-2 justify-items-center w-32 mx-auto">
      {monthEvents.map((event) => {
        const isPastEvent = isPast(parseISO(event.date));
        return (
          <Card
            key={event.id}
            className={`relative transition-colors cursor-pointer h-32 w-32 flex flex-col overflow-hidden ${
              event.status === 'confirmed' ? 'bg-green-50 hover:bg-green-100' :
              event.status === 'approved' ? 'bg-blue-50 hover:bg-blue-100' :
              event.status === 'pending' ? 'bg-orange-50 hover:bg-orange-100' : 'bg-white'
            } ${isPastEvent ? 'opacity-50' : ''}`}
            onClick={() => handleEventClick(event)}
          >
            {/* Flyer background with opacity */}
            {event.flyer && (
              <div 
                className="absolute inset-0 bg-no-repeat bg-center bg-cover opacity-20 z-0"
                style={{ backgroundImage: `url(${event.flyer})` }}
                aria-hidden="true"
              />
            )}
            
            <CardHeader className="p-2 flex-1 flex flex-col relative z-10">
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
                      <span className="font-bold">PENDING</span>
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
</TableCell>
                    );
                  })}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </>
  );
};

export default MonthTable;