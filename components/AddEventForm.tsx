'use client';

import React, { useState } from 'react';
import { generateDocId, addEvent } from '@/utils/eventManagement';
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
  
      // Validate event data
      validateEvent(formData);
  
      const cityFormatted = formData.city?.replace(/\s+/g, '_') ?? 'unknown_city';
      const docId = generateDocId(
        cityFormatted,
        formData.state ?? 'unknown_state',
        formData.date ?? new Date().toISOString()
      );
  
      // Construct new event object
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
        sanctioning: formData.sanctioning ?? '',
        promotion: formData.promotion ?? '',
        email: formData.email ?? '',
      };
  
      // Use the addEvent function to handle Firestore and JSON file updates
      const result = await addEvent(newEvent);
  
      if (result.success) {
        alert('Event created successfully!');
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Error creating event:', error);
      if (error instanceof Error) {
        alert(`Failed to create event: ${error.message}`);
      } else {
        alert('Failed to create event: An unknown error occurred.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  



  const validateEvent = (event: Partial<Event>): void => {
    if (!event.event_name || event.event_name.trim() === '') {
      throw new Error('Event name is required.');
    }
    if (!event.date || isNaN(new Date(event.date).getTime())) {
      throw new Error('Valid event date is required.');
    }
    if (!event.city || event.city.trim() === '') {
      throw new Error('City is required.');
    }
    if (!event.state || event.state.trim() === '') {
      throw new Error('State is required.');
    }
    if (!event.address || event.address.trim() === '') {
      throw new Error('Address is required.');
    }
    if (!event.promotion || event.promotion.trim() === '') {
      throw new Error('Promotion name is required.');
    }
    if (!event.sanctioning || event.sanctioning.trim() === '') {
      throw new Error('Sanctioning body is required.');
    }
    if (!event.email || event.email.trim() === '') {
      throw new Error('Email is required.');
    }
  };
  


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create New Event</h2>
        <div className="space-y-4">
         
            {/* Sanctioning Body Dropdown */}
            <select
            className="w-full p-2 border rounded"
            value={formData.sanctioning || ''}
            onChange={(e) => handleInputChange('sanctioning', e.target.value)}
          >
            <option value="" disabled>
              Select Sanctioning Body
            </option>
            <option value="none">
              No Sanctioning
            </option>
            <option value="International Kickboxing Federation">
              International Kickboxing Federation
            </option>
            <option value="Point Muay Thai">Point Muay Thai</option>
            <option value="Point Boxing Sparring Circuit">
              Point Boxing Sparring Circuit
            </option>
          </select>
         

          <input
            type="text"
            placeholder="Promotion Name"
            className="w-full p-2 border rounded"
            value={formData.promotion || ''}
            onChange={(e) => handleInputChange('promotion', e.target.value)}
          />


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
            <input
                type="text"
                placeholder="Email"
                className="w-full p-2 border rounded"
                value={formData.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
            />
       

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
