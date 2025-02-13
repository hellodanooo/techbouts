'use client';
import { useState, useEffect } from 'react';
import Papa from 'papaparse';

interface Event {
  id: string;
  event_name: string;
  date: string;
}

interface Fighter {
  age: number;
  city: string;
  coach: string;
  coach_phone: string;
  dob: string;
  docId: string;
  email: string;
  first: string;
  gender: string;
  gym: string;
  height: string;
  last: string;
  loss: number;
  mma_loss: number;
  mma_win: number;
  mtp_id: string;
  phone: string;
  photo: string;
  state: string;
  weightclass: number;
  win: number;
}

export function PageContent() {
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await fetch('/api/pmt/purist_events');
      const data = await response.json();
      setEvents(data.events);
    } catch (error) {
      console.error('Error fetching events:', error);
    }
  };

  const handleExportCSV = async () => {
    if (!selectedEventId) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/pmt/purist_events/${selectedEventId}`);
      const data = await response.json();
      
      if (!data.roster || !Array.isArray(data.roster)) {
        throw new Error('Invalid roster data');
      }

      // Transform data for CSV
      const csvData = data.roster.map((fighter: Fighter) => ({
        'First Name': fighter.first,
        'Last Name': fighter.last,
        'Age': fighter.age,
        'Gender': fighter.gender,
        'Weight Class': fighter.weightclass,
        'Height': fighter.height,
        'Gym': fighter.gym,
        'Coach': fighter.coach,
        'Coach Phone': fighter.coach_phone,
        'Email': fighter.email,
        'Phone': fighter.phone,
        'City': fighter.city,
        'State': fighter.state,
        'Record (W-L)': `${fighter.win}-${fighter.loss}`,
        'MMA Record (W-L)': `${fighter.mma_win}-${fighter.mma_loss}`,
        'DOB': fighter.dob,
        'MTP ID': fighter.mtp_id
      }));

      // Generate CSV
      const csv = Papa.unparse(csvData);
      
      // Create and trigger download
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `roster_${selectedEventId}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col space-y-2">
        <label htmlFor="event-select" className="font-medium">
          Select Event
        </label>
        <select
          id="event-select"
          className="border rounded p-2"
          value={selectedEventId}
          onChange={(e) => setSelectedEventId(e.target.value)}
        >
          <option value="">Select an event...</option>
          {events.map((event) => (
            <option key={event.id} value={event.id}>
              {event.event_name} - {event.date}
            </option>
          ))}
        </select>
      </div>

      <button
        onClick={handleExportCSV}
        disabled={!selectedEventId || loading}
        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:bg-gray-300"
      >
        {loading ? 'Exporting...' : 'Export to CSV'}
      </button>
    </div>
  );
}