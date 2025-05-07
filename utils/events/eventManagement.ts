// utils/eventManagement.ts

import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { EventType } from '@/utils/types';



export const generateDocId = (sanctioning: string, eventName: string, city: string, state: string, date: string): string => {
  // Validate and parse the date
  if (!date || !/^\d{4}-\d{2}-\d{2}/.test(date)) {
    throw new Error('Invalid date format. Expected YYYY-MM-DD');
  }
  
  // Sanitize inputs
  const sanitizedEventName = sanitizeString(eventName);
  const sanitizedCity = sanitizeString(city);
  const sanitizedState = sanitizeString(state);
  const sanctioningLowercase = sanctioning.toLowerCase();
  // Parse date components
  const [year, month, day] = date.split('-').map(s => s.padStart(2, '0'));
  
  if (!year || !month || !day) {
    throw new Error('Invalid date components');
  }

  return `${sanctioningLowercase}${sanitizedEventName}_${sanitizedCity}_${sanitizedState}_${month}_${day}_${year}`;
};

export const addEvent = async (eventData: EventType): Promise<{ success: boolean; message: string }> => {
  console.log('Adding Techbouts Event for Promoter', eventData.promoterId);
  
  
  try {
    // Validate required fields
    if (!eventData.event_name || !eventData.city || !eventData.state || !eventData.date) {
      throw new Error('Missing required fields: event name, city, state, or date');
    }

    // Generate document ID with sanitized inputs
    const docId = generateDocId(
      eventData.sanctioning,
      eventData.event_name,
      eventData.city,
      eventData.state,
      eventData.date
    );
    
    const newEvent: EventType = {
      ...eventData,
      id: docId,
      eventId: docId,
      docId,
      // Ensure date is in correct format
      date: new Date(eventData.date).toISOString().split('T')[0],
      weighin_date: eventData.weighin_date || eventData.date // Use event date as default
    };

    // Save to Firestore
    const eventRef = doc(db,'events', 'promotions',eventData.promoterId, docId);
    await setDoc(eventRef, newEvent);
    await saveToFirestore(newEvent, 'add');

    return { success: true, message: 'Event added successfully' };
  } catch (error) {
    console.error('Error adding event:', error);
    return { 
      success: false, 
      message: error instanceof Error ? error.message : 'Error adding event'
    };
  }
};

const getEventsJson = async (): Promise<EventType[]> => {
  const docRef = doc(db, 'events', 'events_json');
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    try {
      await setDoc(docRef, { events: [] });
    } catch (error) {
      console.error('Error initializing Firestore events document:', error);
      throw new Error('Failed to initialize events document.');
    }
    return [];
  }

  const data = snapshot.data();
  return data?.events || [];
};

const saveFirestoreEvents = async (events: EventType[]) => {
  const docRef = doc(db, 'events', 'events_json');
  await updateDoc(docRef, { events });
};

export const saveToFirestore = async (event: EventType | { eventId: string }, action: 'add' | 'update' | 'delete') => {
  if (!event || typeof event !== 'object' || !('eventId' in event)) {
    throw new Error('Invalid event data provided.');
  }

  const events = await getEventsJson();
  let updatedEvents = events;

  switch (action) {
    case 'add':
      if (events.some((e) => e.eventId === event.eventId)) {
        throw new Error('Event with the same ID already exists.');
      }
      updatedEvents = [...events, event as EventType];
      break;

    case 'update':
      if (!events.some((e) => e.eventId === event.eventId)) {
        throw new Error('Event not found for update.');
      }
      updatedEvents = events.map((e) => (e.eventId === event.eventId ? { ...e, ...event } : e));
      break;

    case 'delete':
      updatedEvents = events.filter((e) => e.eventId !== event.eventId);
      break;

    default:
      throw new Error('Invalid action specified.');
  }

  await saveFirestoreEvents(updatedEvents);
};

const sanitizeString = (str: string): string => {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '') // Remove special characters
    .replace(/\s+/g, '_')        // Replace spaces with underscores
    .trim();                     // Remove leading/trailing spaces
};




// export const updateEvent = async (eventId: string, updatedData: Partial<EventType>): Promise<{ success: boolean; message: string }> => {
//   try {
//     const eventRef = doc(db, 'techbouts_events', eventId);
//     const snapshot = await getDoc(eventRef);

//     if (!snapshot.exists()) {
//       throw new Error(`Event with ID ${eventId} does not exist.`);
//     }

//     const existingEvent = snapshot.data() as EventType;
//     const updatedEvent = { ...existingEvent, ...updatedData };

//     await updateDoc(eventRef, updatedData);
//     await saveToFirestore(updatedEvent, 'update');

//     return { success: true, message: 'Event updated successfully' };
//   } catch (error) {
//     console.error('Error updating event:', error);
//     return { success: false, message: 'Error updating event' };
//   }
// };


