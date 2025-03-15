'use client';

import React, { useState } from 'react';
import { EventType, Promoter } from '@/utils/types';
import GoogleAutocomplete from '@/components/ui/GoogleAutocomplete';
import { addEvent } from '@/utils/eventManagement';

import { addPmtEvent } from '@/utils/apiFunctions/addPmtEvent';
import { createPmtEventCollection } from '@/utils/apiFunctions/createPmtEventCollection';

import { getGeocode } from "use-places-autocomplete";
import { generateDocId } from '@/utils/eventManagement';
import Image from 'next/image';
import { Label } from "@/components/ui/label";
import { uploadEventFlyer } from '@/utils/images/uploadEventFlyer';
import { FaRegFileImage } from "react-icons/fa";
import { FaChevronDown, FaChevronUp } from "react-icons/fa"; // Icons for dropdown
import GoogleMapsProvider from "@/components/ui/GoogleMapsProvider"; // Import our provider


interface AddEventFormProps {
  onClose: () => void;
  promoter?: Promoter;
}

const getSanctioningLogo = (sanctioning: string) => {
  switch (sanctioning?.toUpperCase()) {
    case 'PMT':
      return 'https://www.techbouts.com/logos/pmt_logo_2024_sm.png';
    case 'IKF':
      return 'https://www.techbouts.com/logos/ikf_logo.png';
    case 'PBSC':
      return 'https://www.techbouts.com/logos/pbsc_logo.png';
    default:
      return '';
  }
};

const AddEventForm: React.FC<AddEventFormProps> = ({ onClose, promoter }) => {
  // Initialize form data using promoter from props
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
    numMats: 2,
    promoterId: promoter?.promoterId || '',
    promoterEmail: promoter?.email || '',
    promotionName: promoter?.promotionName || '',
    promotionLogoUrl: promoter?.logo || '',
    locale: 'en',
    currency: 'USD',
  });

  const [sanctioning, setSanctioning] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [flyerFile, setFlyerFile] = useState<File | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSanctioningChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSanctioning(value);
    
    // If a sanctioning is selected, update the formData with the logo URL
    if (value) {
      const logoUrl = getSanctioningLogo(value);
      setFormData(prev => ({
        ...prev,
        sanctioning: value,
        sanctioningLogoUrl: logoUrl
      }));
    } else {
      // If no sanctioning selected, clear the logo
      setFormData(prev => ({
        ...prev,
        sanctioning: '',
        sanctioningLogoUrl: ''
      }));
    }
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
      
      // Set default locale and currency
      let locale = 'en';
      let currency = 'USD';
      
      // Check if the country is Mexico (MX)
      if (country === 'MX') {
        locale = 'es';
        currency = 'MXN';
        console.log("Mexico selected: Setting locale to 'es' and currency to MXN");
      }
  
      // Set the extracted data into form state
      setFormData((prev) => ({
        ...prev,
        address,
        city,
        state,
        country,
        coordinates: { latitude: coordinates.lat, longitude: coordinates.lng },
        locale, // Set the locale based on country selection
        currency // Add currency to the form data
      }));
  
      console.log("Extracted Data:", { city, state, country, locale, currency });
    } catch (error) {
      console.error("Error extracting location details:", error);
    }
  };
  
  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSubmitError(null);
  
      if (!formData.event_name || !formData.date || !formData.address || !sanctioning) {
        throw new Error('Please fill in all required fields');
      }
  
      // Generate the event ID before making API calls
      const eventId = generateDocId(
        formData.event_name!,
        formData.city ?? "", 
        formData.state ?? "", 
        formData.date!
      );
  
      // Handle flyer upload if a file was selected
      if (flyerFile) {
        formData.flyer = await uploadEventFlyer(flyerFile, eventId);
      }
  
      const sanctioningLogoUrl = formData.sanctioningLogoUrl || getSanctioningLogo(sanctioning);
  
      const eventData: EventType = {
        eventId,
        docId: eventId,
        id: eventId,
        event_name: formData.event_name ?? "",
        venue_name: formData.venue_name ?? "",
        address: formData.address ?? "",
        city: formData.city ?? "",
        state: formData.state ?? "",
        date: formData.date ?? "",
        flyer: formData.flyer ?? "",
        coordinates: formData.coordinates ?? { latitude: 0, longitude: 0 },
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
        promotionName: formData.promotionName ?? "",
        promoterId: formData.promoterId ?? "",
        promoterEmail: formData.promoterEmail ?? "",
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
        numMats: formData.numMats ?? 2,
        competition_type: formData.competition_type ?? "FightCard",
        locale: formData.locale ?? "en",
        currency: formData.currency ?? "USD",
        disableRegistration: formData.disableRegistration ?? false,
        photoPackagePrice: formData.photoPackagePrice ?? 0,
        coachRegPrice: formData.coachRegPrice ?? 0,
        photoPackageEnabled: formData.photoPackageEnabled ?? false,
        sanctioningLogoUrl: sanctioningLogoUrl,
        promotionLogoUrl: formData.promotionLogoUrl ?? "",
      };
      
      // Call the appropriate API based on sanctioning type
      if (sanctioning === 'PMT') {
        const result = await addPmtEvent(eventData);
        
        if (!result.success) {
          throw new Error(result.message || 'Error creating event');
        }
        
        // Now that we have verified success, create the event collection
        console.log('Creating PMT event collection, Data Sent', eventData);
        const createCollectionResult = await createPmtEventCollection(eventData);
        
        if (!createCollectionResult.success) {
          throw new Error(createCollectionResult.message || 'Failed to create event collection');
        }
      } else {
        const result = await addEvent(eventData);
        
        if (!result.success) {
          throw new Error(result.message || 'Error creating event');
        }
      }
  
      onClose();
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error creating event');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GoogleMapsProvider>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
        <div className="bg-white p-6 rounded shadow-md w-full max-w-lg max-h-screen overflow-y-auto relative">
          
          <h2 className="text-xl font-bold mb-4">Create New Event</h2>
          
          {promoter && (
            <div className="mb-4 p-2 bg-green-50 border border-green-200 rounded">
              <p className="font-medium">Creating event for: {promoter.promotionName}</p>
              <p className="text-sm">Promoter ID: {promoter.promoterId}</p>
              <p className="text-sm">Email: {promoter.email}</p>
            </div>
          )}

          <div className="space-y-4">
            <select
              value={sanctioning}
              onChange={handleSanctioningChange}
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

            <div className="mt-3 p-2 bg-blue-50 border border-blue-100 rounded text-sm">
            <p className="font-medium">
              Current Settings: {formData.locale === 'es' ? 'Spanish' : 'English'} / 
              {formData.currency === 'MXN' ? ' Mexican Pesos (MXN)' : ' US Dollars (USD)'}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              These settings are automatically determined when the address is selected.
            </p>
          </div>

