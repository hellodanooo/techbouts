// components/events/EventsTab.tsx
import { useState } from 'react';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  orderBy, 
  limit, 
} from 'firebase/firestore';

import { ProcessedEvent } from '@/utils/pmt/calculateRecordsAll';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface EventStatus {
  id: string;
  name: string;
  date: string;
  hasResults: boolean;
  isProcessed: boolean;
}

export default function EventsTab() {
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [unprocessedEvents, setUnprocessedEvents] = useState<EventStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  

  
  // Load event data
  const loadEventData = async () => {
    setIsLoading(true);
    
    try {
      // Load processed events
      const processedEvents = await loadProcessedEvents();
      setProcessedEvents(processedEvents);
      
      // Load unprocessed events
      const unprocessedEvents = await loadUnprocessedEvents(processedEvents);
      setUnprocessedEvents(unprocessedEvents);
      
    } catch (error) {
      console.error('Error loading event data:', error);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load processed events from Firestore
  const loadProcessedEvents = async (): Promise<ProcessedEvent[]> => {
    const docRef = doc(techboutsDb, 'system_metadata', 'processedPmtEventsJson');
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.events || [];
    }
    
    return [];
  };
  
  // Load unprocessed events by checking PMT database
  const loadUnprocessedEvents = async (
    processedEvents: ProcessedEvent[],
    limitCount = 50
  ): Promise<EventStatus[]> => {
    // Create a set of processed event IDs for quick lookup
    const processedEventIds = new Set(processedEvents.map(event => event.eventId));
    
    // Query recent events from PMT database
    const eventsQuery = query(
      collection(pmtDb, 'events'),
      orderBy('date', 'desc'),
      limit(limitCount)
    );
    
    const eventsSnapshot = await getDocs(eventsQuery);
    const events: EventStatus[] = [];
    
    // Check each event for results
    for (const eventDoc of eventsSnapshot.docs) {
      const eventId = eventDoc.id;
      const eventData = eventDoc.data();
      
      // Skip if already processed
      if (processedEventIds.has(eventId)) continue;
      
      // Check if this event has results
      const resultsJsonRef = doc(pmtDb, 'events', eventId, 'resultsJson', 'fighters');
      const resultsJsonSnap = await getDoc(resultsJsonRef);
      const hasResults = resultsJsonSnap.exists();
      
      events.push({
        id: eventId,
        name: eventData.event_name || 'Unnamed Event',
        date: eventData.date || '',
        hasResults,
        isProcessed: false
      });
    }
    
    return events;
  };
  
  // Handle refresh button click
  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadEventData();
    setIsRefreshing(false);
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
  
  // Filter and prepare events for display
  const getFilteredEvents = () => {
    // Combine processed and unprocessed events
    let events: EventStatus[] = [];
    
    // Add processed events
    events = events.concat(
      processedEvents.map(event => ({
        id: event.eventId,
        name: event.eventName,
        date: event.date,
        hasResults: true,
        isProcessed: true
      }))
    );
    
    // Add unprocessed events
    events = events.concat(unprocessedEvents);
    
    // Filter by search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      events = events.filter(event => 
        event.name.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Filter by tab selection
    if (activeTab === 'processed') {
      events = events.filter(event => event.isProcessed);
    } else if (activeTab === 'unprocessed') {
      events = events.filter(event => !event.isProcessed && event.hasResults);
    } else if (activeTab === 'needsResults') {
      events = events.filter(event => !event.hasResults);
    }
    
    // Sort by date (newest first)
    events.sort((a, b) => {
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch {
        return b.date.localeCompare(a.date);
      }
    });
    
    return events;
  };
  
  const filteredEvents = getFilteredEvents();
  
 
  
  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <CardTitle>Event Processing Status</CardTitle>
            <CardDescription>
              Monitor which events have been processed and which need attention
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
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="grid grid-cols-4 gap-4 mt-4">
          <div className="flex flex-col items-center p-2 bg-muted/20 rounded-md">
            <span className="text-sm text-muted-foreground">All Events</span>
            <span className="text-xl font-bold">
              {processedEvents.length + unprocessedEvents.length}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-green-50 rounded-md">
            <span className="text-sm text-green-700">Processed</span>
            <span className="text-xl font-bold text-green-700">
              {processedEvents.length}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-yellow-50 rounded-md">
            <span className="text-sm text-yellow-700">Unprocessed</span>
            <span className="text-xl font-bold text-yellow-700">
              {unprocessedEvents.filter(e => e.hasResults).length}
            </span>
          </div>
          <div className="flex flex-col items-center p-2 bg-muted/20 rounded-md">
            <span className="text-sm text-muted-foreground">Needs Results</span>
            <span className="text-xl font-bold">
              {unprocessedEvents.filter(e => !e.hasResults).length}
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent>
      {isLoading ? (
          <div className="flex justify-center items-center py-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            <span className="ml-2 text-muted-foreground">Loading events...</span>
          </div>
        ) : (
          <>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-4">
              <TabsList>
                <TabsTrigger value="all">
                  All Events ({processedEvents.length + unprocessedEvents.length})
                </TabsTrigger>
                <TabsTrigger value="processed">
                  Processed ({processedEvents.length})
                </TabsTrigger>
                <TabsTrigger value="unprocessed">
                  Unprocessed ({unprocessedEvents.filter(e => e.hasResults).length})
                </TabsTrigger>
                <TabsTrigger value="needsResults">
                  Needs Results ({unprocessedEvents.filter(e => !e.hasResults).length})
                </TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.length > 0 ? (
                    filteredEvents.map(event => (
                      <TableRow key={event.id}>
                        <TableCell className="font-medium">
                          {event.name}
                        </TableCell>
                        <TableCell>
                          {formatDate(event.date)}
                        </TableCell>
                        <TableCell>
                          {event.isProcessed ? (
                            <Badge className="bg-green-50 text-green-700 border-green-200">
                              Processed
                            </Badge>
                          ) : event.hasResults ? (
                            <Badge className="bg-yellow-50 text-yellow-700 border-yellow-200">
                              Unprocessed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground">
                              No Results
                            </Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        {searchTerm ? (
                          <span className="text-muted-foreground">No events found matching {searchTerm}</span>
                        ) : (
                          <span className="text-muted-foreground">No events found for the selected filter</span>
                        )}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}