import React, { useState, useEffect } from 'react';
import { EventType } from '../../utils/types';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, parseISO, addMonths, subMonths } from 'date-fns';
import { MdChevronLeft, MdChevronRight } from 'react-icons/md';
import styles from '@/styles/calendar.module.css';



const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EventType | null>(null);
  const [events, setEvents] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        console.log('Calendar: Fetching events...');
        const response = await fetch('/api/pmt/events');
        const data = await response.json();
        console.log('Calendar: Received events:', data.events);
        
        if (data.events) {
          setEvents(data.events);
        }
      } catch (error) {
        console.error('Calendar: Error fetching events:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const firstDayOfMonth = startOfMonth(currentDate);
  const lastDayOfMonth = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: firstDayOfMonth, end: lastDayOfMonth });
  const firstDayOfWeek = firstDayOfMonth.getDay();

  const weeks: (Date | null)[][] = [];
  let currentWeek: (Date | null)[] = Array(firstDayOfWeek).fill(null);

  daysInMonth.forEach(day => {
    currentWeek.push(day);
    if (currentWeek.length === 7) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  });

  if (currentWeek.length > 0) {
    while (currentWeek.length < 7) {
      currentWeek.push(null);
    }
    weeks.push(currentWeek);
  }

  const getEventsForDate = (date: Date | null) => {
    if (!date) return [];
    const matchingEvents = events.filter(event => {
      try {
        return isSameDay(parseISO(event.date), date);
      } catch (error) {
        console.error('Error comparing dates:', error);
        return false;
      }
    });
    //console.log(`Calendar: Events for ${date}:`, matchingEvents);
    return matchingEvents;
  };

  if (loading) {
    return <div>Loading events...</div>;
  }

  const previousMonth = () => setCurrentDate(subMonths(currentDate, 1));
  const nextMonth = () => setCurrentDate(addMonths(currentDate, 1));

  return (

    <div 
    style={{
        display:'flex',
        flexDirection:'column',
        justifyContent:'center',
        alignItems:'center',
      

    }}
    >
      <div style={{
        display:'flex',
        flexDirection:'column',
        justifyContent:'center',
        alignItems:'center'
      }}>

        <h1 className="text-3xl font-bold mb-4 text-white">Event Calendar</h1>
        
      
        <div style={{
            display:'flex',
            width:'100%',
            justifyContent:'center'
        }}>
          <button 
            onClick={previousMonth}
            className={styles.navigationButton}
          >
            <MdChevronLeft
            style={{
                
            }}
            />
          </button>
          
          <h2 className={styles.monthTitle}>
            {format(currentDate, 'MMMM yyyy')}
          </h2>
          
          <button 
            onClick={nextMonth}
            className={styles.navigationButton}
          >
            <MdChevronRight className="w-6 h-6" />
          </button>
        </div>


        <div className={styles.calendarContainer}>

          <table
          style={{
            width:'100%'
          }}
          >
            <thead className={styles.calendarHeader}>
              <tr>
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <th key={day} className={styles.calendarHeaderCell}>
                    {day}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {weeks.map((week, weekIndex) => (
                <tr key={weekIndex}>
                  {week.map((day, dayIndex) => {
                    const dayEvents = getEventsForDate(day);
                    const isToday = day ? isSameDay(day, new Date()) : false;
                    
                    return (
                      <td 
                        key={dayIndex}
                        className={`${styles.calendarCell} 
                          ${!day ? styles.emptyCell : ''}
                          ${isToday ? styles.todayCell : ''}`}
                      >
                        {day && (
                          <div className="h-full">
                            <div className={styles.dateNumber}>
                              {format(day, 'd')}
                            </div>
                            <div>
                              {dayEvents.map(event => (
                                <div
                                  key={event.id}
                                  onClick={() => setSelectedEvent(event)}
                                  className={styles.eventItem}
                                >
                                  {event.event_name}
                                </div>
                              ))}
                            </div>
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


      {selectedEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className={`${styles.calendarContainer} p-6 max-w-lg w-full`}>
            <h3 className="text-xl font-bold mb-4 text-black">{selectedEvent.event_name}</h3>
            <div className="space-y-2 text-black">
              <p><strong>Date:</strong> {format(parseISO(selectedEvent.date), 'MMMM d, yyyy')}</p>
              <p><strong>Location:</strong> {selectedEvent.city}, {selectedEvent.state}</p>
              <p><strong>Address:</strong> {selectedEvent.address}</p>
              {selectedEvent.flyer && (
                <img 
                  src={selectedEvent.flyer} 
                  alt="Event Flyer" 
style={{
    width:'70%'
}}
                  />
              )}
            </div>
            <button
              onClick={() => setSelectedEvent(null)}
              className={`${styles.eventItem} w-full mt-4`}
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  );
};




export default CalendarPage;