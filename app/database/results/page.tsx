// app/results/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { db } from '@/lib/firebase_pmt/config';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown, Loader2 } from 'lucide-react';

interface Fighter {
  id: string;
  first: string;
  last: string;
  gym: string;
  weightclass: number;
  bout: number;
  mat: number;
  result?: string;
}

interface Event {
  event_name: string;
  date: string;
  city: string;
  state: string;
  id: string;
}

export default function ResultsPage() {
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<Event[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>([]);
  const [filteredFighters, setFilteredFighters] = useState<Fighter[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [loadingMessage, setLoadingMessage] = useState('Loading events...');

  useEffect(() => {
    fetchEvents();
  }, []);

  useEffect(() => {
    if (searchTerm) {
      const filtered = fighters.filter(fighter => 
        fighter.first.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.last.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fighter.gym.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredFighters(filtered);
    } else {
      setFilteredFighters(fighters);
    }
  }, [searchTerm, fighters]);

  const fetchEvents = async () => {
    try {
      const eventsRef = collection(db, 'events');
      const eventsSnapshot = await getDocs(eventsRef);
      const eventsData = eventsSnapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as Event[];
      
      // Sort events by date
      eventsData.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setEvents(eventsData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching events:', error);
      setLoadingMessage('Error loading events');
    }
  };

  const fetchFightersForEvent = async (event: Event) => {
    setSelectedEvent(event);
    setLoadingMessage(`Loading fighters for ${event.event_name}...`);
    setLoading(true);

    try {
      const resultsJsonRef = doc(db, 'events', event.id, 'resultsJson', 'fighters');
      const resultsJsonSnap = await getDoc(resultsJsonRef);
      
      if (resultsJsonSnap.exists()) {
        const resultsData = resultsJsonSnap.data();
        setFighters(resultsData.fighters);
        setFilteredFighters(resultsData.fighters);
      } else {
        setFighters([]);
        setFilteredFighters([]);
      }
    } catch (error) {
      console.error('Error fetching fighters:', error);
      setLoadingMessage('Error loading fighters');
    }
    
    setLoading(false);
  };

  const getResultColor = (result?: string) => {
    switch(result?.toUpperCase()) {
      case 'W': return 'text-green-600';
      case 'L': return 'text-red-600';
      case 'NC': return 'text-yellow-600';
      case 'DQ': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Event Results</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-6">
          
          
          <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  {selectedEvent ? selectedEvent.event_name : 'Select Event'} 
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                className="w-56 max-h-[50vh] overflow-y-auto"
                align="start"
                side="bottom"
              >
                <DropdownMenuLabel className="sticky top-0 bg-background z-50">Events</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="overflow-y-auto">
                  {events.map((event) => (
                    <DropdownMenuItem 
                      key={event.id}
                      onClick={() => fetchFightersForEvent(event)}
                    >
                      {event.event_name} - {event.date}
                    </DropdownMenuItem>
                  ))}
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Input
              placeholder="Search fighters..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin mr-2" />
              <p>{loadingMessage}</p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Gym</TableHead>
                    <TableHead>Weight Class</TableHead>
                    <TableHead>Bout</TableHead>
                    <TableHead>Mat</TableHead>
                    <TableHead>Result</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFighters.map((fighter) => (
                    <TableRow key={fighter.id}>
                      <TableCell>{fighter.first} {fighter.last}</TableCell>
                      <TableCell>{fighter.gym}</TableCell>
                      <TableCell>{fighter.weightclass}</TableCell>
                      <TableCell>{fighter.bout}</TableCell>
                      <TableCell>{fighter.mat}</TableCell>
                      <TableCell className={getResultColor(fighter.result)}>
                        {fighter.result || 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}