import { doc, getDoc, updateDoc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from './firebase'; // Use the exported db instance
import { Event } from './types';

const getFirestoreEvents = async (): Promise<Event[]> => {
  const docRef = doc(db, 'techbouts_events', 'events');
  const snapshot = await getDoc(docRef);

  if (!snapshot.exists()) {
    try {
      // Initialize the document if it doesn't exist
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

const saveFirestoreEvents = async (events: Event[]) => {
  const docRef = doc(db, 'techbouts_events', 'events');
  await updateDoc(docRef, { events });
};

export const saveToFirestore = async (event: Event | { id: string }, action: 'add' | 'update' | 'delete') => {
  if (!event || typeof event !== 'object' || !('id' in event)) {
    throw new Error('Invalid event data provided.');
  }

  const events = await getFirestoreEvents();
  let updatedEvents = events;

  switch (action) {
    case 'add':
      if (events.some((e) => e.id === event.id)) {
        throw new Error('Event with the same ID already exists.');
      }
      updatedEvents = [...events, event as Event];
      break;

    case 'update':
      if (!events.some((e) => e.id === event.id)) {
        throw new Error('Event not found for update.');
      }
      updatedEvents = events.map((e) => (e.id === event.id ? { ...e, ...event } : e));
      break;

    case 'delete':
      updatedEvents = events.filter((e) => e.id !== event.id);
      break;

    default:
      throw new Error('Invalid action specified.');
  }

  await saveFirestoreEvents(updatedEvents);
};

export const addEvent = async (eventData: Event): Promise<{ success: boolean; message: string }> => {
  try {
    const cityFormatted = eventData.city.replace(/\s+/g, '_');
    const docId = generateDocId(cityFormatted, eventData.state, eventData.date);
    const newEvent: Event = { ...eventData, id: docId, docId };

    const eventRef = doc(db, 'techbouts_events', docId);
    await setDoc(eventRef, newEvent);

    await saveToFirestore(newEvent, 'add');

    return { success: true, message: 'Event added successfully' };
  } catch (error) {
    console.error('Error adding event:', error);
    return { success: false, message: 'Error adding event' };
  }
};

export const updateEvent = async (eventId: string, updatedData: Partial<Event>): Promise<{ success: boolean; message: string }> => {
  try {
    const eventRef = doc(db, 'techbouts_events', eventId);
    const snapshot = await getDoc(eventRef);

    if (!snapshot.exists()) {
      throw new Error(`Event with ID ${eventId} does not exist.`);
    }

    const existingEvent = snapshot.data() as Event;
    const updatedEvent = { ...existingEvent, ...updatedData };

    await updateDoc(eventRef, updatedData);
    await saveToFirestore(updatedEvent, 'update');

    return { success: true, message: 'Event updated successfully' };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, message: 'Error updating event' };
  }
};

export const deleteEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
  try {
    const eventRef = doc(db, 'techbouts_events', eventId);
    await deleteDoc(eventRef);

    await saveToFirestore({ id: eventId }, 'delete');

    return { success: true, message: 'Event deleted successfully' };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, message: 'Error deleting event' };
  }
};

export const generateDocId = (city: string, state: string, date: string): string => {
  const parsedDate = new Date(date).toISOString().split('T')[0]; // Ensure YYYY-MM-DD
  const [year, month, day] = parsedDate.split('-');
  return `${city}_${state}_${month}_${day}_${year}`;
};
