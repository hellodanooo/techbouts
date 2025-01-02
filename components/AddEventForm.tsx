'use client';

import React, { useState, useEffect } from 'react';
import { Event } from '@/utils/types';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import GoogleAutocomplete from './ui/GoogleAutocomplete'; // Import the reusable component
import { addEvent } from '@/utils/eventManagement';
import SanctionPopup from '../components/popups/One'

interface AddEventFormProps {
  onClose: () => void;
  promoters: { id: string; name: string; email: string; promotion: string; sanctioning: string; }[];
  onOpenAddPromoter: () => void;
}

const AddEventForm: React.FC<AddEventFormProps> = ({
  onClose,
  onOpenAddPromoter,
  promoters,
}) => {

  const [formData, setFormData] = useState<Partial<Event>>({
    registration_enabled: true,
    tickets_enabled: false,
    coach_enabled: false,
    photos_enabled: false,
    registration_fee: 65,
    ticket_price: 0,
    ticket_price2: 0,
    coach_price: 0,
    photos_price: 0,
    ticket_system_option: 'none',
  });
  const [sanctioning, setSanctioning] = useState('');
  const [promotionQuery, setPromotionQuery] = useState('');
  const [filteredPromoters, setFilteredPromoters] = useState(promoters);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<{
    id: string;
    name: string;
    email: string;
    promotion: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sanctionPopupOpen, setSanctionPopupOpen] = useState(false);

  // Handle input query and filter promoters
  useEffect(() => {
    if (promotionQuery.length >= 2) {
      const filtered = promoters.filter((promo) =>
        promo.promotion.toLowerCase().includes(promotionQuery.toLowerCase())
      );
      setFilteredPromoters(filtered);
      setShowDropdown(filtered.length > 0 && !isAuthenticated);
    } else {
      setShowDropdown(false);
    }
  }, [promotionQuery, promoters, isAuthenticated]);

  // Handle promotion selection
  const handlePromotionSelect = async (promotion: {
    id: string;
    name: string;
    email: string;
    promotion: string;
    sanctioning: string;
  }) => {
    if (isAuthenticated) return; // Prevent re-authentication if already authenticated

    setPromotionQuery(promotion.promotion);
    setSelectedPromotion(promotion);
    setSanctioning(promotion.sanctioning);
    setShowDropdown(false);

    try {
      setLoading(true);
      const auth = getAuth();
      const provider = new GoogleAuthProvider();

      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      if (user && user.email === promotion.email) {
        setIsAuthenticated(true);
        alert('Authenticated successfully as the promoter!');
      } else {
        alert('Authentication failed: Email does not match the promoter!');
        setSelectedPromotion(null);
        setPromotionQuery('');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Failed to authenticate with Google.');
      setSelectedPromotion(null);
      setPromotionQuery('');
    } finally {
      setLoading(false);
    }
  };

  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'number' ? parseFloat(value) : value,
    });
  };

  // Handle address selection from GoogleAutocomplete
  const handleAddressSelect = (
    address: string,
    coordinates: { lat: number; lng: number }
  ) => {
    // Parse address components
    const addressParts = address.split(',').map(part => part.trim());
    const street = addressParts[0];
    const city = addressParts[1];
    const state = addressParts[2];
    const country = addressParts[3];

    console.log('address:', address);
    console.log('street:', street);
    console.log('city:', city);
    console.log('state:', state);
    console.log('country:', country);
    console.log('coordinates:', coordinates);


    setFormData({
      ...formData,
      address,
      street,
      city,
      state,
      country,
      coordinates: {
        latitude: coordinates.lat,
        longitude: coordinates.lng
      }
    });
  };


  const handleSubmit = async () => {
    try {
      setLoading(true);
      setSubmitError(null);

      if (!selectedPromotion) {
        throw new Error('Please select a promotion');
      }

      if (!formData.event_name || !formData.date || !formData.address) {
        throw new Error('Please fill in all required fields');
      }

      const eventData: Event = {
        ...formData,
        event_name: formData.event_name!,
        date: formData.date!,
        address: formData.address!,
        promotion: selectedPromotion.promotion,
        promoterId: selectedPromotion.id,
        promoterEmail: selectedPromotion.email,
        status: 'pending',
        id: '', // This will be generated by addEvent function
        docId: '', // This will be generated by addEvent function
        flyer: '',
        weighin_date: formData.date!, // Default to event date
        weighin_start_time: '',
        weighin_end_time: '',
        rules_meeting_time: '',
        bouts_start_time: '',
        doors_open: '',
        spectator_info: '',
        event_details: '',
        ticket_price_description: '',
        ticket_price2_description: '',
        sanctioning: '',
        email: selectedPromotion.email,
      } as Event;

      const result = await addEvent(eventData);

      if (result.success) {
        onClose();
      } else {
        throw new Error(result.message);
      }
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : 'Error creating event');
      console.error('Error creating event:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle sanctioning selection
  const handleSanctioningChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSanctioning(e.target.value);
    setSanctionPopupOpen(true);
  };


  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg">
        <h2 className="text-xl font-bold mb-4">Create New Event</h2>
        <div className="space-y-4">
          {/* Promoter Selection */}
          <div className="relative">
            <input
              type="text"
              placeholder="Promotion Name"
              className="w-full p-2 border rounded"
              value={promotionQuery}
              onChange={(e) => setPromotionQuery(e.target.value)}
              disabled={isAuthenticated}
            />
            {showDropdown && (
              <ul className="absolute z-10 border rounded bg-white w-full max-h-40 overflow-y-auto">
                {filteredPromoters.map((promo) => (
                  <li
                    key={promo.id}
                    className="p-2 cursor-pointer hover:bg-gray-200"
                    onClick={() => handlePromotionSelect(promo)}
                  >
                    {promo.promotion}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {!isAuthenticated && (
            <button
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
              onClick={onOpenAddPromoter}
            >
              Add Promoter
            </button>

          )}




          {isAuthenticated && (
            <div className="space-y-4">


              {/* Sanctioning Selection */}
              <select
                value={sanctioning}
                onChange={handleSanctioningChange}
                className="w-full p-2 border rounded"
                disabled={true}

              >
                <option value="">Select Sanctioning</option>
                <option value="IKF">International Kickboxing Federation (IKF)</option>
                <option value="PMT">Point Muay Thai (PMT)</option>
                <option value="PBSC">Point Boxing Sparring Circuit (PBSC)</option>
                <option value="none">None</option>
              </select>

              {/* Event Name */}
              <input
                type="text"
                name="eventName"
                placeholder="Event Name"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />

              {/* Event Date */}
              <input
                type="date"
                name="eventDate"
                className="w-full p-2 border rounded"
                onChange={handleInputChange}
              />



              <GoogleAutocomplete onSelect={handleAddressSelect} />
            </div>
          )}

          {submitError && (
            <div className="text-red-500 text-sm mt-2">
              {submitError}
            </div>
          )}
        </div>

        <div className="mt-4 flex justify-end">
          <button
            className="px-4 py-2 bg-gray-300 rounded mr-2"
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
            onClick={handleSubmit}
            disabled={loading || !isAuthenticated}
          >
            {loading ? 'Creating...' : 'Create Event'}
          </button>
        </div>
      </div>

      {sanctionPopupOpen && (
        <SanctionPopup
          popUpSource="sanctioningDetails"
          selectedSanctioning={sanctioning}
          onClose={() => setSanctionPopupOpen(false)}
        />
      )}

    </div>
  );
};

export default AddEventForm;
