// utils/pmt/eventStatusChecker.ts
import { 
    collection, 
    getDocs, 
    doc, 
    getDoc, 
    query, 
    orderBy, 
    limit, 
    Firestore 
  } from 'firebase/firestore';
  

  interface ProcessedEvent {
    eventId: string;
    eventName: string;
    date: string;
  }

  // Interface for an event's status
  export interface EventStatus {
    id: string;          // Event ID
    name: string;        // Event name
    date: string;        // Event date
    hasResults: boolean; // Whether the event has resultsJson
    isProcessed: boolean; // Whether the event has been processed
  }
  
  /**
   * Get processed events from the TechBouts database
   * 
   * @param techboutsDb TechBouts Firestore database
   * @returns Array of processed events
   */
  export async function getProcessedEvents(techboutsDb: Firestore): Promise<ProcessedEvent[]> {
    try {
      const docRef = doc(techboutsDb, 'system_metadata', 'processedPmtEventsJson');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        return data.events || [];
      }
  
      return [];
    } catch (error) {
      console.error('Error getting processed events:', error);
      throw error;
    }
  }
  
  /**
   * Check for unprocessed events in the PMT database
   * 
   * @param pmtDb PMT Firestore database
   * @param techboutsDb TechBouts Firestore database
   * @param limitCount Maximum number of events to check
   * @returns Object containing processed, unprocessed, and all events
   */
  export async function checkEventStatus(
    pmtDb: Firestore,
    techboutsDb: Firestore,
    limitCount: number = 100
  ) {
    try {
      // Get processed events with correct type
      const processedEvents: ProcessedEvent[] = await getProcessedEvents(techboutsDb);
      const processedEventIds = new Set(processedEvents.map((event: ProcessedEvent) => event.eventId));
  
      // Convert processed events to EventStatus format
      const processedStatuses: EventStatus[] = processedEvents.map((event: ProcessedEvent) => ({
        id: event.eventId,
        name: event.eventName,
        date: event.date,
        hasResults: true, // Processed events must have had results
        isProcessed: true
      }));
  
      // Query recent events from PMT database
      const eventsQuery = query(
        collection(pmtDb, 'events'),
        orderBy('date', 'desc'),
        limit(limitCount)
      );
  
      const eventsSnapshot = await getDocs(eventsQuery);
      const unprocessedStatuses: EventStatus[] = [];
  
      // Check each event
      for (const eventDoc of eventsSnapshot.docs) {
        const eventId = eventDoc.id;
        const eventData = eventDoc.data();
        
        // Skip if already processed (we'll add processed events separately)
        if (processedEventIds.has(eventId)) continue;
  
        // Check if this event has results
        const resultsJsonRef = doc(pmtDb, 'events', eventId, 'resultsJson', 'fighters');
        const resultsJsonSnap = await getDoc(resultsJsonRef);
        const hasResults = resultsJsonSnap.exists();
  
        unprocessedStatuses.push({
          id: eventId,
          name: eventData.event_name || 'Unnamed Event',
          date: eventData.date || '',
          hasResults,
          isProcessed: false
        });
      }
  
      // Combined list of all events
      const allEvents = [...processedStatuses, ...unprocessedStatuses];
  
      // Statistics
      const stats = {
        total: allEvents.length,
        processed: processedStatuses.length,
        unprocessedWithResults: unprocessedStatuses.filter(e => e.hasResults).length,
        needsResults: unprocessedStatuses.filter(e => !e.hasResults).length
      };
  
      return {
        processed: processedStatuses,
        unprocessed: unprocessedStatuses,
        all: allEvents,
        stats
      };
    } catch (error) {
      console.error('Error checking event status:', error);
      throw error;
    }
  }
  