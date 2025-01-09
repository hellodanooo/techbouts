// MonthTable.tsx
import React, { useState, useMemo } from 'react';
import { Event, Promoter } from '../../utils/types';
import { format, parseISO, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { useRouter } from 'next/navigation'; // Add this import


interface Props {
  events: Event[];
  promoters: Promoter[];
  isAuthorized: boolean;
}

const MonthTable: React.FC<Props> = ({ events, promoters, isAuthorized }) => {
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const router = useRouter(); // Add this hook

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const months = useMemo(() => 
    eachMonthOfInterval({
      start: startOfYear(new Date(currentYear, 0, 1)),
      end: endOfYear(new Date(currentYear, 11, 31))
    }),
    [currentYear]
  );


  const navToEventPage = (eventId: string, competition_type: 'Tournament' | 'Fightcard') => {
    if (competition_type === 'Fightcard') {
      router.push(`/fightcard/${eventId}`);
    } else if (competition_type === 'Tournament') {
      router.push(`/tournament/${eventId}`);
    }
  };


  // Organize events by promoter and month
  const eventsByPromoterAndMonth = useMemo(() => {
    const organized: { [key: string]: { [key: string]: Event[] } } = {};
    
    // Initialize structure
    promoters.forEach(promoter => {
      organized[promoter.name] = {};
      months.forEach(month => {
        organized[promoter.name][format(month, 'MMM')] = [];
      });
    });

    // Filter and organize events
    const filteredEvents = events.filter(event => {
      if (eventTypeFilter === "all") return true;
      if (eventTypeFilter === "confirmed") return event.status === "confirmed";
      if (eventTypeFilter === "pending") return event.status === "pending";
      return true;
    });

    filteredEvents.forEach(event => {
      if (event.promoterId && event.date) {
        const monthKey = format(parseISO(event.date), 'MMM');
        const promoter = promoters.find(p => 
          p.promoterId === event.promoterId || 
          p.name.toLowerCase() === event.promoterId.toLowerCase()
        );
        
        if (promoter && organized[promoter.name]?.[monthKey]) {
          organized[promoter.name][monthKey].push(event);
        }
      }
    });

    return organized;
  }, [events, promoters, months, eventTypeFilter]);

  const renderEvent = (event: Event) => {
    const getBackgroundColor = () => {
      switch (event.status) {
        case 'confirmed': return '#ecfdf5';
        case 'approved': return '#f0f9ff';
        case 'pending': return '#fff7ed';
        default: return '#ffffff';
      }
    };

    return (
      <div 
        key={event.id}

        onClick={() => navToEventPage(event.id, event.competition_type as 'Tournament' | 'Fightcard')}
        
        style={{
          fontSize: '0.875rem',
          padding: '0.25rem 0.5rem',
          margin: '0.25rem 0',
          backgroundColor: getBackgroundColor(),
          borderRadius: '0.25rem',
          cursor: isAuthorized ? 'pointer' : 'default',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{fontSize:'10px'}}>{event.competition_type}</div>
        {event.event_name}<br />
        {event.city}, {event.state}<br />
        {format(parseISO(event.date), 'MMM d, yyyy')}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div>is authorized {isAuthorized}</div>
      <div className="flex items-center justify-start p-4 bg-white rounded-lg shadow-sm">
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
                {filterType !== 'all' ? ' Only' : ' Events'}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse bg-white rounded-lg">
          <thead>
            <tr>
              <th className="sticky left-0 bg-gray-100 z-10 p-2 border-b-2 w-20">
                Promoter
              </th>
              {months.map(month => (
                <th key={format(month, 'MMM')} className="p-4 text-center bg-gray-100 border-b-2 min-w-[120px]">
                  {format(month, 'MMM')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {promoters.map(promoter => (
              <tr key={promoter.name}>
                <td className="sticky left-0 bg-white z-10 p-2 border-b text-sm font-semibold capitalize">
                  {promoter.name}
                </td>
                {months.map(month => {
                  const monthKey = format(month, 'MMM');
                  const monthEvents = eventsByPromoterAndMonth[promoter.name]?.[monthKey] || [];
                  
                  return (
                    <td key={monthKey} className="p-2 border-b min-w-[120px]">
                      {monthEvents.map(event => renderEvent(event))}
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