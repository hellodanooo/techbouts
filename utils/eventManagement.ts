// utils/eventManagement.ts
import { getFirestore, doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';

import { app } from './firebase';

interface EventData {
  event_name: string;
  city: string;
  state: string;
  date: string;
  registration_fee: number;
  promoterId: string;
}

interface PendingEvent {
    id: string;
    event_name: string;
    city: string;
    state: string;
    date: string;
    registration_fee: number;  // Changed from string to number
    promoterId: string;
  }

export const generateDocId = (city: string, state: string, date: string): string => {
  const [year, month, day] = date.split('-');
  return `${city}_${state}_${month}_${day}_${year}`;
};

export const addEvent = async (eventData: EventData): Promise<{ success: boolean; message: string }> => {
  const db = getFirestore(app);
  const { city, state, date, event_name, registration_fee, promoterId } = eventData;

  try {
    // Generate document ID
    const cityFormatted = city.replace(/\s+/g, '_');
    const docId = generateDocId(cityFormatted, state, date);


    // Add event to events collection
    const eventRef = doc(db, 'events', docId);
    await setDoc(eventRef, {
      event_name,
      city,
      state,
      date,
      registration_fee,
      promoterId
    });

    // Add event to calendar
    const eventCalendarRef = doc(db, 'event_calendar', 'upcoming_events');
    const docSnap = await getDoc(eventCalendarRef);

    const newEvent = {
      address: 'TBA',
      date,
      name: event_name,
      eventId: docId,
      city,
      state,
      flyer: '',
      promoterId
    };

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const currentEvents = currentData.events || [];
      const updatedEvents = [...currentEvents, newEvent];
      
      // Sort events by date
      updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      await updateDoc(eventCalendarRef, {
        lastUpdated: new Date().toISOString(),
        events: updatedEvents,
      });
    } else {
      await setDoc(eventCalendarRef, {
        lastUpdated: new Date().toISOString(),
        events: [newEvent],
      });
    }

    return { 
      success: true, 
      message: 'Event added successfully' 
    };
  } catch (error) {
    console.error('Error adding event:', error);
    return { 
      success: false, 
      message: 'Error adding event' 
    };
  }
};


export const approvePendingEvent = async (pendingEvent: PendingEvent): Promise<{ success: boolean; message: string }> => {
    const db = getFirestore(app);
    
    try {
      // First, add the event to the main events collection
      const eventData: EventData = {
        event_name: pendingEvent.event_name,
        city: pendingEvent.city,
        state: pendingEvent.state,
        date: pendingEvent.date,
        registration_fee: pendingEvent.registration_fee,
        promoterId: pendingEvent.promoterId
      };
  
      // Generate document ID for the new confirmed event
      const cityFormatted = pendingEvent.city.replace(/\s+/g, '_');
      const docId = generateDocId(cityFormatted, pendingEvent.state, pendingEvent.date);
  
      // Add to events collection
      const eventRef = doc(db, 'events', docId);
      await setDoc(eventRef, eventData);
  
      // Add to event calendar
      const eventCalendarRef = doc(db, 'event_calendar', 'upcoming_events');
      const docSnap = await getDoc(eventCalendarRef);
  
      const newEvent = {
        address: 'TBA',
        date: pendingEvent.date,
        name: pendingEvent.event_name,
        eventId: docId,
        city: pendingEvent.city,
        state: pendingEvent.state,
        flyer: '',
        promoterId: pendingEvent.promoterId
      };
  
      if (docSnap.exists()) {
        const currentData = docSnap.data();
        const currentEvents = currentData.events || [];
        const updatedEvents = [...currentEvents, newEvent];
        
        // Sort events by date
        updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
        await updateDoc(eventCalendarRef, {
          lastUpdated: new Date().toISOString(),
          events: updatedEvents,
        });
      } else {
        await setDoc(eventCalendarRef, {
          lastUpdated: new Date().toISOString(),
          events: [newEvent],
        });
      }
  
      // Remove from pending events collection
      const pendingEventRef = doc(db, 'pending_events', pendingEvent.id);
      await deleteDoc(pendingEventRef);
  
      return {
        success: true,
        message: 'Event approved and moved to confirmed events'
      };
    } catch (error) {
      console.error('Error approving pending event:', error);
      return {
        success: false,
        message: 'Error approving event'
      };
    }
  };