"use client";

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

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, RefreshCw, Check, AlertCircle, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';

// Interface to represent an event status
interface EventStatus {
  id: string;
  name: string;
  date: string;
  hasResults: boolean;
  isProcessed: boolean;
}

export default function EventsMonitor() {
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [unprocessedEvents, setUnprocessedEvents] = useState<EventStatus[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('all');
  const [error, setError] = useState<string | null>(null);
  

  
  // Filter events based on search term and active tab
  const filteredEvents = (() => {
    let events: EventStatus[] = [];
    
    // Add processed events to the list
    events = events.concat(
      processedEvents.map(event => ({
        id: event.eventId,
        name: event.eventName,
        date: event.date,
        hasResults: true,
        isProcessed: true
      }))
    );
    
    // Add unprocessed events to the list
    events = events.concat(unprocessedEvents);
    
    // Filter by search term if provided
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      events = events.filter(event => 
        event.name.toLowerCase().includes(lowerSearch) ||
        event.id.toLowerCase().includes(lowerSearch)
      );
    }
    
    // Filter by status if not showing all
    if (activeTab === 'processed') {
      events = events.filter(event => event.isProcessed);
    } else if (activeTab === 'unprocessed') {
      events = events.filter(event => !event.isProcessed && event.hasResults);
    } else if (activeTab === 'needsResults') {
      events = events.filter(event => !event.hasResults);
    }
    
    // Sort by date, newest first
    events.sort((a, b) => {
      // Try to parse dates, fall back to string comparison if invalid
      try {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      } catch {
        return b.date.localeCompare(a.date);
      }
    });
    
    return events;
  })();
  
  // Load all data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Load processed events from TechBouts database
      await loadProcessedEvents();
      
      // Load unprocessed events from PMT database
      await checkUnprocessedEvents();
      
    } catch (err) {
      console.error('Error loading event data:', err);
      setError(`Failed to load event data: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Load processed events
  const loadProcessedEvents = async () => {
    try {
      const docRef = doc(techboutsDb, 'system_metadata', 'processedPmtEventsJson');
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProcessedEvents(data.events || []);
        return data.events || [];
      } else {
        setProcessedEvents([]);
        return [];
      }
    } catch (err) {
      console.error('Error loading processed events:', err);
      setError(`Failed to load processed events: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };
  
  // Check for unprocessed events
  const checkUnprocessedEvents = async (limitCount = 100) => {
    try {
      // Get list of processed event IDs for quick lookup
      const processedEventIds = new Set(processedEvents.map(event => event.eventId));
      
      // Query recent events
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
        
        // Skip if already processed (we'll add processed events separately)
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
      
      setUnprocessedEvents(events);
      return events;
    } catch (err) {
      console.error('Error checking for unprocessed events:', err);
      setError(`Failed to check for unprocessed events: ${err instanceof Error ? err.message : String(err)}`);
      return [];
    }
  };
  
  // Handle refreshing the data
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadData();
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Format a date
  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'Unknown';
    try {
      return new Date(dateStr).toLocaleDateString();
    } catch {
      return dateStr;
    }
  };
  

  
  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PMT Events Monitor</h1>
        <Button 
          onClick={handleRefresh} 
          disabled={isLoading || isRefreshing}
          variant="outline"
        >
          {isRefreshing ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="h-4 w-4 mr-2" />
          )}
          Refresh
        </Button>
      </div>
      
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Events</p>
                <p className="text-2xl font-bold">{processedEvents.length + unprocessedEvents.length}</p>
              </div>
              <Calendar className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Processed</p>
                <p className="text-2xl font-bold">{processedEvents.length}</p>
              </div>
              <Check className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Unprocessed with Results</p>
                <p className="text-2xl font-bold">{unprocessedEvents.filter(e => e.hasResults).length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Missing Results</p>
                <p className="text-2xl font-bold">{unprocessedEvents.filter(e => !e.hasResults).length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-muted-foreground" />
            </div>
          </CardContent>
        </Card>
      </div>
      
      {/* Progress of processed events */}
      <Card className="mb-8">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Processing Status</CardTitle>
          <CardDescription>
            {processedEvents.length} of {processedEvents.length + unprocessedEvents.filter(e => e.hasResults).length} events with results have been processed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress 
            value={processedEvents.length > 0 ? 
              (processedEvents.length / (processedEvents.length + unprocessedEvents.filter(e => e.hasResults).length)) * 100 : 
              0
            } 
            className="mb-2" 
          />
        </CardContent>
      </Card>
      
      {/* Error message if any */}
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {/* Events Table with Tabs and Search */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div>
              <CardTitle>PMT Events</CardTitle>
              <CardDescription>
                View and monitor PMT event processing status
              </CardDescription>
            </div>
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-xs"
            />
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
                    All ({processedEvents.length + unprocessedEvents.length})
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
        <CardFooter>
          <div className="text-sm text-muted-foreground">
            Showing {filteredEvents.length} events
            {searchTerm && ` matching "${searchTerm}"`}
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}