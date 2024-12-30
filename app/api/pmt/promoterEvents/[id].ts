// app/api/pmt/promoterEvents/[id].ts
import { NextApiRequest, NextApiResponse } from 'next';
import firebaseAdmin from '../../../../utils/firebaseAdmin';

interface FirebaseEventData {
  eventId: string;
  name?: string;
  event_name?: string;
  city?: string;
  state?: string;
  date: string;
  address?: string;
  flyer?: string;
  registration_fee?: number;
  ticket_system_option?: 'inHouse' | 'thirdParty' | 'none';
  promoterId?: string;
  status?: string;
  // Add other potential fields from your Event type
}

interface PendingEventsDoc {
  events: FirebaseEventData[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (!['DELETE', 'PATCH', 'POST'].includes(req.method!)) {
    res.setHeader('Allow', ['DELETE', 'PATCH', 'POST']);
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    const db = firebaseAdmin.firestore();
    const eventCalendarRef = db.collection('event_calendar').doc('pending_events');
    const doc = await eventCalendarRef.get();

    // Initialize currentEvents with proper typing
    const data = doc.exists ? (doc.data() as PendingEventsDoc) : { events: [] };
    const currentEvents: FirebaseEventData[] = data?.events || [];

    // For DELETE and PATCH requests, we need an ID
    const { id } = req.query;
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'Event ID is required' });
    }

    // Handle DELETE request
    if (req.method === 'DELETE') {
      const updatedEvents = currentEvents.filter(
        (event: FirebaseEventData) => event.eventId !== id
      );
      if (currentEvents.length === updatedEvents.length) {
        return res.status(404).json({ error: 'Event not found' });
      }
      await eventCalendarRef.set({ events: updatedEvents });
      return res.status(200).json({ success: true, message: 'Event deleted successfully' });
    }

    // Handle PATCH request
    if (req.method === 'PATCH') {
      const { status } = req.body;
      const updatedEvents = currentEvents.map((event: FirebaseEventData) => 
        event.eventId === id ? { ...event, status } : event
      );
      await eventCalendarRef.set({ events: updatedEvents });
      return res.status(200).json({ success: true, message: 'Status updated successfully' });
    }

  } catch (error) {
    console.error("Error processing event:", error);
    res.status(500).json({ error: 'Operation failed' });
  }
}