<input
  type='number'
  name='registration_fee'
  placeholder='Registration Fee'
  className='w-full p-2 border rounded'
  onChange={handleInputChange}
/>


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

          <h2 className="text-xl font-semibold mb-4">Organization Logos</h2>
          
          <div className="grid grid-cols-2 gap-4">
            {/* Promoter Logo */}
            <div>
              <Label>Promoter Logo</Label>
              <div className="mt-2 border rounded-lg p-2 min-h-32 flex items-center justify-center">
                {formData.promotionLogoUrl ? (
                  <div className="text-center">
                    <Image
                      src={formData.promotionLogoUrl}
                      alt="Promoter Logo"
                      width={150}
                      height={150}
                      className="object-contain max-h-28"
                    />
                  </div>
                ) : (
                  <div className="text-gray-400">No promoter logo available</div>
                )}
              </div>
            </div>
            
            {/* Sanctioning Logo */}
            <div>
              <Label>Sanctioning Logo</Label>
              <div className="mt-2 border rounded-lg p-2 min-h-32 flex items-center justify-center">
                {sanctioning ? (
                  <div className="text-center">
                    <img
                      src={getSanctioningLogo(sanctioning)}
                      alt={`${sanctioning} Logo`}
                      className="object-contain max-h-28 max-w-[150px]"
                    />
                  </div>
                ) : (
                  <div className="text-gray-400">No sanctioning selected</div>
                )}
              </div>
            </div>
          </div>

          <div className="text-sm text-gray-500 mt-2">
            Note: These logos will be displayed on the event page and promotional materials.
          </div>

          {/* Expandable Advanced Options Section */}
            <div className="flex justify-center py-4">
            <button 
        type="button" 
        className="button-80 flex flex-col items-center justify-center gap-1" 
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        <span>{showAdvanced ? 'Hide' : 'Advanced'}</span>
        {showAdvanced ? <FaChevronUp size={16} /> : <FaChevronDown size={16} />}
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
    </GoogleMapsProvider>
  );
};

export default AddEventForm;