// export const deleteEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
//   try {
//     const eventRef = doc(db, 'techbouts_events', eventId);
//     await deleteDoc(eventRef);

//     await saveToFirestore({ eventId: eventId }, 'delete');

//     return { success: true, message: 'Event deleted successfully' };
//   } catch (error) {
//     console.error('Error deleting event:', error);
//     return { success: false, message: 'Error deleting event' };
//   }
// };


export const approvePendingEvent = async (pendingEvent: EventType): Promise<{ success: boolean; message: string }> => {
  try {
    // Generate document ID for the new confirmed event
    const cityFormatted = pendingEvent.city.replace(/\s+/g, '_');
    const docId = generateDocId(
      pendingEvent.sanctioning,
      pendingEvent.event_name,
      pendingEvent.city,
      pendingEvent.state,
      pendingEvent.date
    );

    // Provide default values for missing fields
    const eventData: EventType = {
      event_name: pendingEvent.event_name,
      city: pendingEvent.city,
      state: pendingEvent.state,
      date: pendingEvent.date,
      registration_fee: pendingEvent.registration_fee,
      promoterId: pendingEvent.promoterId,
      address: pendingEvent.address || 'TBA',
      eventId: docId,
      id: docId,
      weighin_date: pendingEvent.weighin_date || pendingEvent.date,
      flyer: pendingEvent.flyer || '',
      event_details: pendingEvent.event_details || 'Details pending',
      weighin_start_time: pendingEvent.weighin_start_time || 'TBA',
      weighin_end_time: pendingEvent.weighin_end_time || 'TBA',
      rules_meeting_time: pendingEvent.rules_meeting_time || 'TBA',
      bouts_start_time: pendingEvent.bouts_start_time || 'TBA',
      docId,
      doors_open: pendingEvent.doors_open || 'TBA',
      spectator_info: pendingEvent.spectator_info || 'TBA',
      registration_enabled: pendingEvent.registration_enabled || false,
      tickets_enabled: pendingEvent.tickets_enabled || false,
      ticket_price: pendingEvent.ticket_price || 0,
      ticket_price_description: pendingEvent.ticket_price_description || '',
      ticket_price2: pendingEvent.ticket_price2 || 0,
      ticket_price2_description: pendingEvent.ticket_price2_description || '',
      photos_enabled: pendingEvent.photos_enabled || false,
      photos_price: pendingEvent.photos_price || 0,
      sanctioning: pendingEvent.sanctioning || 'None',
      promotionName: pendingEvent.promotionName || 'TBA',
      email: pendingEvent.email || 'TBA',
      promoterEmail: pendingEvent.promoterEmail || 'TBA',
      ticket_enabled: pendingEvent.ticket_enabled || false,
      ticket_system_option: pendingEvent.ticket_system_option || 'none',
      ticket_link: pendingEvent.ticket_link || '',
      zip: pendingEvent.zip || '',
      name: pendingEvent.name || pendingEvent.event_name,
      numMats: pendingEvent.numMats || 1,
      street: pendingEvent.street || 'TBA',
      postal_code: pendingEvent.postal_code || 'TBA',
      country: pendingEvent.country || 'TBA',
      colonia: pendingEvent.colonia || 'TBA',
      municipality: pendingEvent.municipality || 'TBA',
      coordinates: pendingEvent.coordinates || { latitude: 0, longitude: 0 },
      registration_link: pendingEvent.registration_link || '',
      matches_link: pendingEvent.matches_link || '',
      status: pendingEvent.status || 'pending',
      locale: pendingEvent.locale || 'en',
      disableRegistration: pendingEvent.disableRegistration || false,
      photoPackagePrice: pendingEvent.photoPackagePrice || 0,
      coachRegEnabled: pendingEvent.coachRegEnabled || false,
      coachRegPrice: pendingEvent.coachRegPrice || 0,
      photoPackageEnabled: pendingEvent.photoPackageEnabled || false,
      display_matches: pendingEvent.display_matches || false,
      recieve_email_notifications: false
    };

    // Add to events collection
    const eventRef = doc(db, 'events', docId);
    await setDoc(eventRef, eventData);

    // Add to event calendar
    const eventCalendarRef = doc(db, 'event_calendar', 'upcoming_events');
    const docSnap = await getDoc(eventCalendarRef);

    const newEvent = {
      address: eventData.address,
      date: eventData.date,
      name: eventData.event_name,
      eventId: eventData.eventId,
      city: eventData.city,
      state: eventData.state,
      flyer: eventData.flyer,
      promoterId: eventData.promoterId,
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
      message: 'Event approved and moved to confirmed events',
    };
  } catch (error) {
    console.error('Error approving pending event:', error);
    return {
      success: false,
      message: 'Error approving event',
    };
  }
};

