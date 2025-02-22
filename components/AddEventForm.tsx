'use client';

import React, { useState, useEffect } from 'react';
import { EventType, Promoter } from '@/utils/types';
import GoogleAutocomplete from './ui/GoogleAutocomplete';
import { addEvent } from '@/utils/eventManagement';
import { addPmtEvent } from '@/utils/apiFunctions/addPmtEvent';
import { getGeocode } from "use-places-autocomplete";
import { createPmtEventCollection } from '@/utils/apiFunctions/createPmtEventCollection';
import { generateDocId } from '@/utils/eventManagement';


import { uploadEventFlyer } from '@/utils/images/uploadEventFlyer'; // export const uploadEventFlyer = async (file: File, eventId: string): Promise<string> => { this returns the download url


import { FaRegFileImage } from "react-icons/fa";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Icons for dropdown


interface AddEventFormProps {
  onClose: () => void;
  promoter?: Promoter;
}


const AddEventForm: React.FC<AddEventFormProps> = ({ onClose, promoter: initialPromoter }) => {
  const [formData, setFormData] = useState<Partial<EventType>>({
    registration_enabled: true,
    tickets_enabled: false,
    coach_enabled: false,
    photos_enabled: false,
    registration_fee: 0,
    ticket_price: 0,
    ticket_price2: 0,
    coach_price: 0,
    photos_price: 0,
    ticket_system_option: 'none',
    numMats: 2, // Default to 2 mats
   
  });

  const [promoter, setPromoter] = useState<Partial<Promoter>>(initialPromoter || {});
  const [promoterIdInput] = useState('');
  const [promoterError, setPromoterError] = useState<string | null>(null);
  const [sanctioning, setSanctioning] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [promoterSuggestions, setPromoterSuggestions] = useState<Promoter[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [promoterInput, setPromoterInput] = useState('');
  const [selectedPromoter, setSelectedPromoter] = useState<Promoter | null>(null);


  const fetchPromoterSuggestions = async (query: string) => {
    if (query.length < 2) {
      setPromoterSuggestions([]);
      return;
    }

    try {
      const response = await fetch(`/api/promoters`);
      if (!response.ok) throw new Error('Failed to fetch promoters');
      
      const data = await response.json();
      const filteredPromoters = data.promoters.filter((p: Promoter) => 
        p.promoterId.toLowerCase().includes(query.toLowerCase())
      );
      
      setPromoterSuggestions(filteredPromoters);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching promoter suggestions:', error);
    }
  };

  const handlePromoterInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPromoterInput(value);
    fetchPromoterSuggestions(value);
  };


  const handlePromoterSelect = (promoter: Promoter) => {
    setSelectedPromoter(promoter);
    setPromoterInput(promoter.promotionName);
    setShowSuggestions(false);
    setFormData(prev => ({
      ...prev,
      promoterId: promoter.promoterId,
      promoterEmail: promoter.email,
      promotionName: promoter.promotionName
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value,
    }));
  };

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
  

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSubmitError(null);
  
// HERE THE FUNCTION NEEDS TO BE CALLED TO SAVE THE FLYER IMAGE TO FIRBASE STORAGE AND THEN PUT THE DOWNLOAD URL IN THE FORM DATA IN FIELD 'flyer'

      if (!formData.event_name || !formData.date || !formData.address || !sanctioning) {
        throw new Error('Please fill in all required fields');
      }
  
      // ✅ Generate the event ID before making API calls
      const eventId = generateDocId(
        formData.event_name!,
        formData.city ?? "", // ✅ Ensure a default value
        formData.state ?? "", // ✅ Ensure a default value
        formData.date!
      );
  

      if (flyerFile) {
        formData.flyer = await uploadEventFlyer(flyerFile, eventId);
      }

      const eventData: EventType = {
        eventId, // ✅ Use the pre-generated event ID
        docId: eventId, // ✅ Use the same ID for consistency
        id: eventId, // ✅ Ensure `id` is defined
        event_name: formData.event_name ?? "", // ✅ Ensure default value
        venue_name: formData.venue_name ?? "", // ✅ Ensure default value
        address: formData.address ?? "",
        city: formData.city ?? "",
        state: formData.state ?? "",
        date: formData.date ?? "",
        flyer: formData.flyer ?? "", // add the flyer url here if available
        coordinates: formData.coordinates ?? { latitude: 0, longitude: 0 }, // ✅ Default empty coordinates
        registration_link: formData.registration_link ?? "",
        matches_link: formData.matches_link ?? "",
        weighin_date: formData.weighin_date ?? "",
        weighin_start_time: formData.weighin_start_time ?? "",
        weighin_end_time: formData.weighin_end_time ?? "",
        rules_meeting_time: formData.rules_meeting_time ?? "",
        bouts_start_time: formData.bouts_start_time ?? "",
        doors_open: formData.doors_open ?? "",
        spectator_info: formData.spectator_info ?? "",
        registration_enabled: formData.registration_enabled ?? false,
        registration_fee: formData.registration_fee ?? 0,
        tickets_enabled: formData.tickets_enabled ?? false,
        ticket_price: formData.ticket_price ?? 0,
        ticket_price_description: formData.ticket_price_description ?? "",
        ticket_price2: formData.ticket_price2 ?? 0,
        ticket_price2_description: formData.ticket_price2_description ?? "",
        event_details: formData.event_details ?? "",
        coach_price: formData.coach_price ?? 0,
        coach_enabled: formData.coach_enabled ?? false,
        photos_enabled: formData.photos_enabled ?? false,
        photos_price: formData.photos_price ?? 0,
        sanctioning: sanctioning ?? "",
        promotionName: promoter.promotionName ?? "",
        promoterId: promoter.promoterId ?? "",
        promoterEmail: promoter.email ?? "",
        email: formData.email ?? "",
        status: formData.status ?? "confirmed",
        street: formData.street ?? "",
        postal_code: formData.postal_code ?? "",
        country: formData.country ?? "",
        colonia: formData.colonia ?? "",
        municipality: formData.municipality ?? "",
        ticket_enabled: formData.ticket_enabled ?? false,
        ticket_system_option: formData.ticket_system_option ?? "none",
        ticket_link: formData.ticket_link ?? "",
        zip: formData.zip ?? "",
        name: formData.name ?? "",
        numMats: formData.numMats ?? 2, // ✅ Default to 0 if undefined
        competition_type: formData.competition_type ?? "FightCard",
        locale: formData.locale ?? "en",
        disableRegistration: formData.disableRegistration ?? false,
        photoPackagePrice: formData.photoPackagePrice ?? 0,
        coachRegPrice: formData.coachRegPrice ?? 0,
        photoPackageEnabled: formData.photoPackageEnabled ?? false,
        coachRegEnabled: formData.coachRegEnabled ?? false,
        
       

      };
      
  
      // ✅ Call the appropriate API based on sanctioning type
      const result = (sanctioning === 'PMT') ? await addPmtEvent(eventData) : await addEvent(eventData);
  
      // ✅ Explicitly check if the event exists
      if (!result.success || !('event' in result) || !result.event?.eventId) {
        throw new Error(result.message || 'Error creating event');
      }
  
      // ✅ Now that we have an eventId, create the event collection with full event data
      if (sanctioning === 'PMT' && result.event) {
        console.log('Creating PMT event collection, Data Sent', result.event);
        const createCollectionResult = await createPmtEventCollection(result.event);
  
        if (!createCollectionResult.success) {
          throw new Error(createCollectionResult.message || 'Failed to create event collection');
        }
      }
  
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error creating event');
    } finally {
      setLoading(false);
    }
  };
  
  
  
  
  useEffect(() => {
    const fetchPromoterData = async () => {
      if (!promoterIdInput) return;
      
      try {
        const response = await fetch(`/api/promoters/${promoterIdInput}`, {
          method: 'GET',
          headers: { 
            'Content-Type': 'application/json'
          },
        });

        if (!response.ok) {
          const errorData = await response.json();
          setPromoterError(`Failed to fetch promoter: ${errorData.error}`);
          return;
        }

        const data = await response.json();
        if (!data.promoter) {
          setPromoterError('No promoter found with this ID');
          return;
        }

        setPromoter(data.promoter);
        setPromoterError(null);
      } catch (error) {
        setPromoterError('Error fetching promoter data');
        console.error('Error in fetchPromoter:', error);
      }
    };

    if (promoterIdInput) {
      fetchPromoterData();
    }
  }, [promoterIdInput]);
  
  

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg max-h-screen overflow-y-auto relative">
        
        <h2 className="text-xl font-bold mb-4">Create New Event</h2>

        <div className="space-y-4">
        {promoterError && (
          <div className="text-red-500 text-sm mt-2">
            {promoterError}
          </div>
        )}
        {!initialPromoter && (
            <div className="relative">
              <input
                type="text"
                placeholder="Search for promoter..."
                value={promoterInput}
                onChange={handlePromoterInputChange}
                className="w-full p-2 border rounded"
                onFocus={() => setShowSuggestions(true)}
              />
              
              {showSuggestions && promoterSuggestions.length > 0 && (
                <div className="absolute z-10 w-full bg-white border rounded-md shadow-lg mt-1 max-h-60 overflow-y-auto">
                  {promoterSuggestions.map((promoter) => (
                    <div
                      key={promoter.promoterId}
                      className="p-2 hover:bg-gray-100 cursor-pointer"
                      onClick={() => handlePromoterSelect(promoter)}
                    >
                      <div className="font-medium">{promoter.promoterId}</div>
                   
                    </div>
                  ))}
                </div>
              )}

              {selectedPromoter && (
                <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p>Selected Promoter: {selectedPromoter.promotionName}</p>
                  <p>Email: {selectedPromoter.email}</p>
                </div>
              )}
            </div>
          )}


          <select
            value={sanctioning}
            onChange={(e) => setSanctioning(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">Select Sanctioning</option>
            <option value="PMT">Point Muay Thai (PMT)</option>
            <option value="IKF">International Kickboxing Federation (IKF)</option>
            <option value="PBSC">Point Boxing Sparring Circuit (PBSC)</option>
          </select>

          <input
            type="text"
            name="event_name"
            placeholder="Event Name"
            className="w-full p-2 border rounded"
            onChange={handleInputChange}
          />

          <input
            type="date"
            name="date"
            className="w-full p-2 border rounded"
            onChange={handleInputChange}
          />

          <GoogleAutocomplete onSelect={handleAddressSelect} />
       
       
        </div>

<div className="flex items-center space-x-2 py-5">
  <FaRegFileImage />
  <input
    type="file"
    accept="image/*"
    className="w-full p-2 border rounded"
    onChange={(e) => setFlyerFile(e.target.files?.[0] ?? null)}
  />
</div>



 {/* Expandable Advanced Options Section */}

<div className="flex justify-center py-4">
  <button type="button" className="btn-space" onClick={() => setShowAdvanced(!showAdvanced)}>
    {showAdvanced ? 'Hide' : 'Advanced'}
    {showAdvanced ? <FaChevronUp className="ml-2" /> : <FaChevronDown className="ml-2" />}
    <div id="btn-space-container-stars">
      <div id="btn-space-stars"></div>
    </div>
    <div id="btn-space-glow">
      <div className="btn-space-circle"></div>
      <div className="btn-space-circle"></div>
    </div>
  </button>
</div>

          {showAdvanced && (
            <div className="space-y-4 mt-4 p-4 border rounded bg-gray-50">
              <input
                type="text"
                name="venue_name"
                placeholder="Venue Name"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />
              <div>Weighin Start Time</div>
              <input
                type="time"
                name="weighin_start_time"
                placeholder="Weigh-in Start Time"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />
                            <div>Weighin End Time</div>

              <input
                type="time"
                name="weighin_end_time"
                placeholder="Weigh-in End Time"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />
                            <div>Rules Meeting Time</div>

              <input
                type="time"
                name="rules_meeting_time"
                placeholder="Rules Meeting Time"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />
                            <div>Bouts Start Time</div>
              <input
                type="time"
                name="bouts_start_time"
                placeholder="Bouts Start Time"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />
                            <div>Doors Open Time</div>
              <input
                type="time"
                name="doors_open"
                placeholder="Doors Open Time"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />
                                          <div>Spectator Info</div>

              <input
                type="text"
                name="spectator_info"
                placeholder="Spectator Information"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />
            </div>
          )}

        {submitError && <div className="text-red-500 text-sm mt-2">{submitError}</div>}

        <div className="flex justify-center py-4">
        <button className="px-4 py-2 bg-gray-300 rounded mr-2" onClick={onClose}>
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>

      </div>
    </div>
  );
};

export default AddEventForm;