// app/promoter/MonthTable.tsx
import React, { useEffect, useState, useMemo } from 'react';
import { Event, PROMOTER_OPTIONS } from '../../utils/types';
import { format, parseISO, eachMonthOfInterval, startOfYear, endOfYear } from 'date-fns';
import { approvePendingEvent } from '../../utils/eventManagement';

interface PendingEvent {
  id: string;
  event_name: string;
  city: string;
  state: string;
  date: string;
  registration_fee: number;  
  promoterId: string;
  promoterEmail: string; 
}

interface EventAdminActions {
  onStatusToggle: (newStatus: 'approved' | 'pending') => void;
  onDelete: () => void;
  status: 'approved' | 'pending';  
  event: Event;
}




interface MonthTableProps {
  initialEvents: Event[];
  initialPendingEvents: Event[];
  isAuthorized?: boolean;

}

const EventActions: React.FC<EventAdminActions> = ({ onStatusToggle, onDelete, status, event }) => {
  const nextStatus = status === 'approved' ? 'pending' : 'approved';
  const formattedDate = event.date ? format(parseISO(event.date), 'MMM d, yyyy') : 'No date';

  return (
    <div style={{
      position: 'absolute',
      zIndex: 50,
      backgroundColor: 'white',
      borderRadius: '0.5rem',
      padding: '1rem',
      border: '1px solid #e5e7eb',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      minWidth: '300px',
    }}>
      {/* Event Details Section */}
      <div style={{
        borderBottom: '1px solid #e5e7eb',
        marginBottom: '1rem',
        paddingBottom: '1rem'
      }}>
        <h3 style={{
          fontSize: '1rem',
          fontWeight: 600,
          marginBottom: '0.5rem',
          color: '#111827'
        }}>
          {event.event_name}
        </h3>
        <div style={{
          fontSize: '0.875rem',
          color: '#4b5563',
          display: 'grid',
          gap: '0.25rem'
        }}>
          <div>
            <strong>Date:</strong> {formattedDate}
          </div>
          <div>
            <strong>Location:</strong> {event.city}, {event.state}
          </div>
          <div>
            <strong>Promoter:</strong> {event.promoterId}
          </div>
          {event.promoterEmail && (
            <div>
              <strong>Email:</strong> {event.promoterEmail}
            </div>
          )}
          {event.registration_fee !== undefined && (
            <div>
              <strong>Registration Fee:</strong> ${event.registration_fee}
            </div>
          )}
          {event.event_details && (
            <div>
              <strong>Details:</strong> {event.event_details}
            </div>
          )}
          <div>
            <strong>Status:</strong> <span style={{
              color: status === 'approved' ? '#059669' : '#d97706',
              fontWeight: 500
            }}>{status}</span>
          </div>
        </div>
      </div>

      {/* Actions Section */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '0.5rem'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0.5rem',
          backgroundColor: '#f9fafb',
          borderRadius: '0.375rem'
        }}>
          <label style={{ 
            position: 'relative',
            display: 'inline-flex',
            alignItems: 'center',
            cursor: 'pointer',
            width: '100%'
          }}>
            <input
              type="checkbox"
              checked={status === 'approved'}
              onChange={() => onStatusToggle(nextStatus)}
              style={{ position: 'absolute', width: '1px', height: '1px', padding: '0', margin: '-1px', overflow: 'hidden', clip: 'rect(0,0,0,0)', whiteSpace: 'nowrap', border: '0' }}
            />
            <div style={{
              width: '2.75rem',
              height: '1.5rem',
              backgroundColor: status === 'approved' ? '#2563eb' : '#e5e7eb',
              borderRadius: '9999px',
              position: 'relative',
              transition: 'background-color 0.2s'
            }}>
              <div style={{
                position: 'absolute',
                top: '2px',
                left: status === 'approved' ? 'calc(100% - 1.25rem - 2px)' : '2px',
                width: '1.25rem',
                height: '1.25rem',
                backgroundColor: 'white',
                borderRadius: '50%',
                transition: 'left 0.2s',
                border: '1px solid #d1d5db'
              }} />
            </div>
            <span style={{ marginLeft: '0.75rem', fontSize: '0.875rem', fontWeight: 500 }}>
              Change to {nextStatus}
            </span>
          </label>
        </div>

        <button
          onClick={onDelete}
          style={{
            display: 'flex',
            alignItems: 'center',
            width: '100%',
            padding: '0.5rem',
            color: '#dc2626',
            backgroundColor: '#fef2f2',
            borderRadius: '0.375rem',
            border: '1px solid #fee2e2',
            cursor: 'pointer',
            fontSize: '0.875rem',
            fontWeight: 500,
            transition: 'all 0.2s'
          }}
          onMouseEnter={e => {
            e.currentTarget.style.backgroundColor = '#fee2e2';
            e.currentTarget.style.borderColor = '#fecaca';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = '#fef2f2';
            e.currentTarget.style.borderColor = '#fee2e2';
          }}
        >
          Delete Event
        </button>
      </div>
    </div>
  );
};



