"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Event } from "../utils/types";
import { format, parseISO, eachMonthOfInterval, startOfYear, endOfYear } from "date-fns";

interface MonthTableProps {
  events: Event[];
}

const MonthTable: React.FC<MonthTableProps> = ({ events }) => {
  const pmtLogo = '/logos/pmt_logo_2024_sm.png';



  const [eventsByStateAndMonth, setEventsByStateAndMonth] = useState<{
    [state: string]: { [month: string]: Event[] };
  }>({});

  const states = useMemo(() => ["CA", "TX", "CO", "ID"], []); // Displayed states
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const months = useMemo(
    () =>
      eachMonthOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 11, 31)),
      }),
    [currentYear]
  );

  useEffect(() => {
    // Compute the organized events only once or when dependencies change
    const organizedEvents: { [state: string]: { [month: string]: Event[] } } = {};

    // Initialize the structure based on states and months
    states.forEach((state) => {
      organizedEvents[state] = {};
      months.forEach((month) => {
        organizedEvents[state][format(month, "MMM")] = [];
      });
    });

    // Organize events by state and month
    events.forEach((event) => {
      if (event.state && event.date) {
        const state = event.state.toUpperCase(); // Ensure state matches format
        const monthKey = format(parseISO(event.date), "MMM");

        if (organizedEvents[state]?.[monthKey]) {
          organizedEvents[state][monthKey].push(event);
        }
      }
    });

    setEventsByStateAndMonth(organizedEvents);
  }, [events, months, states]); // Dependencies are stable

  return (
    <div>
      <h2 className="text-lg font-bold mb-4">Events Table</h2>
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
                <td className="px-4 py-2 border border-gray-300 bg-gray-50">{state}</td>
                {months.map((month) => {
                  const monthKey = format(month, "MMM");
                  const monthEvents = eventsByStateAndMonth[state]?.[monthKey] || [];
                  return (
                    <td key={monthKey} className="px-4 py-2 border border-gray-300">
                     {monthEvents.length > 0 ? (
  monthEvents.map((event) => (
    <div
      key={event.id}
      className={`mb-2 p-4 border border-gray-200 rounded-md bg-white hover:bg-gray-50 shadow-sm relative`}
    >
      {event.sanctioning === "PMT" && (
        <div
          className="absolute inset-0 opacity-10 z-0"
          style={{
            backgroundImage: `url(${pmtLogo})`,
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            backgroundPosition: "center",
          }}
        ></div>
      )}
      <div className="relative z-10">
        <p className="font-semibold text-gray-800 flex items-center">
          <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
          {event.event_name}
        </p>
        <p className="text-sm text-gray-600">
          {format(parseISO(event.date), "MMM d, yyyy")}
        </p>
      </div>
    </div>
  ))
) : (
  <span className="text-sm text-gray-400">No events</span>
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
  );
};

export default MonthTable;
