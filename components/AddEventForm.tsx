// components/AddEventForm.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { Event, Promoter } from '@/utils/types';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import GoogleAutocomplete from './ui/GoogleAutocomplete'; // Import the reusable component
import { addEvent } from '@/utils/eventManagement';
import SanctionPopup from '../components/popups/One'

interface AddEventFormProps {
  onClose: () => void;
  promoters?: Array<{
    promoterId: string;
    name: string;
    email: string;
    promotion: string;
    sanctioning: string;
  }>;
  promoter?: Promoter;

  onOpenAddPromoter?: () => void;
}

const AddEventForm: React.FC<AddEventFormProps> = ({
  onClose,
  onOpenAddPromoter,
  promoters = [],  // Provide default empty array
  promoter
}) => {

  const [formData, setFormData] = useState<Partial<Event>>({
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
  });
  const [sanctioning, setSanctioning] = useState('');
  const [promoterId, setPromoterId] = useState('');
  const [promotionQuery, setPromotionQuery] = useState('');
  const [filteredPromoters, setFilteredPromoters] = useState(promoters);
  const [showDropdown, setShowDropdown] = useState(false);
  const [selectedPromotion, setSelectedPromotion] = useState<{
    promoterId: string;
    name: string;
    email: string;
    promotion: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sanctionPopupOpen, setSanctionPopupOpen] = useState(false);



  useEffect(() => {
    if (promoter && !promoters.length) {
      // Set up initial state for single promoter
      const promotion = {
        promoterId: promoter.promoterId,
        name: `${promoter.firstName} ${promoter.lastName}`,
        email: promoter.email,
        promotion: promoter.promotion,
        sanctioning: promoter.sanctioning
      };
      
      setSelectedPromotion(promotion);
      setSanctioning(promoter.sanctioning);
      setPromoterId(promoter.promoterId);
      setPromotionQuery(promoter.promotion);
      setIsAuthenticated(true); // Auto-authenticate for single promoter case
    }
  }, [promoter, promoters.length]);




  useEffect(() => {
    // For single promoter case (dashboard)
    if (promoter) {
      const singlePromoterArray = [{
        promoterId: promoter.promoterId,
        name: `${promoter.firstName} ${promoter.lastName}`,
        email: promoter.email,
        promotion: promoter.promotion,
        sanctioning: promoter.sanctioning
      }];
      
      // Set initial states without causing loops
      if (!selectedPromotion) {
        setSelectedPromotion(singlePromoterArray[0]);
        setSanctioning(promoter.sanctioning);
        setPromoterId(promoter.promoterId);
        setPromotionQuery(promoter.promotion);
        setFilteredPromoters(singlePromoterArray);
        setShowDropdown(false);
      }
    } 
    // For multiple promoters case
    else if (promoters && promoters.length > 0) {
      console.log('Initial promoters:', promoters);
      
      if (promotionQuery.length >= 2) {
        const filtered = promoters.filter((promo) =>
          promo.promotion.toLowerCase().includes(promotionQuery.toLowerCase())
        );
        setFilteredPromoters(filtered);
        setShowDropdown(!isAuthenticated && filtered.length > 0);
      } else {
        setFilteredPromoters(promoters);
        setShowDropdown(false);
      }
    }
  }, [promoters, promoter, promotionQuery, isAuthenticated]);



  // Handle promotion selection
  const handlePromotionSelect = async (promotion: {
    promoterId: string;
    name: string;
    email: string;
    promotion: string;
    sanctioning: string;
  }) => {
    if (isAuthenticated) return;
  
    // Set all states at once
    setPromotionQuery(promotion.promotion);
    setSelectedPromotion(promotion);
    setSanctioning(promotion.sanctioning);
    setPromoterId(promotion.promoterId);
    setShowDropdown(false);
    setFilteredPromoters([promotion]); // Set to single item array
  
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
        // Reset all states on failure
        setSelectedPromotion(null);
        setPromotionQuery('');
        setSanctioning('');
        setPromoterId('');
        setFilteredPromoters(promoters); // Reset to original list
        alert('Authentication failed: Email does not match the promoter!');
      }
    } catch (error) {
      console.error('Authentication error:', error);
      alert('Failed to authenticate with Google.');
      // Reset all states on error
      setSelectedPromotion(null);
      setPromotionQuery('');
      setSanctioning('');
      setPromoterId('');
      setFilteredPromoters(promoters); // Reset to original list
    } finally {
      setLoading(false);
    }
  };


  // Handle form input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'date') {
      // Ensure date is in YYYY-MM-DD format
      const dateValue = value ? new Date(value).toISOString().split('T')[0] : '';
      setFormData(prev => ({
        ...prev,
        [name]: dateValue
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'number' ? parseFloat(value) : value,
      }));
    }
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

      if (!/^\d{4}-\d{2}-\d{2}$/.test(formData.date)) {
        throw new Error('Invalid date format. Please select a valid date.');
      }
      console.log('PromoterId:', formData.promoterId);

      const eventData: Event = {
        ...formData,
        event_name: formData.event_name!,
        date: formData.date!,
        address: formData.address!,
        promotion: selectedPromotion.promotion,
        promoterId: promoterId,
        promoterEmail: selectedPromotion.email,
        status: 'pending',
        eventId: '', // This will be generated by addEvent function
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
        sanctioning: sanctioning,
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
          {/* Promoter Selection - only show if we have multiple promoters */}
          {promoters.length > 0 ? (
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
                      key={promo.promoterId}
                      className="p-2 cursor-pointer hover:bg-gray-200"
                      onClick={() => handlePromotionSelect(promo)}
                    >
                      {promo.promotion}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            // Show readonly promotion info if we have a single promoter
            promoter && (
              <div className="w-full p-2 border rounded bg-gray-50">
                {promoter.promotion}
              </div>
            )
          )}
  
          {/* Only show Add Promoter button if we have promoters array and not authenticated */}
          {promoters.length > 0 && !isAuthenticated && onOpenAddPromoter && (
            <button
              className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
              onClick={onOpenAddPromoter}
            >
              Add Promoter
            </button>
          )}
  
          {/* Show form fields if authenticated OR if we have a single promoter */}
          {(isAuthenticated || (promoter && !promoters.length)) && (
            <div className="space-y-4">
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
            disabled={loading || (!isAuthenticated && promoters.length > 0)}
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
}

export default AddEventForm;