const MonthTable: React.FC<MonthTableProps> = ({ 
  initialEvents, 
  initialPendingEvents,
  isAuthorized 
}) => {
  const [events, setEvents] = useState<Event[]>(initialEvents);
  const [pendingEvents, setPendingEvents] = useState<Event[]>(initialPendingEvents);
  const [eventsByPromoterAndMonth, setEventsByPromoterAndMonth] = useState<{ [key: string]: { [key: string]: Event[] } }>({});
  const [eventTypeFilter, setEventTypeFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);

  // Authentication state
  const [isAuthenticated, setIsAuthenticated] = useState(false); // Default false
  const [selectedEventForActions, setSelectedEventForActions] = useState<Event | null>(null);
  const [showActions, setShowActions] = useState(false);

  // Sync authentication state with isAuthorized
  useEffect(() => {
    setIsAuthenticated(isAuthorized || false); // Automatically update isAuthenticated
  }, [isAuthorized]);

  useEffect(() => {
    console.log('Pending Events Received in Month Table:', initialPendingEvents);
  }, [initialPendingEvents]);




  useEffect(() => {
    console.log('Pending Events Received in Month Table:', initialPendingEvents);
  }, [initialPendingEvents]);


  const deleteEvent = async (event: Event) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this event?');
    
    if (confirmDelete) {
      setIsLoading(true);
      try {
        let endpoint;
        console.log('Deleting event with status:', event.status);
        
        switch(event.status) {
          case 'pending':
          case 'approved':
            endpoint = `/api/pmt/promoterEvents/${event.id}`;
            break;
          case 'confirmed':
            endpoint = `/api/pmt/events/${event.id}`;
            break;
          default:
            console.error('Unknown event status:', event.status);
            throw new Error(`Invalid event status: ${event.status}`);
        }
        
        const response = await fetch(endpoint, {
          method: 'DELETE',
        });
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        await refreshEvents();
        setShowActions(false);
        setSelectedEventForActions(null);
        
      } catch (error) {
        console.error('Error deleting event:', error);
        alert(`Error deleting event: ${error instanceof Error ? error.message : 'Unknown error'}`);
      } finally {
        setIsLoading(false);
      }
    }
  }; 
  
  
  //   const confirmDelete = window.confirm('Are you sure you want to delete this event?');
    
  //   if (confirmDelete) {
  //     setIsLoading(true);
  //     try {
  //       let endpoint;
  //       console.log('Deleting event with status:', event.status);
        
  //       switch(event.status) {
  //         case 'pending':
  //         case 'approved':
  //           endpoint = `/api/pmt/promoterEvents/${event.id}`;
  //           break;
  //         case 'confirmed':
  //           endpoint = `/api/pmt/events/${event.id}`;
  //           break;
  //         default:
  //           console.error('Unknown event status:', event.status);
  //           throw new Error(`Invalid event status: ${event.status}`);
  //       }
        
  //       const response = await fetch(endpoint, {
  //         method: 'DELETE',
  //       });
        
  //       if (!response.ok) {
  //         throw new Error(`HTTP error! status: ${response.status}`);
  //       }
        
  //       const [eventsResponse, pendingEventsResponse] = await Promise.all([
  //         fetch('/api/pmt/events'),
  //         fetch('/api/pmt/promoterEvents')
  //       ]);
        
  //       if (!eventsResponse.ok || !pendingEventsResponse.ok) {
  //         throw new Error('Failed to refresh events after deletion');
  //       }
        
  //       const eventsData = await eventsResponse.json();
  //       const pendingData = await pendingEventsResponse.json();
        
  //       setEvents(eventsData.events);
  //       setPendingEvents(pendingData.events);
  //       setShowActions(false);
  //       setSelectedEventForActions(null);
        
  //     } catch (error) {
  //       console.error('Error deleting event:', error);
  //       alert(`Error deleting event: ${error instanceof Error ? error.message : 'Unknown error'}`);
  //     } finally {
  //       setIsLoading(false);
  //     }
  //   }
  // };

 
  const handleEventClick = (event: Event) => {
    if (!isAuthenticated) {
  
    } else {
      // If already authenticated, just show the action buttons
// 
      setSelectedEventForActions(event);
      setShowActions(true);
    }
  };

  const handleActionSelect = async (event: Event, action: 'status-toggle' | 'delete') => {
    setShowActions(false);
    
    if (action === 'status-toggle') {
      setIsLoading(true);
      try {
        const newStatus = event.status === 'approved' ? 'pending' : 'approved';
        
        if (newStatus === 'approved') {
          // Format event data for approval
          const pendingEvent: PendingEvent = {
            id: event.id,
            event_name: event.event_name,
            city: event.city,
            state: event.state,
            date: event.date,
            registration_fee: event.registration_fee,
            promoterId: event.promoterId || '',
            promoterEmail: event.promoterEmail || ''
          };
  
          // Call approvePendingEvent first
          const result = await approvePendingEvent(pendingEvent);
          
          if (!result.success) {
            throw new Error(result.message || 'Failed to approve event');
          }
  
          // If approval successful, send email
          await sendApprovalEmail(event);
        } else {
          // If setting to pending, use the regular PATCH endpoint
          const response = await fetch(`/api/pmt/promoterEvents/${event.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus, eventId: event.id }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to update status to pending');
          }
        }
  
        await refreshEvents();
      } catch (error) {
        console.error('Error updating event status:', error);
        alert('Error updating event status: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setIsLoading(false);
      }
    } else if (action === 'delete') {
      await deleteEvent(event);
    }
  };


  const sendApprovalEmail = async (event: Event) => {
    try {
      const emailResponse = await fetch('/api/pmt/pendingEventEmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          emailType: 'approval',
          event_name: event.event_name,
          date: event.date,
          city: event.city,
          state: event.state,
          promoterId: event.promoterId,
          promoterEmail: event.promoterEmail
        }),
      });
  
      if (!emailResponse.ok) {
        throw new Error('Failed to send approval email');
      }
    } catch (error) {
      console.error('Failed to send approval email:', error);
      alert('Event was approved but there was an error sending the notification email');
    }
  }; 
   //   const emailResponse = await fetch('/api/pmt/pendingEventEmail', {
  //     method: 'POST',
  //     headers: { 'Content-Type': 'application/json' },
  //     body: JSON.stringify({
  //       emailType: 'approval',
  //       event_name: event.event_name,
  //       date: event.date,
  //       city: event.city,
  //       state: event.state,
  //       promoterId: event.promoterId,
  //       promoterEmail: event.promoterEmail
  //     }),
  //   });

  //   if (!emailResponse.ok) {
  //     console.error('Failed to send approval email');
  //     alert('Event was approved but there was an error sending the notification email');
  //   }
  // };

  // // Helper function to refresh events

 const refreshEvents = async () => {
  try {
    const [eventsResponse, pendingEventsResponse] = await Promise.all([
      fetch('/api/pmt/events'),
      fetch('/api/pmt/promoterEvents')
    ]);
    
    if (!eventsResponse.ok || !pendingEventsResponse.ok) {
      throw new Error('Failed to refresh events');
    }
    
    const eventsData = await eventsResponse.json();
    const pendingData = await pendingEventsResponse.json();
    
    setEvents(eventsData.events);
    setPendingEvents(pendingData.events);
  } catch (error) {
    console.error('Error refreshing events:', error);
  }
};
  

  const currentYear = useMemo(() => new Date().getFullYear(), []);
  const months = useMemo(() => 
    eachMonthOfInterval({
      start: startOfYear(new Date(currentYear, 0, 1)),
      end: endOfYear(new Date(currentYear, 11, 31))
    }),
    [currentYear]
  );

  // Priority promoters that should appear first
  const priorityPromoters = useMemo(() => 
    ['techbouts','legends', 'santacruz', 'shadowpack', 'antdawgs', 'genx', 'voodoo', 'ultamatefitness'],
    []
  );

  // Sort promoters to put priority ones first
 const sortedPromoters = useMemo(() => 
    [...PROMOTER_OPTIONS].sort((a, b) => {
      const aIndex = priorityPromoters.indexOf(a.toLowerCase());
      const bIndex = priorityPromoters.indexOf(b.toLowerCase());
      
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    }),
    [priorityPromoters]
  );




  // const processEvent = async (event: Event) => {
  //   if (event.status === 'pending') {
  //     const confirmApproval = window.confirm('Are you sure you want to approve this event?');
      
  //     if (confirmApproval) {
  //       const pendingEvent: PendingEvent = {
  //         id: event.id,
  //         event_name: event.event_name,
  //         city: event.city,
  //         state: event.state,
  //         date: event.date,
  //         registration_fee: event.registration_fee,
  //         promoterId: event.promoterId || '',
  //         promoterEmail: event.promoterEmail || ''
  //       };
  
  //       const result = await approvePendingEvent(pendingEvent);
        
  //       if (result.success) {
  //         // Refresh the events after successful approval
  //         const [eventsResponse, pendingEventsResponse] = await Promise.all([
  //           fetch('/api/pmt/events'),
  //           fetch('/api/pmt/pendingEvents')
  //         ]);
          
  //         const eventsData = await eventsResponse.json();
  //         const pendingData = await pendingEventsResponse.json();
          
  //         setEvents(eventsData.events);
  //         setPendingEvents(pendingData.events);
  //       } else {
  //         alert('Error approving event: ' + result.message);
  //       }
  //     }
  //   }
  // };





  useEffect(() => {
    const organizedEvents: { [key: string]: { [key: string]: Event[] } } = {};
    
    // Initialize the structure
    sortedPromoters.forEach(promoter => {
      organizedEvents[promoter] = {};
      months.forEach(month => {
        organizedEvents[promoter][format(month, 'MMM')] = [];
      });
    });

    const processEvents = (eventList: Event[]) => {
      eventList.forEach(event => {
        if (event.promoterId && event.date) {
          const monthKey = format(parseISO(event.date), 'MMM');
          if (organizedEvents[event.promoterId]?.[monthKey]) {
            organizedEvents[event.promoterId][monthKey].push(event);
          }
        }
      });
    };

    if (eventTypeFilter === "all" || eventTypeFilter === "confirmed") {
      processEvents(events);
    }
    
    if (eventTypeFilter === "all" || eventTypeFilter === "pending") {
      processEvents(pendingEvents);
    }

    setEventsByPromoterAndMonth(organizedEvents);
  }, [events, pendingEvents, eventTypeFilter, sortedPromoters, months]);



  const shouldHaveRedBackground = useMemo(() => 
    (promoter: string) => priorityPromoters.includes(promoter.toLowerCase()),
    [priorityPromoters]
  );

  const renderEvent = (event: Event) => {
    const getBackgroundColor = () => {
      switch (event.status) {
        case 'confirmed':
          return '#ecfdf5'; // Light green background for confirmed events
        case 'approved':
          return '#f0f9ff'; // Light blue background for approved events
        case 'pending':
          return '#fff7ed'; // Light orange background for pending events
        default:
          return '#ffffff'; // White background for other cases
      }
    };
  
    return (
      <div 
        key={event.id}
        onClick={() => handleEventClick(event)}
        className="relative"
        style={{
          fontSize: '0.875rem',
          padding: '0.25rem 0.5rem',
          margin: '0.25rem 0',
          backgroundColor: getBackgroundColor(),
          borderRadius: '0.25rem',
          cursor: 'pointer',
          transition: 'all 0.2s',
          border: '1px solid #e5e7eb',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
        }}
        title={`${event.event_name} - ${format(parseISO(event.date), 'MMM d, yyyy')} (${event.status})`}
      >
        {event.event_name} <br />
        {event.city}, {event.state} <br />
        {format(parseISO(event.date), 'MMM d, yyyy')}
        
        {isAuthenticated && selectedEventForActions?.id === event.id && showActions && (
          <div className="absolute top-full left-0 mt-1 z-50">
            <EventActions
              onStatusToggle={() => {
                handleActionSelect(event, 'status-toggle');
              }}
              onDelete={() => handleActionSelect(event, 'delete')}
              status={event.status === 'confirmed' ? 'approved' : (event.status as 'approved' | 'pending')}
              event={event}
            />
          </div>
        )}
      </div>
    );
  };


  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gray-50">
        <div className="text-xl text-gray-700">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
 

<div className="flex items-center justify-start p-4 bg-white rounded-lg shadow-sm">
        <div className="flex gap-8">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="eventType"
              value="all"
              checked={eventTypeFilter === "all"}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium">All Events</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="eventType"
              value="confirmed"
              checked={eventTypeFilter === "confirmed"}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium">Confirmed Only</span>
          </label>
          
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="radio"
              name="eventType"
              value="pending"
              checked={eventTypeFilter === "pending"}
              onChange={(e) => setEventTypeFilter(e.target.value)}
              className="w-4 h-4 text-blue-600"
            />
            <span className="text-sm font-medium">Pending Only</span>
          </label>
        </div>
      </div>

      <div style={{
        width: '100vw',
        position: 'relative',
        overflowX: 'auto',
        overflowY: 'visible',
        padding: '1rem',
        color: 'black',
        backgroundColor: '#f8fafc',
        borderRadius: '8px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{
        }}>
          <table style={{
            width: '100%',
            borderCollapse: 'separate',
            borderSpacing: 0,
            backgroundColor: 'white',
            borderRadius: '8px',
          }}>
            <thead>
              <tr>
                <th style={{
                  position: 'sticky',
                  left: 0,
                  backgroundColor: '#f3f4f6',
                  zIndex: 2,
                  padding: '0.5rem',
                  borderBottom: '2px solid #e5e7eb',
                  minWidth: '80px',
                  maxWidth: '80px',
                  width: '80px',
                  boxShadow: '2px 0 4px rgba(0, 0, 0, 0.1)',
                  fontSize: '0.8rem'
                }}>
                  Promoter
                </th>
                {months.map(month => (
                  <th 
                    key={format(month, 'MMM')} 
                    style={{
                      padding: '1rem',
                      textAlign: 'center',
                      backgroundColor: '#f3f4f6',
                      borderBottom: '2px solid #e5e7eb',
                      minWidth: '100px'
                    }}
                  >
                    {format(month, 'MMM')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedPromoters.map(promoter => (
                <tr key={promoter}>
                  <td style={{
                    fontSize: '0.70rem',
                    position: 'sticky',
                    left: 0,
                    backgroundColor: shouldHaveRedBackground(promoter) ? '#fee2e2' : 'white',
                    zIndex: 1,
                    padding: '8px 4px',
                    fontWeight: 600,
                    borderBottom: '1px solid #e5e7eb',
                    textTransform: 'capitalize',
                    boxShadow: '2px 0 4px rgba(0, 0, 0, 0.2)',
                    height: '3rem',
                    minWidth: '80px',
                    maxWidth: '80px',
                    width: '80px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis'
                  }}>
                    {promoter}
                  </td>
                  {months.map(month => {
                    const monthKey = format(month, 'MMM');
                    const monthEvents = eventsByPromoterAndMonth[promoter]?.[monthKey] || [];
                    
                    return (
                      <td 
                        key={monthKey}
                        style={{
                          padding: '0.5rem',
                          textAlign: 'center',
                          backgroundColor: shouldHaveRedBackground(promoter) ? '#fee2e2' : monthEvents.length > 0 ? '#f0f9ff' : 'white',
                          borderBottom: '1px solid grey',
                          minWidth: '120px'
                        }}
                      >
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
    </div>
  );
};

export default MonthTable;