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
  registration_fee: number;
  promoterId: string;
}

export const generateDocId = (city: string, state: string, date: string): string => {
  const [year, month, day] = date.split('-');
  return `${city}_${state}_${month}_${day}_${year}`;
};

// Utility to save to JSON via API
const saveToJsonFile = async (event: EventData | any, action: 'add' | 'update' | 'delete') => {
  const response = await fetch('/api/manageEvent', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event, action }),
  });

  if (!response.ok) {
    throw new Error(`Failed to ${action} event in techbouts_events.json`);
  }
};

// Add event to Firestore and JSON
export const addEvent = async (eventData: EventData): Promise<{ success: boolean; message: string }> => {
  const db = getFirestore(app);
  const { city, state, date, event_name, registration_fee, promoterId } = eventData;

  try {
    // Generate document ID
    const cityFormatted = city.replace(/\s+/g, '_');
    const docId = generateDocId(cityFormatted, state, date);

    // Add event to Firestore collection
    const eventRef = doc(db, 'techbouts_events', docId);
    const newEvent = {
      ...eventData,
      id: docId,
      address: 'TBA',
      flyer: '',
    };

    await setDoc(eventRef, newEvent);

    // Update event calendar
    const eventCalendarRef = doc(db, 'event_calendar', 'techbouts_events');
    const docSnap = await getDoc(eventCalendarRef);

    if (docSnap.exists()) {
      const currentData = docSnap.data();
      const currentEvents = currentData.events || [];
      const updatedEvents = [...currentEvents, newEvent].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

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

    // Save to JSON file
    await saveToJsonFile(newEvent, 'add');

    return { success: true, message: 'Event added successfully' };
  } catch (error) {
    console.error('Error adding event:', error);
    return { success: false, message: 'Error adding event' };
  }
};

// Update event in Firestore and JSON
export const updateEvent = async (eventId: string, updatedData: Partial<EventData>): Promise<{ success: boolean; message: string }> => {
  const db = getFirestore(app);

  try {
    const eventRef = doc(db, 'techbouts_events', eventId);

    // Check if the event exists
    const snapshot = await getDoc(eventRef);
    if (!snapshot.exists()) {
      throw new Error(`Event with ID ${eventId} does not exist.`);
    }

    // Update Firestore document
    await updateDoc(eventRef, updatedData);

    // Update JSON file
    const updatedEvent = { id: eventId, ...updatedData };
    await saveToJsonFile(updatedEvent, 'update');

    return { success: true, message: 'Event updated successfully' };
  } catch (error) {
    console.error('Error updating event:', error);
    return { success: false, message: 'Error updating event' };
  }
};

// Delete event from Firestore and JSON
export const deleteEvent = async (eventId: string): Promise<{ success: boolean; message: string }> => {
  const db = getFirestore(app);

  try {
    // Delete from Firestore
    const eventRef = doc(db, 'techbouts_events', eventId);
    await deleteDoc(eventRef);

    // Remove from JSON file
    await saveToJsonFile({ id: eventId }, 'delete');

    return { success: true, message: 'Event deleted successfully' };
  } catch (error) {
    console.error('Error deleting event:', error);
    return { success: false, message: 'Error deleting event' };
  }
};
