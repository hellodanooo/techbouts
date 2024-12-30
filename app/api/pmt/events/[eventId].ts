// app/api/pmt/events/[eventId].ts
import { NextApiRequest, NextApiResponse } from 'next';
import firebaseAdmin from '../../../../utils/firebaseAdmin';
import { Event } from '../../../../utils/types';

interface FirebaseEventData extends Omit<Event, 'id'> {
  eventId: string;
}

interface UpcomingEventsDoc {
  events: FirebaseEventData[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const db = firebaseAdmin.firestore();
  
  switch (req.method) {
    case 'GET':
      return handleGet(req, res, db);
    case 'PUT':
      return handlePut(req, res, db);
    case 'DELETE':
      return handleDelete(req, res, db);
    default:
      res.setHeader('Allow', ['GET', 'PUT', 'DELETE']);
      res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

async function getFromCollection(eventId: string, db: FirebaseFirestore.Firestore): Promise<Event | null> {
  const eventRef = db.collection('events').doc(eventId);
  const eventDoc = await eventRef.get();

  if (!eventDoc.exists) {
    return null;
  }

  const eventData = eventDoc.data() as FirebaseEventData;
  if (!eventData) {
    return null;
  }

  return {
    ...eventData,
    id: eventId,
  };
}

async function getFromUpcomingEvents(eventId: string, db: FirebaseFirestore.Firestore): Promise<Event | null> {
  const eventCalendarRef = db.collection('event_calendar').doc('upcoming_events');
  const snapshot = await eventCalendarRef.get();
  
  if (!snapshot.exists) {
    return null;
  }

  const data = snapshot.data() as UpcomingEventsDoc;
  if (!data?.events) {
    return null;
  }

  const eventData = data.events.find((event: FirebaseEventData) => event.eventId === eventId);
  if (!eventData) {
    return null;
  }

  return {
    ...eventData,
    id: eventId,
  };
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, db: FirebaseFirestore.Firestore) {
  const { eventId, source } = req.query;
  
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    let event: Event | null = null;

    if (source === 'collection') {
      event = await getFromCollection(eventId, db);
    } else if (source === 'upcoming') {
      event = await getFromUpcomingEvents(eventId, db);
    } else {
      return res.status(400).json({ error: 'Invalid source specified' });
    }

    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json({ events: [event] });
  } catch (error) {
    console.error("API Route: Error fetching event:", error);
    return res.status(500).json({ error: 'Failed to fetch event' });
  }
}

async function updateCollection(eventId: string, eventData: Partial<Event>, db: FirebaseFirestore.Firestore) {
  const eventRef = db.collection('events').doc(eventId);
  await eventRef.update(eventData);
  return getFromCollection(eventId, db);
}

async function updateUpcomingEvents(eventId: string, eventData: Partial<Event>, db: FirebaseFirestore.Firestore) {
  const upcomingEventsRef = db.collection('event_calendar').doc('upcoming_events');
  const doc = await upcomingEventsRef.get();
  
  if (!doc.exists) {
    throw new Error('Upcoming events document not found');
  }

  const data = doc.data() as UpcomingEventsDoc;
  if (!data?.events) {
    throw new Error('No events array found');
  }

  const eventIndex = data.events.findIndex((event: FirebaseEventData) => event.eventId === eventId);
  if (eventIndex === -1) {
    throw new Error('Event not found in upcoming events');
  }

  const updatedEvents = [...data.events];
  updatedEvents[eventIndex] = {
    ...updatedEvents[eventIndex],
    ...eventData,
    eventId
  };

  await upcomingEventsRef.update({ events: updatedEvents });
  return getFromUpcomingEvents(eventId, db);
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, db: FirebaseFirestore.Firestore) {
  const { eventId, source } = req.query;
  const updateData = req.body;
  
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    let updatedEvent: Event | null = null;

    if (source === 'collection') {
      updatedEvent = await updateCollection(eventId, updateData, db);
    } else if (source === 'upcoming') {
      updatedEvent = await updateUpcomingEvents(eventId, updateData, db);
    } else {
      return res.status(400).json({ error: 'Invalid source specified' });
    }

    if (!updatedEvent) {
      return res.status(404).json({ error: 'Event not found' });
    }

    return res.status(200).json({ event: updatedEvent });
  } catch (error) {
    console.error("API Route: Error updating event:", error);
    return res.status(500).json({ 
      error: 'Failed to update event',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, db: FirebaseFirestore.Firestore) {
  const { eventId } = req.query;
  
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    console.log(`Attempting to delete event ${eventId}`);
    
    const batch = db.batch();

    const eventRef = db.collection('events').doc(eventId);
    batch.delete(eventRef);

    const upcomingEventsRef = db.collection('event_calendar').doc('upcoming_events');
    const upcomingDoc = await upcomingEventsRef.get();
    
    if (upcomingDoc.exists) {
      const data = upcomingDoc.data() as UpcomingEventsDoc;
      if (data && Array.isArray(data.events)) {
        const updatedEvents = data.events.filter((event: FirebaseEventData) => event.eventId !== eventId);
        batch.update(upcomingEventsRef, { events: updatedEvents });
      }
    }

    await batch.commit();
    console.log(`Successfully deleted event ${eventId}`);
    
    return res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error('Error deleting event:', error);
    return res.status(500).json({ error: 'Failed to delete event' });
  }
}