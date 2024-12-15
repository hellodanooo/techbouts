
'use client';

import React, { useState } from 'react';
import { db } from '@/utils/firebase';
import { doc, setDoc, collection } from 'firebase/firestore';
import { generateDocId } from '@/utils/eventManagement';
import { Event } from '@/utils/types';

interface AddEventFormProps {
  onClose: () => void;
}

const AddEventForm: React.FC<AddEventFormProps> = ({ onClose }) => {
  const [formData, setFormData] = useState<Partial<Event>>({});
  const [loading, setLoading] = useState(false);

  const handleInputChange = (field: keyof Event, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);

      const cityFormatted = formData.city?.replace(/\s+/g, '_') ?? 'unknown_city';
      const docId = generateDocId(
        cityFormatted,
        formData.state ?? 'unknown_state',
        formData.date ?? new Date().toISOString()
      );

      const newEvent: Event = {
        ...formData,
        id: docId,
        docId: docId,
        event_name: formData.event_name ?? 'Unnamed Event',
        address: formData.address ?? 'No address provided',
        city: formData.city ?? 'Unknown City',
        state: formData.state ?? 'Unknown State',
        date: formData.date ?? new Date().toISOString(),
        flyer: formData.flyer ?? '/default-flyer.png',
        weighin_date: formData.weighin_date ?? '',
        weighin_start_time: formData.weighin_start_time ?? '',
        weighin_end_time: formData.weighin_end_time ?? '',
        rules_meeting_time: formData.rules_meeting_time ?? '',
        bouts_start_time: formData.bouts_start_time ?? '',
        doors_open: formData.doors_open ?? '',
        spectator_info: formData.spectator_info ?? '',
        registration_enabled: formData.registration_enabled ?? false,
        registration_fee: formData.registration_fee ?? 0,
        tickets_enabled: formData.tickets_enabled ?? false,
        ticket_price: formData.ticket_price ?? 0,
        ticket_price_description: formData.ticket_price_description ?? '',
        ticket_price2: formData.ticket_price2 ?? 0,
        ticket_price2_description: formData.ticket_price2_description ?? '',
        event_details: formData.event_details ?? '',
        coach_price: formData.coach_price ?? 0,
        coach_enabled: formData.coach_enabled ?? false,
        photos_enabled: formData.photos_enabled ?? false,
        photos_price: formData.photos_price ?? 0,
        sanctioning: formData.sanctioning ?? 'PMT',
        promotion: formData.promotion ?? '',
      };

      const eventRef = doc(collection(db, 'event_calendar'), docId);
      await setDoc(eventRef, newEvent);

      alert('Event created successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating event:', error);
      alert('Failed to create event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create New Event</h2>
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Event Name"
            className="w-full p-2 border rounded"
            value={formData.event_name || ''}
            onChange={(e) => handleInputChange('event_name', e.target.value)}
          />
          <input
            type="text"
            placeholder="Address"
            className="w-full p-2 border rounded"
            value={formData.address || ''}
            onChange={(e) => handleInputChange('address', e.target.value)}
          />
          <input
            type="text"
            placeholder="City"
            className="w-full p-2 border rounded"
            value={formData.city || ''}
            onChange={(e) => handleInputChange('city', e.target.value)}
          />
          <input
            type="text"
            placeholder="State"
            className="w-full p-2 border rounded"
            value={formData.state || ''}
            onChange={(e) => handleInputChange('state', e.target.value)}
          />
          <input
            type="date"
            className="w-full p-2 border rounded"
            value={formData.date || ''}
            onChange={(e) => handleInputChange('date', e.target.value)}
          />
          {/* Add more fields here as necessary */}
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 ${
              loading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddEventForm;
