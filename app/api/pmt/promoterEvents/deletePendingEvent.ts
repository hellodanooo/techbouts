// app/api/pmt/promoterEvents/deletePendingEvent.ts
import { NextApiRequest, NextApiResponse } from 'next';
import firebaseAdmin from '../../../../utils/firebaseAdminPMT';

interface FirebaseEventData {
  eventId: string;
  [key: string]: unknown; // Allow for other properties without explicitly defining them
}

interface PendingEventsDoc {
  events: FirebaseEventData[];
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { eventId } = req.query;
  if (!eventId || typeof eventId !== 'string') {
    return res.status(400).json({ error: 'Event ID is required' });
  }

  try {
    const db = firebaseAdmin.firestore();
    const eventCalendarRef = db.collection('event_calendar').doc('pending_events');

    // Get current events
    const snapshot = await eventCalendarRef.get();
    if (!snapshot.exists) {
      return res.status(404).json({ error: 'No pending events found' });
    }

    const data = snapshot.data() as PendingEventsDoc;
    if (!data || !data.events) {
      return res.status(404).json({ error: 'No events data found' });
    }

    // Filter out the event to be deleted
    const updatedEvents = data.events.filter(
      (event: FirebaseEventData) => event.eventId !== eventId
    );

    // Update the document with the filtered events
    await eventCalendarRef.update({ events: updatedEvents });

    res.status(200).json({ message: 'Event deleted successfully' });
  } catch (error) {
    console.error("Error deleting pending event:", error);
    res.status(500).json({ error: 'Failed to delete event' });
  }
}