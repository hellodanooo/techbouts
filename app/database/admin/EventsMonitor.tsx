"use client";

import { useState } from "react";
import { 
  collection,
  getDocs,
  doc,
  getDoc,
  query,
  orderBy,
  where,
  limit
} from "firebase/firestore";

import { ProcessedEvent } from "@/utils/pmt/calculateRecordsAll";
import { db as pmtDb } from "@/lib/firebase_pmt/config";
import { db as techboutsDb } from "@/lib/firebase_techbouts/config";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, Plus } from "lucide-react";


type NewEvent = {
  id: string;
  name: string;
  date: string;
  hasResults: boolean;
};

export default function EventsMonitor() {
  const [processedEvents, setProcessedEvents] = useState<ProcessedEvent[]>([]);
  const [newEvents, setNewEvents] = useState<NewEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetchingNew, setIsFetchingNew] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  // Load processed events
  const loadProcessedEvents = async () => {
    setIsLoading(true);
    try {
      const docRef = doc(techboutsDb, "system_metadata", "processedPmtEventsJson");
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        setProcessedEvents(data.events || []);
      } else {
        setProcessedEvents([]);
      }
    } catch (err) {
      console.error("Error loading processed events:", err);
    } finally {
      setIsLoading(false);
    }
  };

  // Get the latest processed event date
  const getLatestProcessedDate = () => {
    if (processedEvents.length === 0) return null;
    return processedEvents.reduce((latest, event) => 
      new Date(event.date) > new Date(latest.date) ? event : latest
    ).date;
  };

  // Fetch new events after the latest processed event date
  const fetchNewEvents = async () => {
    setIsFetchingNew(true);
    try {
      const latestDate = getLatestProcessedDate();
      if (!latestDate) {
        console.warn("No processed events found.");
        setIsFetchingNew(false);
        return;
      }

      // Query events after the latest processed date
      const eventsQuery = query(
        collection(pmtDb, "events"),
        where("date", ">", latestDate),
        orderBy("date", "asc"),
        limit(20) // Fetch up to 20 new events
      );

      const eventsSnapshot = await getDocs(eventsQuery);
      const newEventsData = [];

      for (const eventDoc of eventsSnapshot.docs) {
        const eventData = eventDoc.data();

        // Check if event has a results JSON file
        const resultsJsonRef = doc(pmtDb, "events", eventDoc.id, "resultsJson", "fighters");
        const resultsJsonSnap = await getDoc(resultsJsonRef);
        const hasResults = resultsJsonSnap.exists();

        newEventsData.push({
          id: eventDoc.id,
          name: eventData.event_name || "Unnamed Event",
          date: eventData.date || "",
          hasResults
        });
      }

      setNewEvents(newEventsData);
      setModalOpen(true);
    } catch (err) {
      console.error("Error fetching new events:", err);
    } finally {
      setIsFetchingNew(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">PMT Events Monitor</h1>
        
        <div className="flex gap-4">
          <Button onClick={loadProcessedEvents} disabled={isLoading}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Load Processed Events
          </Button>

          <Button onClick={fetchNewEvents} disabled={isFetchingNew} variant="outline">
            {isFetchingNew ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
            Fetch New Events
          </Button>
        </div>
      </div>

      {/* New Events Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogTrigger asChild>
          <Button className="hidden">Open Modal</Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New Events Found</DialogTitle>
          </DialogHeader>
          <div className="mt-2">
            {newEvents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Results JSON</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newEvents.map(event => (
                    <TableRow key={event.id}>
                      <TableCell>{event.name}</TableCell>
                      <TableCell>{event.date}</TableCell>
                      <TableCell>
                        {event.hasResults ? "✅ Yes" : "❌ No"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No new events found.</p>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Processed Events Table */}
      <Card>
        <CardHeader>
          <CardTitle>Processed Events</CardTitle>
          <CardDescription>Displaying events from processedPmtEventsJson</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center items-center py-10">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">Loading...</span>
            </div>
          ) : (
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event Name</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Processed At</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {processedEvents.length > 0 ? (
                    processedEvents.map(event => (
                      <TableRow key={event.eventId}>
                        <TableCell>{event.eventName}</TableCell>
                        <TableCell>{event.date}</TableCell>
                        <TableCell>{event.processedAt}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="h-24 text-center">
                        No processed events available.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
