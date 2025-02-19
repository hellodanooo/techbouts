// app/[eventId]/edit/EditEventForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';

import { EventType } from '@/utils/types';

import { editPmtEvent } from '@/utils/apiFunctions/editPmtEvent';

import { useRouter } from 'next/navigation';


import { uploadEventFlyer } from '@/utils/images/uploadEventFlyer'; // export const uploadEventFlyer = async (file: File, eventId: string): Promise<string> => { this returns the download url


interface TimeFields {
  doors_open: string;
  weighin_start_time: string;
  weighin_end_time: string;
  rules_meeting_time: string;
  bouts_start_time: string;
}

interface EditEventFormProps {
  eventId: string;
    eventData: EventType; 
  }

export default function EditEventForm({ eventData, eventId }: EditEventFormProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
   const [isUploadingFlyer, setIsUploadingFlyer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<EventType & TimeFields>({
    ...eventData,
    doors_open: eventData.doors_open || '',
    weighin_start_time: eventData.weighin_start_time || '',
    weighin_end_time: eventData.weighin_end_time || '',
    rules_meeting_time: eventData.rules_meeting_time || '',
    bouts_start_time: eventData.bouts_start_time || ''
  }); 


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };



const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
  
    try {
      let updatedFormData = { ...formData };
  
      // Upload new flyer if one was selected
      if (selectedFile) {
        setIsUploadingFlyer(true);
        const flyerUrl = await uploadEventFlyer(selectedFile, eventId); // Use eventId prop here
        updatedFormData = {
          ...updatedFormData,
          flyer: flyerUrl
        };
        setIsUploadingFlyer(false);
      }
  
      const updatedEvent = await editPmtEvent(eventId, updatedFormData); // Use eventId prop here
      
      if (!updatedEvent) {
        throw new Error('Failed to update event');
      }
  
      // Redirect back to event page
      router.push(`/events/${eventId}`); // Use eventId prop here
      router.refresh();
    } catch (error) {
      console.error('Error updating event:', error);
      // Add error handling UI here
    } finally {
      setIsUpdating(false);
    }
  };



  const handleCancel = () => {
    router.back();
  };



  useEffect(() => {
    return () => {
      // Cleanup object URL when component unmounts
      if (selectedFile) {
        URL.revokeObjectURL(URL.createObjectURL(selectedFile));
      }
    };
  }, [selectedFile]);


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Event Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
  <Image 
    src={selectedFile ? URL.createObjectURL(selectedFile) : eventData.flyer} 
    alt="Event Flyer" 
    width={200} 
    height={200} 
      style={{ width: 'auto', height: 'auto' }}
  className="max-w-[200px] max-h-[200px] object-contain"
  />
  <label className="block text-sm font-medium text-gray-700">Event Flyer</label>
  <input
    type="file"
    accept="image/*"
    onChange={(e) => {
      const file = e.target.files?.[0];
      if (file) {
        setSelectedFile(file);
      }
    }}
    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
  />
  {isUploadingFlyer && (
    <p className="text-sm text-gray-500 mt-1">
      Uploading flyer...
    </p>
  )}
</div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Date</label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">City</label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">State</label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Registration Fee</label>
            <input
              type="number"
              name="registration_fee"
              value={formData.registration_fee}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Schedule</h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-700">Doors Open</label>
            <input
              type="time"
              name="doors_open"
              value={formData.doors_open}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Weigh-in Start</label>
            <input
              type="time"
              name="weighin_start_time"
              value={formData.weighin_start_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Weigh-in End</label>
            <input
              type="time"
              name="weighin_end_time"
              value={formData.weighin_end_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rules Meeting</label>
            <input
              type="time"
              name="rules_meeting_time"
              value={formData.rules_meeting_time || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Time</label>
            <input
              type="time"
              name="bouts_start_time"
              value={formData.bouts_start_time || ''}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end space-x-4 pt-4">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          disabled={isUpdating}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
          disabled={isUpdating}
        >
          {isUpdating ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  );
}