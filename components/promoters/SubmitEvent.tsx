// components/promoters/submotEvent.tsx
import React, { useState } from 'react';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { app } from '../../utils/firebase';
import { PromoterType } from '../../utils/types';
import Image from 'next/image';

interface SubmitPendingEventProps {
  promoterId: PromoterType;
  onSuccess?: () => void;
  onCancel: () => void;
}



const SubmitEvent: React.FC<SubmitPendingEventProps> = ({ promoterId, onSuccess, onCancel }) => {
  const [event_name, setName] = useState('');
  const [date, setDate] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [country, setCountry] = useState('USA');
  const [event_details, setEventDetails] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [flyer, setFlyer] = useState('');
  const [promoterEmail, setPromoterEmail] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [colonia, setColonia] = useState(''); // New field for Mexican neighborhoods
  const [municipality, setMunicipality] = useState('');


  const countries = [
    { code: 'USA', name: 'United States' },
    { code: 'MEX', name: 'Mexico' },
    { code: 'CAN', name: 'Canada' },
    // Add more countries as needed
  ];

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


  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    if (!event_name.trim()) newErrors.event_name = 'Event name is required';
    if (!date) newErrors.date = 'Date is required';
    if (!city.trim()) newErrors.city = 'City is required';
    if (!state.trim()) newErrors[`${getStateLabel().toLowerCase()}`] = `${getStateLabel()} is required`;
    if (!promoterEmail.trim()) newErrors.promoterEmail = 'Email is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };


  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleUpload = async (): Promise<string> => {
    if (selectedFile) {
      const storage = getStorage(app);
      const storageRef = ref(storage, `pending_flyers/${selectedFile.name}`);
      try {
        const uploadTask = await uploadBytes(storageRef, selectedFile);
        const downloadURL = await getDownloadURL(uploadTask.ref);
        setFlyer(downloadURL);
        setSelectedFile(null);
        alert('Flyer uploaded successfully');
        return downloadURL;
      } catch (error) {
        console.error('Error uploading flyer:', error);
        alert('Error uploading flyer');
        return '';
      }
    }
    return flyer;
  };







  const handleSubmit = async () => {

    if (!validateForm()) {
      alert('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      const flyerUrl = await handleUpload();
      const fullAddress = formatAddress();
      
      const eventData = {
        event_name,
        date,
        address: fullAddress,
        street: street.trim(),
        colonia: colonia.trim(),
        municipality: municipality.trim(),
        city: city.trim(),
        state: state.trim(),
        country,
        postal_code: zip.trim(),
        flyer: flyerUrl,
        event_details,
        promoterEmail,
        promoterId,
        status: 'pending',
      };

      console.log('Sending event data:', eventData);



      // Save event through API
      const response = await fetch('/api/promoterEvents', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(eventData),
      });

      if (!response.ok) {
        throw new Error('Network response was not ok');
      }

      const result = await response.json();

      // Send email notification after successful event creation
      if (result.success) {
        const emailResponse = await fetch('/api/pendingEventEmail', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            emailType: 'submission',
            ...eventData,
            promoterEmail
          }),
        });

        if (!emailResponse.ok) {
          console.warn('Email notification failed, but event was saved');
        }

        alert(`Event submitted successful! ${result.message}`);
        onSuccess?.();
      } else {
        throw new Error(result.message || 'Submission failed');
      }
    } catch (error) {
      console.error('Error:', error);
      alert(error instanceof Error ? error.message : 'An error occurred while submitting the event');
    } finally {
      setIsSubmitting(false);
    }
  };


  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Submit Event for Approval</h2>
      <div style={{ marginBottom: '16px', color: 'gray', fontSize: '14px' }}>
        Event Name, date, City, & {getStateLabel()} Required for Initial Event Request
      </div>

      {/* Email field */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Email: <span style={styles.requiredStar}>*</span>
        </label>
        <input
          type="text"
          value={promoterEmail}
          onChange={(e) => setPromoterEmail(e.target.value)}
          style={{...styles.input, ...(errors.promoterEmail ? styles.inputError : {})}}
          required
        />
        {errors.promoterEmail && (
          <p style={styles.errorText}>{errors.promoterEmail}</p>
        )}
      </div>

      {/* Event Name field */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Event Name: <span style={styles.requiredStar}>*</span>
        </label>
        <input
          type="text"
          value={event_name}
          onChange={(e) => setName(e.target.value)}
          style={{...styles.input, ...(errors.event_name ? styles.inputError : {})}}
          required
        />
        {errors.event_name && (
          <p style={styles.errorText}>{errors.event_name}</p>
        )}
      </div>

      {/* Date field */}
      <div style={styles.formGroup}>
        <label style={styles.label}>
          Date: <span style={styles.requiredStar}>*</span>
        </label>
        <input
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          style={{...styles.input, ...(errors.date ? styles.inputError : {})}}
          required
        />
        {errors.date && (
          <p style={styles.errorText}>{errors.date}</p>
        )}
      </div>

      {/* Address fields */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Address Details</label>
        
        <select
          value={country}
          onChange={(e) => setCountry(e.target.value)}
          style={styles.select}
        >
          {countries.map((c) => (
            <option key={c.code} value={c.code}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          type="text"
          placeholder={country === 'MEX' ? "Calle y Número" : "Street"}
          value={street}
          onChange={(e) => setStreet(e.target.value)}
          style={{...styles.input, marginTop: '8px'}}
        />
        
        {country === 'MEX' && (
          <>
            <input
              type="text"
              placeholder="Colonia"
              value={colonia}
              onChange={(e) => setColonia(e.target.value)}
              style={{...styles.input, marginTop: '8px'}}
            />
            <input
              type="text"
              placeholder="Alcaldía/Municipio"
              value={municipality}
              onChange={(e) => setMunicipality(e.target.value)}
              style={{...styles.input, marginTop: '8px'}}
            />
          </>
        )}
        
        <input
          type="text"
          placeholder="City"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          style={{...styles.input, ...(errors.city ? styles.inputError : {}), marginTop: '8px'}}
          required
        />

        <div style={styles.stateProvinceGrid}>
          <input
            type="text"
            placeholder={getStateLabel()}
            value={state}
            onChange={(e) => setState(e.target.value)}
            style={{...styles.input, ...(errors.state ? styles.inputError : {})}}
            required
          />
          <input
            type="text"
            placeholder={getPostalLabel()}
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            style={styles.input}
          />
        </div>
      </div>

      {/* Event Details field */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Event Details: (optional)</label>
        <textarea
          value={event_details}
          onChange={(e) => setEventDetails(e.target.value)}
          style={styles.textarea}
        />
      </div>

      {/* Flyer Upload field */}
      <div style={styles.formGroup}>
        <label style={styles.label}>Upload Flyer: (optional)</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          style={styles.input}
        />
        {flyer && (
          <div style={{ position: 'relative', width: '300px', height: '400px', margin: '8px auto' }}>
            <Image 
              src={flyer}
              alt="Selected Flyer"
              fill
              style={{ objectFit: 'contain' }}
              priority
            />
          </div>
        )}
      </div>

      {/* Buttons */}
      <div style={styles.buttonContainer}>
        <button
          onClick={onCancel}
          style={styles.cancelButton}
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          onClick={handleSubmit}
          style={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Submitting...' : 'Submit Event'}
        </button>
      </div>
    </div>
  );
};


export default SubmitEvent;




const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column' as const,
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '24px',
    backgroundColor: 'white',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    color: 'black',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    fontSize: '14px',
    fontWeight: '500',
    marginBottom: '4px',
  },
  requiredStar: {
    color: '#ef4444',
  },
  input: {
    width: '100%',
    padding: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
  },
  inputError: {
    border: '1px solid #ef4444',
  },
  errorText: {
    color: '#ef4444',
    fontSize: '14px',
    marginTop: '4px',
  },
  addressGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '8px',
  },
  textarea: {
    width: '100%',
    padding: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    height: '128px',
  },
  buttonContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '8px 16px',
    color: '#4b5563',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
  },
  submitButton: {
    padding: '8px 16px',
    color: 'white',
    backgroundColor: 'green',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
  },
  select: {
    width: '100%',
    padding: '8px',
    border: '1px solid #e5e7eb',
    borderRadius: '4px',
    backgroundColor: 'white',
    marginBottom: '8px',
  },
  stateProvinceGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '8px',
    marginTop: '8px',
  },


};