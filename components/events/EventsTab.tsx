import { useState, useEffect } from 'react';
import { doc, getDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

import { ProcessedEvent } from '@/utils/pmt/calculateRecordsAll';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Loader2, RefreshCw, Search } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { calcRecordOneEvent } from '@/utils/pmt/calcRecordOneEvent';
import { saveOneEventRecord } from '@/utils/pmt/addMergePmtOneEvent';

export default function EventsTab() {
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [latestEvents, setLatestEvents] = useState<{ id: string; name: string; date: string; hasResults: boolean }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isFetchingLatest, setIsFetchingLatest] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEventName, setSelectedEventName] = useState<string | null>(null);
  const [processedFighters, setProcessedFighters] = useState<{ pmt_id: string; wins: number; losses: number }[]>([]);
const [selectedEventId, setSelectedEventId] = useState<string | null>(null);

  // Load processed events from Firestore
  const loadProcessedEvents = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(techboutsDb, 'system_metadata', 'processedPmtEventsJson');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setProcessedEvents(data.events || []);
      } else {
        setProcessedEvents([]);
      }
    } catch (error) {
      console.error('Error loading processed events:', error);
      setProcessedEvents([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    loadProcessedEvents();
  }, []);

  useEffect(() => {
    console.log("✅ Processed Fighters Updated: ", processedFighters);
    console.log("✅ Selected Event ID: ", selectedEventId);
    console.log("✅ Selected Event Name: ", selectedEventName);
  }, [processedFighters, selectedEventId, selectedEventName]);
  

  // Handle refresh
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadProcessedEvents();
    setIsRefreshing(false);
  };

  // Fetch latest events after the latest processed event date
  const fetchLatestEvents = async () => {
    if (!processedEvents.length) return;
    setIsFetchingLatest(true);
  
    try {
      // Get the latest processed event date
      const latestDate = processedEvents.reduce((latest, event) => {
        return event.date > latest ? event.date : latest;
      }, processedEvents[0].date);
  
      // Create a set of processed event IDs for quick lookup
      const processedEventIds = new Set(processedEvents.map(event => event.eventId));
  
      // Query events from PMT database after the latest processed date
      const eventsQuery = query(
        collection(pmtDb, 'events'),
        where('date', '>=', latestDate),
        orderBy('date', 'desc')
      );
  
      const eventsSnapshot = await getDocs(eventsQuery);
      const events = [];
  
      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();
        const eventId = eventDoc.id;
  
        // Skip events that are already processed
        if (processedEventIds.has(eventId)) continue;
  
        // Check if the event has a resultsJson file
        const resultsJsonRef = doc(pmtDb, 'events', eventId, 'resultsJson', 'fighters');
        const resultsJsonSnap = await getDoc(resultsJsonRef);
        const hasResults = resultsJsonSnap.exists();
  
        // **Only add events that have results**
        if (hasResults) {
          events.push({
            id: eventId,
            name: eventData.event_name || 'Unnamed Event',
            date: eventData.date || '',
            hasResults
          });
        }
      }
  
      setLatestEvents(events);
    } catch (error) {
      console.error('Error fetching latest events:', error);
    } finally {
      setIsFetchingLatest(false);
    }
  };
  
  

  // Format date for display
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };

  // Filter events based on search term
  const filteredEvents = processedEvents.filter(event =>
    event.eventName.toLowerCase().includes(searchTerm.toLowerCase())
  );



  const handleProcessEvent = async (eventId: string, eventName: string) => {
    console.log(`Processing single event: ${eventId}`);
    
    setSelectedEventName(eventName);
    setSelectedEventId(eventId);
    
    const result = await calcRecordOneEvent(eventId);
    
    if (result) {
      const fighterData = Array.from(result.fighterRecords.values()).map(fighter => ({
        pmt_id: fighter.pmt_id,
        wins: fighter.wins,
        losses: fighter.losses
      }));
  
      setProcessedFighters(fighterData);
    } else {
      alert(`Failed to process event ${eventName}`);
    }
  };


  const handleSaveToFirestore = async () => {
    if (!selectedEventId || !selectedEventName || processedFighters.length === 0) {
      alert('Missing event ID, event name, or processed fighter data.');
      return;
    }
  
    // Convert processedFighters array back to a Map<string, FighterRecord>
    const fighterRecordsMap = new Map(
      processedFighters.map(fighter => [
        fighter.pmt_id,
        {
          pmt_id: fighter.pmt_id,
          wins: fighter.wins,
          losses: fighter.losses,
          weightclasses: [],
          fights: [],
          first: '',
          last: '',
          gym: '',
          email: '',
          gender: '',
          age: 0,
          dob: '',
          nc: 0,
          dq: 0,
          bodykick: 0,
          boxing: 0,
          clinch: 0,
          defense: 0,
          footwork: 0,
          headkick: 0,
          kicks: 0,
          knees: 0,
          legkick: 0,
          ringawareness: 0,
          lastUpdated: new Date().toISOString(),
          searchKeywords: [],
        },
      ])
    );
  
    const processedEvent: ProcessedEvent = {
      eventId: selectedEventId,  // Ensured to be a string
      eventName: selectedEventName,
      date: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      uniqueFighterCount: processedFighters.length,
    };
  
    const response = await saveOneEventRecord(techboutsDb, fighterRecordsMap, processedEvent);
  
    if (response.success) {
      alert(`Successfully saved ${response.updated} updated and ${response.created} new fighters.`);
      await loadProcessedEvents(); // Refresh the list of processed events
    } else {
      alert(`Failed to save records: ${response.message}`);
    }
  };
  


  
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <CardTitle>Processed Events</CardTitle>
            <CardDescription>
              Displaying events that have been processed from <code>processedPmtEventsJson</code>.
            </CardDescription>
          </div>
          <div className="flex gap-4">
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
            <Button 
              onClick={handleRefresh}
              disabled={isLoading || isRefreshing}
              variant="outline"
              size="sm"
            >
              {isRefreshing ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <RefreshCw className="h-4 w-4 mr-2" />
              )}
              Refresh
            </Button>
            <Button 
              onClick={fetchLatestEvents}
              disabled={isFetchingLatest || processedEvents.length === 0}
              variant="default"
              size="sm"
            >
              {isFetchingLatest ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Search className="h-4 w-4 mr-2" />
              )}
              Fetch Latest Events
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading processed events...</span>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Processed At</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.map(event => (
                  <TableRow key={event.eventId}>
                    <TableCell className="font-medium">{event.eventName}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>{formatDate(event.processedAt)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        )}
      </CardContent>

      {/* Modal for latest events */}
    
        <CardContent>
          <CardHeader>
            <CardTitle>Latest Events with Results</CardTitle>
          </CardHeader>
          <ScrollArea className="max-h-[400px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Event Name</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Results JSON</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {latestEvents.map(event => (
                  <TableRow key={event.id}>
                    <TableCell>{event.name}</TableCell>
                    <TableCell>{formatDate(event.date)}</TableCell>
                    <TableCell>
                      {event.hasResults ? <Badge className="bg-green-500">Yes</Badge> : <Badge>No</Badge>}
                    </TableCell>
                      <Button variant="default" size="sm" onClick={() => handleProcessEvent(event.id, event.name)}>
                      Process
                    </Button>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>

        {processedFighters.length > 0 && (
        <CardContent>
          <CardTitle>{selectedEventName} - Fighter Records</CardTitle>
          <Button 
      variant="default" 
      size="sm" 
      onClick={handleSaveToFirestore}
    >
      Save to Firestore
    </Button>          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>PMT ID</TableHead>
                <TableHead>Wins</TableHead>
                <TableHead>Losses</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {processedFighters.map(fighter => (
                <TableRow key={fighter.pmt_id}>
                  <TableCell>{fighter.pmt_id}</TableCell>
                  <TableCell>{fighter.wins}</TableCell>
                  <TableCell>{fighter.losses}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      )}

 </Card>
  );
}
