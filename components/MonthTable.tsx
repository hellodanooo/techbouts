"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Event } from "../utils/types";
import { format, parseISO, eachMonthOfInterval, startOfYear, endOfYear, isPast } from "date-fns";
//import EventOptions from "@/components/edit/EditEvent";
// import {
//   Dialog,
//   DialogContent,
//   DialogHeader,
//   DialogTitle,
// } from "@/components/ui/dialog";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

interface MonthTableProps {
  events: Event[];
  isPromoter?: boolean;
  isAdmin?: boolean;
  activeSanctioning?: string;
}

const MonthTable: React.FC<MonthTableProps> = ({ events, isAdmin, isPromoter, activeSanctioning }) => {
 // const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  //const [isDialogOpen, setIsDialogOpen] = useState(false);
  //const [lastTap, setLastTap] = useState<number>(0);
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [timeFilter, setTimeFilter] = useState("all"); // New time filter state
 // const DOUBLE_CLICK_DELAY = 300;
  const [eventsByStateAndMonth, setEventsByStateAndMonth] = useState<{
    [state: string]: { [month: string]: Event[] };
  }>({});
  const states = useMemo(() => ["CA", "TX", "CO", "ID", "WA"], []);
  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const months = useMemo(
    () =>
      eachMonthOfInterval({
        start: startOfYear(new Date(currentYear, 0, 1)),
        end: endOfYear(new Date(currentYear, 11, 31)),
      }),
    [currentYear]
  );

  const handleEventClick = (event: Event) => {


 event.sanctioning = 'PMT';

    console.log('isAdmin', isAdmin);
    console.log('isPromoter', isPromoter);
    console.log('event', event);
    console.log ('PromoterId', event.promoterId);
    console.log ('EventId', event.id);
    console.log ('Sanctioning', activeSanctioning);

    // const currentTime = new Date().getTime();
    // const tapLength = currentTime - lastTap;
    // if (tapLength < DOUBLE_CLICK_DELAY && tapLength > 0 && isAdmin) {
    //   setSelectedEvent(event);
    //   setIsDialogOpen(true);
    // } else if (tapLength >= DOUBLE_CLICK_DELAY || lastTap === 0) {
    //   if (event.sanctioning === 'PMT') {
    //     window.location.href = `/promoters/${event.promoterId}/pmt/${event.id}`;
    //   } else if (event.sanctioning === 'PMT') {
    //     window.location.href = `/promoters/${event.promoterId}/events/ikf/${event.id}`;
    //   }
    // }
    // setLastTap(currentTime);

    if (event.sanctioning === 'PMT') {
           window.location.href = `/promoters/${event.promoterId}/pmt/${event.id}`;
         } else if (event.sanctioning === 'PMT') {
           window.location.href = `/promoters/${event.promoterId}/events/ikf/${event.id}`;
         }


  };

  useEffect(() => {
    const organizedEvents: { [state: string]: { [month: string]: Event[] } } = {};

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

      // Apply time filter
      if (timeFilter === "upcoming" && isPastEvent) return false;
      if (timeFilter === "past" && !isPastEvent) return false;

      // Apply status filter
      if (eventTypeFilter === "confirmed") return event.status === "confirmed";
      if (eventTypeFilter === "pending") return event.status === "pending";
      return true;
    });

    filteredEvents.forEach((event) => {
      if (event.date) {
        const state = (event.state || '').toUpperCase();
        const monthKey = format(parseISO(event.date), "MMM");

        if (!organizedEvents[state]) {
          organizedEvents[state] = {};
          months.forEach((month) => {
            organizedEvents[state][format(month, "MMM")] = [];
          });
        }

        if (organizedEvents[state]?.[monthKey]) {
          organizedEvents[state][monthKey].push(event);
        }
      }
    });

    setEventsByStateAndMonth(organizedEvents);
  }, [events, months, states, eventTypeFilter, timeFilter]); // Added timeFilter as dependency

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
                  <td className="px-4 py-2 border border-gray-300 bg-gray-50">{state}</td>
                  {months.map((month) => {
                    const monthKey = format(month, "MMM");
                    const monthEvents = eventsByStateAndMonth[state]?.[monthKey] || [];
                    return (
                      <td key={monthKey} className="px-4 py-2 border border-gray-300">
                        {monthEvents.length > 0 ? (
                          <div className="space-y-2">
                            {monthEvents.map((event) => {
                              const isPastEvent = isPast(parseISO(event.date));
                              return (
                                <Card
                                  key={event.id}
                                  className={`transition-colors cursor-pointer ${
                                    event.status === 'confirmed' ? 'bg-green-50 hover:bg-green-100' :
                                    event.status === 'approved' ? 'bg-blue-50 hover:bg-blue-100' :
                                    event.status === 'pending' ? 'bg-orange-50 hover:bg-orange-100' : 'bg-white'
                                  } ${isPastEvent ? 'opacity-50' : ''}`}
                                  onClick={() => handleEventClick(event)}

                                >
                                  <CardHeader className="p-2">
                                    <CardTitle className="text-sm">{event.event_name}</CardTitle>
                                    <CardDescription>
                                      {format(parseISO(event.date), "MMM d, yyyy")}
                                    </CardDescription>
                                  </CardHeader>
                                </Card>
                              );
                            })}
                          </div>
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


{/* DOUBLE CLICK QUICK EDIT FOR ADMIN */}

      {/* <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Event Options</DialogTitle>
          </DialogHeader>
          {selectedEvent && <EventOptions event={selectedEvent} />}
        </DialogContent>
      </Dialog> */}
    </>
  );
};

export default MonthTable;