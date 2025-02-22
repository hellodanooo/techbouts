// app/[eventId]/edit/EditEventForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { EventType } from '@/utils/types';
import { editPmtEvent } from '@/utils/apiFunctions/editPmtEvent';
import { useRouter } from 'next/navigation';
import { uploadEventFlyer } from '@/utils/images/uploadEventFlyer';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import GoogleAutocomplete from '@/components/ui/GoogleAutocomplete';
import { getGeocode } from "use-places-autocomplete";

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
    name: eventData.event_name || eventData.name || '',
    doors_open: eventData.doors_open || '',
    weighin_start_time: eventData.weighin_start_time || '',
    weighin_end_time: eventData.weighin_end_time || '',
    rules_meeting_time: eventData.rules_meeting_time || '',
    bouts_start_time: eventData.bouts_start_time || '',
    registration_fee: eventData.registration_fee || 0,
    ticket_price: eventData.ticket_price || 0,
    photoPackagePrice: eventData.photoPackagePrice || 0,
    coachRegPrice: eventData.coachRegPrice || 0,
    numMats: eventData.numMats || 1,
    ticket_enabled: eventData.ticket_enabled || false,
    ticket_system_option: eventData.ticket_system_option || 'thirdParty',
    ticket_link: eventData.ticket_link || '',
    address: eventData.address || '',
    street: eventData.street || '',
    city: eventData.city || '',
    state: eventData.state || '',
    zip: eventData.zip || '',
    country: eventData.country || '',
    email: eventData.email || '',
    event_details: eventData.event_details || '',
    promoterId: eventData.promoterId || '',
    status: eventData.status || 'confirmed',

    photoPackageEnabled: eventData.photoPackageEnabled || false,
    coachRegEnabled: eventData.coachRegEnabled || false,
    disableRegistration: eventData.disableRegistration || false,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      let updatedFormData = { ...formData };

      if (selectedFile) {
        setIsUploadingFlyer(true);
        const flyerUrl = await uploadEventFlyer(selectedFile, eventId);
        updatedFormData = {
          ...updatedFormData,
          flyer: flyerUrl
        };
        setIsUploadingFlyer(false);
      }

      const updatedEvent = await editPmtEvent(eventId, updatedFormData);
      
      if (!updatedEvent) {
        throw new Error('Failed to update event');
      }

      router.push(`/events/${eventId}`);
      router.refresh();
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  useEffect(() => {
    return () => {
      if (selectedFile) {
        URL.revokeObjectURL(URL.createObjectURL(selectedFile));
      }
    };
  }, [selectedFile]);


  const handleAddressSelect = async (address: string, coordinates: { lat: number; lng: number }) => {
    try {
      const results = await getGeocode({ address });
      const place = results[0];
      
      if (!place) {
        console.error("No geocode results found");
        return;
      }
  
      const addressComponents = place.address_components;
  
      // Extract city, state, and country
      let city = "";
      let state = "";
      let country = "";
  
      addressComponents.forEach((component) => {
        const types = component.types;
  
        if (types.includes("locality")) {
          city = component.long_name;
          console.log("Add Event Form City:", city);
        } else if (types.includes("administrative_area_level_1")) {
          state = component.short_name; 
          console.log("Add Event Form State:", state);
        } else if (types.includes("country")) {
          console.log("Add Event Form Country:", component.short_name);
          country = component.short_name; // e.g., "US" or "MX"
        }
      });
  
      // Set the extracted data into form state
      setFormData((prev) => ({
        ...prev,
        address,
        city,
        state,
        country,
        coordinates: { latitude: coordinates.lat, longitude: coordinates.lng },
      }));
  
      console.log("Extracted Data:", { city, state, country });
    } catch (error) {
      console.error("Error extracting location details:", error);
    }
  };


  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid md:grid-cols-2 gap-8">
        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Event Details</h2>
          
          <div>
            <Label>Event Name</Label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <Image 
              src={selectedFile ? URL.createObjectURL(selectedFile) : formData.flyer || '/default-flyer.jpg'}
              alt="Event Flyer"
              width={200}
              height={200}
              className="max-w-[200px] max-h-[200px] object-contain"
            />
            <Label>Event Flyer</Label>
            <input
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setSelectedFile(file);
              }}
              className="mt-1 block w-full"
            />
            {isUploadingFlyer && <p className="text-sm text-gray-500">Uploading flyer...</p>}
          </div>

          <div>
            <Label>Date</Label>
            <input
              type="date"
              name="date"
              value={formData.date}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <Label>Address</Label>
            <GoogleAutocomplete onSelect={handleAddressSelect} />
          </div>

          <div>
            <Label>City</Label>
            <input
              type="text"
              name="city"
              value={formData.city}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <Label>State</Label>
            <input
              type="text"
              name="state"
              value={formData.state}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              required
            />
          </div>

          <div>
            <Label>Zip</Label>
            <input
              type="text"
              name="zip"
              value={formData.zip}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Country</Label>
            <input
              type="text"
              name="country"
              value={formData.country}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Email</Label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Registration Fee</Label>
            <input
              type="number"
              name="registration_fee"
              value={formData.registration_fee}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Schedule</h2>
          
          <div>
            <Label>Doors Open</Label>
            <input
              type="time"
              name="doors_open"
              value={formData.doors_open}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Weigh-in Start</Label>
            <input
              type="time"
              name="weighin_start_time"
              value={formData.weighin_start_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Weigh-in End</Label>
            <input
              type="time"
              name="weighin_end_time"
              value={formData.weighin_end_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Rules Meeting</Label>
            <input
              type="time"
              name="rules_meeting_time"
              value={formData.rules_meeting_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Bouts Start Time</Label>
            <input
              type="time"
              name="bouts_start_time"
              value={formData.bouts_start_time}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow space-y-4">
          <h2 className="text-xl font-semibold mb-4">Settings</h2>
          
          <div>
            <Label>Number of Mats</Label>
            <input
              type="number"
              name="numMats"
              value={formData.numMats}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div>
            <Label>Ticket Price</Label>
            <input
              type="number"
              name="ticket_price"
              value={formData.ticket_price}
              onChange={handleInputChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>

          <div className="flex items-center space-x-4">
            <Switch
              id="ticket-enabled"
              checked={formData.ticket_enabled}
              onCheckedChange={handleSwitchChange('ticket_enabled')}
            />
            <Label htmlFor="ticket-enabled">Enable Tickets</Label>
          </div>

          {formData.ticket_enabled && (
            <>
              <div>
  <Label>Ticket System</Label>
  <Select
    value={formData.ticket_system_option || 'none'}  // Provide default value
    onValueChange={(value: 'inHouse' | 'thirdParty' | 'none') => {
      setFormData(prev => ({
        ...prev,
        ticket_system_option: value
      }));
    }}
  >
    <SelectTrigger>
      <SelectValue placeholder="Select ticket system" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="inHouse">In-House</SelectItem>
      <SelectItem value="thirdParty">Third Party</SelectItem>
      <SelectItem value="none">None</SelectItem>
    </SelectContent>
  </Select>
</div>

              {formData.ticket_system_option === 'thirdParty' && (
                <div>
                  <Label>Ticket Link</Label>
                  <input
                    type="url"
                    name="ticket_link"
                    value={formData.ticket_link}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                  />
                </div>
              )}
            </>
          )}

          <div className="flex items-center space-x-4">
            <Switch
              id="photo-package"
              checked={formData.photoPackageEnabled}
              onCheckedChange={handleSwitchChange('photoPackageEnabled')}
            />
            <Label htmlFor="photo-package">Photo Package</Label>
          </div>

          {formData.photoPackageEnabled && (
            <div>
              <Label>Photo Package Price</Label>
              <input
                type="number"
                name="photoPackagePrice"
                value={formData.photoPackagePrice}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          )}

          <div className="flex items-center space-x-4">
            <Switch
              id="coach-reg"
              checked={formData.coachRegEnabled}
              onCheckedChange={handleSwitchChange('coachRegEnabled')}
            />
            <Label htmlFor="coach-reg">Coach Registration</Label>
          </div>

          {formData.coachRegEnabled && (
            <div>
              <Label>Coach Registration Price</Label>
              <input
                type="number"
                name="coachRegPrice"
                value={formData.coachRegPrice}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
          )}
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