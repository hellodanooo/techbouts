// pages/promoter/PromoterEditEvent.tsx
import React, { FC, useState, useEffect } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getFirestore, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase_pmt/config';
import { EventType } from '../../utils/types';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import { generateDocId } from '@/utils/events/eventManagement';
import Image from 'next/image';

interface PendingEventData {
  events: EventType[];
  lastUpdated?: string;
}
interface StripeError {
  message: string;
}

interface PromoterEditEventProps {
  event: EventType | null;
  eventId: string;
  onCancelUpdate: () => void;
  onUpdateSuccess: () => void;
}

interface PaymentFormProps {
  event: EventType;
  onSuccess: () => void;
  onCancel: () => void;
  validateFields: () => boolean;
}

const PaymentForm: FC<PaymentFormProps> = ({ 
  event, 
  onSuccess, 
  onCancel,
  validateFields
}) => {
  const stripe = useStripe();
  const elements = useElements();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateFields()) {
      setError('Please fill in all required fields');
      return;
    }
  
    if (!stripe || !elements) {
      setError('Stripe has not been initialized');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card Element not found');
      }
  
      const { error: stripeError, token } = await stripe.createToken(cardElement);
  
      if (stripeError) {
        throw new Error(stripeError.message);
      }
  
      if (!token) {
        throw new Error('Failed to create payment token');
      }
  
      const response = await fetch('/api/stripePromoter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: token.id,
          eventData: {
            ...event,
            name: event.event_name || event.name,
            promoterId: event.promoterId
          },
          promoterId: event.promoterId
        })
      });
  
      const data = await response.json();
  
      if (!data.success) {
        throw new Error(data.message || 'Payment failed');
      }
  
      onSuccess();
    } catch (err) {
      const error = err as Error | StripeError;
      setError(error.message);
      console.error('Payment error:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border p-4 rounded mb-6">
      <h3 className="font-bold mb-4">Payment Required</h3>
      <p className="mb-4">A payment of $250 is required to publish this approved event.</p>
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <CardElement
            options={{
              style: {
                base: {
                  fontSize: '16px',
                  color: '#424770',
                  '::placeholder': {
                    color: '#aab7c4',
                  },
                },
              },
            }}
          />
        </div>
  
        {error && (
          <div className="text-red-600 mb-4">
            {error}
          </div>
        )}
  
        <div className="flex gap-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            disabled={loading}
          >
            {loading ? 'Processing...' : 'Pay $250 and Publish'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
            disabled={loading}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

const PromoterEditEvent: FC<PromoterEditEventProps> = ({ 
  event, 
  eventId, 
  onCancelUpdate, 
  onUpdateSuccess 
}) => {
  const [showPayment, setShowPayment] = useState(false);
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('');
  const [ticket_enabled, setTicketEnabled] = useState(false);
  const [ticket_system_option, setTicketSystemOption] = useState<'none' | 'inHouse' | 'thirdParty'>('none');
  const [ticket_price, setTicketPrice] = useState<number>(0);
  const [ticket_link, setTicketLink] = useState('');
  const [flyer, setFlyer] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [colonia, setColonia] = useState('');
  const [municipality, setMunicipality] = useState('');
  
  const countries = [
    { code: 'USA', name: 'United States' },
    { code: 'MEX', name: 'Mexico' },
    { code: 'CAN', name: 'Canada' },
  ];

  useEffect(() => {
    if (event) {
      setStreet(event.street || '');
      setCity(event.city || '');
      setState(event.state || '');
      // Use postal_code if it exists, otherwise fall back to zip
      setZip(event.postal_code || event.zip || '');
      setCountry(event.country || '');
      setColonia(event.colonia || '');
      setMunicipality(event.municipality || '');
      setFlyer(event.flyer || '');
      setTicketEnabled(event.ticket_enabled || false);
      setTicketSystemOption(event.ticket_system_option || 'none');
      setTicketPrice(event.ticket_price || 0);
      setTicketLink(event.ticket_link || '');
    }
  }, [event]);

  const getStateLabel = () => {
    switch (country) {
      case 'MEX':
        return 'Estado';
      case 'CAN':
        return 'Province';
      default:
        return 'State';
    }
  };

  const getPostalLabel = () => {
    switch (country) {
      case 'MEX':
        return 'Código Postal';
      case 'CAN':
        return 'Postal Code';
      default:
        return 'ZIP';
    }
  };

  const formatAddress = () => {
    if (country === 'MEX') {
      return `${street.trim()}, ${colonia.trim()}, ${municipality.trim()}, ${zip.trim()} ${city.trim()}, ${state.trim()}, ${country}`;
    }
    return `${street.trim()}, ${city.trim()}, ${state.trim()} ${zip.trim()}, ${country}`;
  };

  const validateFields = () => {
    const newErrors: Record<string, string> = {};
    
    if (event?.status === 'approved') {
      if (!street.trim()) newErrors.street = 'Street is required';
      if (!city.trim()) newErrors.city = 'City is required';
      if (!state.trim()) newErrors.state = `${getStateLabel()} is required`;
      if (!zip.trim()) newErrors.zip = `${getPostalLabel()} is required`;
      if (!country.trim()) newErrors.country = 'Country is required';
      
      if (country === 'MEX') {
        if (!colonia.trim()) newErrors.colonia = 'Colonia is required';
        if (!municipality.trim()) newErrors.municipality = 'Municipio is required';
      }

      if (ticket_enabled) {
        if (ticket_system_option === 'inHouse' && !ticket_price) {
          newErrors.ticket_price = 'Ticket price is required';
        }
        if (ticket_system_option === 'thirdParty' && !ticket_link) {
          newErrors.ticket_link = 'Ticket link is required';
        }
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };




  const handlePaymentSuccess = async () => {
    if (!event) {
      console.error("No event data available");
      return;
    }

    if (!validateFields()) {
      alert('Please fill in all required fields before proceeding.');
      return;
    }

    try {
      const db = getFirestore(app);
      const fullAddress = formatAddress();
      const cityFormatted = city.replace(/\s+/g, '_');
      const docId = generateDocId(event.sanctioning, event.event_name, cityFormatted, state, zip);
      const newEventData = {
        ...event,
        name: event.event_name,
        address: fullAddress,
        street,
        city,
        state,
        zip,
        country,
        colonia: country === 'MEX' ? colonia : '',
        municipality: country === 'MEX' ? municipality : '',
        flyer,
        ticket_enabled,
        ticket_system_option,
        ticket_price,
        ticket_link,
        status: 'confirmed',
        id: docId,
        registration_fee: 65
      };

      await setDoc(doc(db, 'events', docId), newEventData);

      // Update event calendar
      const upcomingEventsRef = doc(db, 'event_calendar', 'upcoming_events');
      const upcomingDoc = await getDoc(upcomingEventsRef);
      
      if (upcomingDoc.exists()) {
        const upcomingData = upcomingDoc.data() as PendingEventData;
        const updatedEvents = [...(upcomingData.events || []), {
          ...newEventData,
          eventId: docId
        }];
        updatedEvents.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        await updateDoc(upcomingEventsRef, { 
          events: updatedEvents,
          lastUpdated: new Date().toISOString()
        });
      } else {
        await setDoc(upcomingEventsRef, { 
          events: [newEventData],
          lastUpdated: new Date().toISOString()
        });
      }

      // Remove from pending events
      const pendingEventsRef = doc(db, 'event_calendar', 'pending_events');
      const pendingDoc = await getDoc(pendingEventsRef);
      
      if (pendingDoc.exists()) {
        const pendingData = pendingDoc.data() as PendingEventData;
        const filteredEvents = pendingData.events.filter((e: EventType) => e.id !== eventId);
        await updateDoc(pendingEventsRef, { events: filteredEvents });
      }

      // Rest of the function remains the same...
    } catch (error) {
      console.error('Error publishing event:', error instanceof Error ? error.message : 'Unknown error');
      alert('Error publishing event. Please try again.');
    }
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (selectedFile) {
      const storage = getStorage(app);
      const storageRef = ref(storage, `flyers/${selectedFile.name}`);
      try {
        const uploadTask = await uploadBytes(storageRef, selectedFile);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        setFlyer(downloadURL);
        setSelectedFile(null);
        alert('Flyer uploaded successfully');
      } catch (error) {
        console.error('Error uploading flyer:', error);
        alert('Error uploading flyer');
      }
    }
  };

  if (!event) {
    return <div>No event data available. Please select an event to edit.</div>;
  }
  
  // Replace the problematic section with a proper conditional return
  if (showPayment) {
    return (
      <PaymentForm
        event={{
          ...event,
          address: `${street.trim()}, ${city.trim()}, ${state.trim()} ${zip.trim()}, ${country.trim()}`,
          flyer,
          ticket_enabled,
          ticket_system_option,
          ticket_price,
          ticket_link,
          registration_fee: 65
        }}
        onSuccess={() => {
          if (!validateFields()) {
            return;
          }
          handlePaymentSuccess();
        }}
        onCancel={() => setShowPayment(false)}
        validateFields={validateFields}
      />
    );
  }



  const handleDelete = async () => {
    if (!event || !window.confirm('Are you sure you want to delete this event?')) {
      return;
    }
  
    try {
      // Only allow deletion of pending or approved events
      if (event.status === 'confirmed') {
        alert('Confirmed events cannot be deleted.');
        return;
      }
  
      // Delete pending or approved events
      const response = await fetch(`/api/pmt/promoterEvents/${event.id}`, {
        method: 'DELETE',
      });
  
      if (!response.ok) {
        throw new Error(`Failed to delete ${event.status} event`);
      }
      
      alert('Event deleted successfully');
      onUpdateSuccess();
  
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete the event. Please try again.');
    }
  };


  const handleUpdate = async () => {
    if (!event) {
      console.error("No event to update");
      alert("No event selected for update.");
      return;
    }
  
    if (event.status === 'approved') {
      if (!validateFields()) {
        return;
      }
      setShowPayment(true);
      return;
    }
  
    // Handle non-approved event updates here...
    try {
      const db = getFirestore(app);
      const eventRef = doc(db, 'events', eventId);
      const fullAddress = `${street.trim()}, ${city.trim()}, ${state.trim()} ${zip.trim()}, ${country.trim()}`;
      
      const updatePayload = {
        address: fullAddress,
        flyer,
        ticket_enabled,
        ticket_system_option,
        ticket_price,
        ticket_link,
      };
  
      await updateDoc(eventRef, updatePayload);
      alert('Event updated successfully');
      onUpdateSuccess();
    } catch (error) {
      console.error('Error updating event:', error);
      alert(`Error updating event: ${error}`);
    }
  };


  return (
    <div className="p-4">
    <h2 className="text-xl font-bold mb-4">
      {event?.status === 'approved' ? 'Review & Publish Event' : 'Edit Event Details'}
    </h2>

    <div className="mb-6">
      {flyer && (
        <div className="mb-4 relative" style={{ width: '300px', height: '400px' }}>
          <Image
            src={flyer}
            alt="Event Flyer"
            fill
            style={{ objectFit: 'contain' }}
            priority
          />
        </div>
      )}
        <div className="flex gap-2 items-center">
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border p-2"
          />
          {selectedFile && (
            <button
              onClick={handleUpload}
              className="bg-blue-500 text-white px-4 py-2 rounded"
            >
              Upload Flyer
            </button>
          )}
        </div>
      </div>

      {/* Address Section */}
      <div className="border p-4 rounded mb-6">
        <h3 className="font-bold mb-2">Address</h3>
        <div className="grid gap-4">
          <select
            value={country}
            onChange={(e) => setCountry(e.target.value)}
            className="border p-2"
          >
            {countries.map((c) => (
              <option key={c.code} value={c.code}>
                {c.name}
              </option>
            ))}
          </select>

          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={country === 'MEX' ? "Calle y Número" : "Street"}
            className="border p-2"
          />

          {country === 'MEX' && (
            <>
              <input
                type="text"
                value={colonia}
                onChange={(e) => setColonia(e.target.value)}
                placeholder="Colonia"
                className="border p-2"
              />
              <input
                type="text"
                value={municipality}
                onChange={(e) => setMunicipality(e.target.value)}
                placeholder="Alcaldía/Municipio"
                className="border p-2"
              />
            </>
          )}

          <input
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="City"
            className="border p-2"
          />
          <input
            type="text"
            value={state}
            onChange={(e) => setState(e.target.value)}
            placeholder={getStateLabel()}
            className="border p-2"
          />
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder={getPostalLabel()}
            className="border p-2"
          />
        </div>
        {/* Display validation errors */}
        {Object.entries(errors).map(([field, error]) => (
          <p key={field} className="text-red-500 text-sm mt-1">
            {error}
          </p>
        ))}
      </div>

      {/* Ticket Section */}
      <div className="border p-4 rounded mb-6">
        <h3 className="font-bold mb-2">Ticket Options</h3>
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={ticket_enabled}
              onChange={(e) => setTicketEnabled(e.target.checked)}
              className="form-checkbox"
            />
            <label>Enable Ticket Sales</label>
          </div>

          {ticket_enabled && (
            <>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ticket_system_option"
                    checked={ticket_system_option === 'inHouse'}
                    onChange={() => setTicketSystemOption('inHouse')}
                  />
                  In House Tickets
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    name="ticket_system_option"
                    checked={ticket_system_option === 'thirdParty'}
                    onChange={() => setTicketSystemOption('thirdParty')}
                  />
                  Third Party Tickets
                </label>
              </div>

              {ticket_system_option === 'inHouse' && (
                <input
                  type="number"
                  value={ticket_price}
                  onChange={(e) => setTicketPrice(Number(e.target.value))}
                  placeholder="Ticket Price"
                  className="border p-2"
                />
              )}

              {ticket_system_option === 'thirdParty' && (
                <input
                  type="url"
                  value={ticket_link}
                  onChange={(e) => setTicketLink(e.target.value)}
                  placeholder="https://example.com/tickets"
                  className="border p-2 w-full"
                />
              )}
            </>
          )}
        </div>
      </div>


 

{/* Always show the buttons section with delete option */}
<div className="flex gap-4">
  <button
    onClick={handleUpdate}
    className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
  >
    {event.status === 'approved' ? 'Review & Pay' : 'Save Changes'}
  </button>
  <button
    onClick={onCancelUpdate}
    className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
  >
    Cancel
  </button>
  <button
    onClick={handleDelete}
    className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
  >
    Delete Event
  </button>
</div>






  </div>
);
};

export default PromoterEditEvent;