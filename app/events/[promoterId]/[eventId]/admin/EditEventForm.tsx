// app/[eventId]/edit/EditEventForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { EventType } from '@/utils/types';

import { editPmtEvent } from '@/utils/apiFunctions/editPmtEvent';
import { editTechBoutsEvent } from '@/utils/apiFunctions/editTechBoutsEvent';

import { useRouter } from 'next/navigation';
import { uploadEventFlyer } from '@/utils/images/uploadEventFlyer';
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import GoogleAutocomplete from '@/components/ui/GoogleAutocomplete';
import { getGeocode } from "use-places-autocomplete";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import GoogleMapsProvider from "@/components/ui/GoogleMapsProvider";
import { deleteTechBoutsEvent } from '@/utils/apiFunctions/deleteTechBoutsEvent';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Trash2 } from "lucide-react";

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
  promoterId: string;
}

export default function EditEventForm({ eventData, promoterId, eventId }: EditEventFormProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploadingFlyer, setIsUploadingFlyer] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);


  const [openSections, setOpenSections] = useState({
    details: false,

  });



  const handleDeleteEvent = async () => {
    setIsDeleting(true);
    try {
      const success = await deleteTechBoutsEvent(promoterId, eventId);
      if (success) {
        router.push(`/events/${promoterId}`); // Redirect to events list
        router.refresh();
      } else {
        throw new Error('Failed to delete event');
      }
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete the event. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  const toggleSection = (section: keyof typeof openSections) => {
    setOpenSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const [formData, setFormData] = useState<EventType & TimeFields>({
    ...eventData,
    event_name: eventData.event_name || '',
    doors_open: eventData.doors_open || '',
    weighin_start_time: eventData.weighin_start_time || '',
    weighin_end_time: eventData.weighin_end_time || '',
    rules_meeting_time: eventData.rules_meeting_time || '',
    bouts_start_time: eventData.bouts_start_time || '',
    registration_fee: eventData.registration_fee || 0,
    ticket_price: eventData.ticket_price || 0,
    photoPackagePrice: eventData.photoPackagePrice || 0,
    coachRegPrice: eventData.coachRegPrice || 0,
    numMats: eventData.numMats ? Number(eventData.numMats) : 1,
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
    sanctioning: eventData.sanctioning || '',
    photoPackageEnabled: eventData.photoPackageEnabled || false,
    coachRegEnabled: eventData.coachRegEnabled || false,
    disableRegistration: eventData.disableRegistration || false,
    payLaterEnabled: eventData.payLaterEnabled,
    customWaiver: eventData.customWaiver || '',
    redirect_url: eventData.redirect_url || '',
  });


  const [customWaiverEnabled, setCustomWaiverEnabled] = useState(!!formData.customWaiver);
const [redirectUrlEnabled, setRedirectUrlEnabled] = useState(!!formData.redirect_url);


  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Explicitly convert numeric fields
    const numericFields = ['numMats', 'registration_fee', 'ticket_price', 'photoPackagePrice', 'coachRegPrice'];

    if (numericFields.includes(name)) {
      const sanitizedValue = value.replace(/^0+(?=\d)/, ''); 
      setFormData(prev => ({
        ...prev,
        [name]: sanitizedValue === '' ? '' : Number(sanitizedValue)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {

    if (eventData.sanctioning === 'PMT') {

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

 
        router.refresh();

        alert('Event Details Updated Successfully');

      } catch (error) {
        console.error('Error updating event:', error);
      } finally {
        setIsUpdating(false);
      }
    } else {
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

        const updatedEvent = await editTechBoutsEvent(promoterId, eventId, updatedFormData);

        if (!updatedEvent) {
          throw new Error('Failed to update event');
        }

        router.push(`/events/${promoterId}/${eventId}`);
        router.refresh();


      } catch (error) {
        console.error('Error updating event:', error);
      } finally {
        setIsUpdating(false);
      }
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
    <GoogleMapsProvider>

      <Collapsible
        open={openSections.details}
        onOpenChange={() => toggleSection('details')}
        className="w-full border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100">
          <h2 className="text-xl font-semibold">Event Details</h2>
          {openSections.details ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 bg-white">

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-white p-6 rounded-lg shadow space-y-4">
                <h2 className="text-xl font-semibold mb-4">Event Details</h2>


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
                  <Label>Event Name</Label>
                  <input
                    type="text"
                    name="event_name"
                    value={formData.event_name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    required
                  />
                </div>

                <div>
                  <Label>Sanctioning</Label>
                  <Select
                    value={formData.sanctioning || 'none'}  // Provide default value
                    onValueChange={(value: 'PMT' | 'IKF' | 'PBSC' | 'None') => {
                      setFormData(prev => ({
                        ...prev,
                        sanctioning: value
                      }));
                    }
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select sanctioning" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PMT">PMT</SelectItem>
                      <SelectItem value="IKF">IKF</SelectItem>
                      <SelectItem value="PBSC">PBSC</SelectItem>
                      <SelectItem value="None">None</SelectItem>
                    </SelectContent>
                  </Select>
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
                    value={formData.promoterEmail}
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
                    onFocus={(e) => e.target.select()}

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

                <div>
                  <Label>Event Details</Label>
                  <textarea
                    name="event_details"
                    value={formData.event_details}
                    onChange={handleInputChange}
                    className="h-40 mt-1 block w-full rounded-md border-gray-300 shadow-sm"
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
                    onFocus={(e) => e.target.select()}

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
                    {formData.ticket_enabled && formData.ticket_system_option !== 'thirdParty' && (
                  <div>
                    <Label>Ticket Price</Label>
                    <input
                      type="number"
                      name="ticket_price"
                      value={formData.ticket_price}
                      onChange={handleInputChange}
                      onFocus={(e) => e.target.select()}
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>

                )}
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
                      onFocus={(e) => e.target.select()}

                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                )}

                {/* ///////////// COACH AREA */}
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
                      onFocus={(e) => e.target.select()}

                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                    />
                  </div>
                )}
                {/* ///////////// COACH AREA ^^^^^^^^^ */}

                <div className="flex items-center space-x-4">
                  <Switch
                    id="payLater"
                    checked={formData.payLaterEnabled}
                    onCheckedChange={handleSwitchChange('payLaterEnabled')}
                  />
                  <Label htmlFor="coach-reg">Allow Pay Later</Label>
                </div>




                <div className="space-y-4">
                  <div className="flex items-center space-x-4">
                    <Switch
                      id="custom-waiver"
                      checked={customWaiverEnabled}
                      onCheckedChange={(checked) => {
                        setCustomWaiverEnabled(checked);
                        if (!checked) {
                          setFormData(prev => ({ ...prev, customWaiver: '' }));
                        }
                      }}
                    />
                    <Label htmlFor="custom-waiver">Add Custom Waiver</Label>
                  </div>

                  {customWaiverEnabled && (
                    <div>
                      <Label htmlFor="customWaiver">Custom Waiver Content</Label>
                      <textarea
                        id="customWaiver"
                        name="customWaiver"
                        value={formData.customWaiver || ''}
                        onChange={handleInputChange}
                        className="h-40 mt-1 block w-full rounded-md border-gray-300 shadow-sm"
                        placeholder="Enter your custom waiver text here..."
                      />
                    </div>
                  )}
                </div>


                <div className="space-y-4">
  <div className="flex items-center space-x-4">
    <Switch
      id="redirect_url_enabled"
      checked={redirectUrlEnabled}
      onCheckedChange={(checked) => {
        setRedirectUrlEnabled(checked);
        if (!checked) {
          setFormData(prev => ({ ...prev, redirect_url: '' }));
        }
      }}
    />
    <Label htmlFor="redirect_url_enabled">Add Redirect URL</Label>
  </div>

  {redirectUrlEnabled && (
    <div>
      <Label htmlFor="redirect_url">Redirect URL</Label>
      <input
        type="url"
        id="redirect_url"
        name="redirect_url"
        value={formData.redirect_url || ''}
        onChange={handleInputChange}
        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
        placeholder="Enter the URL to redirect users after registration"
      />
    </div>
  )}
</div>


                <div className="flex items-center space-x-4">
                  <Switch
                    id="disable-registration"
                    checked={formData.disableRegistration}
                    onCheckedChange={handleSwitchChange('disableRegistration')}
                  />
                  <Label htmlFor="disable-registration">Disable Registration</Label>
                </div>

              </div>
            </div>


            <div className="flex justify-between pt-4">
              {/* Left side - Delete button */}
              <div>
                <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                  <AlertDialogTrigger asChild>
                    <button
                      type="button"
                      className="px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 flex items-center"
                      disabled={isDeleting || isUpdating}
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Event
                    </button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete the event
                        {formData.name} and all associated data.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleDeleteEvent}
                        className="bg-red-600 hover:bg-red-700"
                        disabled={isDeleting}
                      >
                        {isDeleting ? 'Deleting...' : 'Delete Event'}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>

              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  disabled={isUpdating || isDeleting}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                  disabled={isUpdating || isDeleting}
                >
                  {isUpdating ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>

          </form>
        </CollapsibleContent>
      </Collapsible>
    </GoogleMapsProvider>

  );
}