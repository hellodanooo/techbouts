import React, { useState, useEffect } from 'react';
import { EventType } from '@/utils/types';
import { parseISO, format } from 'date-fns';
import { storage } from '@/lib/firebase_pmt/config';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';


interface EditEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  event: EventType;
  onSave: (updatedEvent: EventType) => Promise<void>;
}

const modalOverlayStyle: React.CSSProperties = {
  position: 'fixed',
  top: 0,
  left: 0,
  right: 0,
  bottom: 0,
  backgroundColor: 'rgba(0, 0, 0, 0.5)',
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  zIndex: 1000
};

const modalContentStyle: React.CSSProperties = {
  backgroundColor: 'white',
  padding: '2rem',
  borderRadius: '0.5rem',
  maxWidth: '800px',
  width: '90%',
  maxHeight: '90vh',
  overflowY: 'auto',
  position: 'relative'
};

const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '0.5rem',
  border: '1px solid #ccc',
  borderRadius: '0.25rem',
  marginTop: '0.25rem'
};

const labelStyle: React.CSSProperties = {
  fontWeight: 500,
  display: 'block',
  marginBottom: '0.25rem'
};

const buttonStyle: React.CSSProperties = {
  padding: '0.5rem 1rem',
  borderRadius: '0.25rem',
  cursor: 'pointer',
  fontWeight: 500
};

const primaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: '#2563eb',
  color: 'white',
  border: 'none'
};

const secondaryButtonStyle: React.CSSProperties = {
  ...buttonStyle,
  backgroundColor: 'white',
  border: '1px solid #ccc',
  marginRight: '0.5rem'
};
const fileInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.25rem',
    border: '1px solid #ccc',
    borderRadius: '0.25rem',
    marginTop: '0.25rem'
  };
  
  const imagePreviewContainer: React.CSSProperties = {
    marginTop: '1rem',
    width: '100%',
    maxHeight: '200px',
    overflow: 'hidden',
    borderRadius: '0.5rem',
    border: '1px solid #ccc'
  };
  
  const previewImageStyle: React.CSSProperties = {
    width: '100%',
    height: '200px',
    objectFit: 'contain'
  };

export default function EditEventModal({ 
  isOpen, 
  onClose, 
  event,
  onSave 
}: EditEventModalProps) {
  const [formData, setFormData] = useState<EventType>(event);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);


  useEffect(() => {
    setFormData(event);
    setPreviewUrl(event.flyer || null);

  }, [event]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseFloat(value) : value
    }));
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (e.g., max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert('File size must be less than 5MB');
        return;
      }

      setSelectedFile(file);
      
      // Create preview URL
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadFlyer = async (file: File): Promise<string> => {
    const fileExtension = file.name.split('.').pop();
    const fileName = `event-flyers/${event.id || 'new'}-${Date.now()}.${fileExtension}`;
    const storageRef = ref(storage, fileName);

    try {
      setUploadProgress(0);
      const uploadResult = await uploadBytes(storageRef, file);
      setUploadProgress(100);
      const downloadUrl = await getDownloadURL(uploadResult.ref);
      return downloadUrl;
    } catch (error) {
      console.error('Error uploading file:', error);
      throw new Error('Failed to upload flyer');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      let updatedFormData = { ...formData };

      // If there's a new file selected, upload it first
      if (selectedFile) {
        const flyerUrl = await uploadFlyer(selectedFile);
        updatedFormData = {
          ...updatedFormData,
          flyer: flyerUrl
        };
      }

      await onSave(updatedFormData);
      onClose();
    } catch (error) {
      console.error('Error updating event:', error);
      alert('Failed to save event. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;



  return (
    <div style={modalOverlayStyle} onClick={onClose}>
      <div style={modalContentStyle} onClick={e => e.stopPropagation()}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 600, marginBottom: '1.5rem' }}>Edit Event</h2>
        
        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
            {/* Event Name */}
            <div>
              <label style={labelStyle} htmlFor="name">Event Name</label>
              <input
                style={inputStyle}
                id="name"
                name="name"
                value={formData.name || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Date */}
            <div>
              <label style={labelStyle} htmlFor="date">Event Date</label>
              <input
                style={inputStyle}
                id="date"
                name="date"
                type="date"
                value={formData.date ? format(parseISO(formData.date), 'yyyy-MM-dd') : ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Venue */}
            <div>
              <label style={labelStyle} htmlFor="venue_name">Venue Name</label>
              <input
                style={inputStyle}
                id="venue_name"
                name="venue_name"
                value={formData.venue_name || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* Address */}
            <div>
              <label style={labelStyle} htmlFor="address">Address</label>
              <input
                style={inputStyle}
                id="address"
                name="address"
                value={formData.address || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* City */}
            <div>
              <label style={labelStyle} htmlFor="city">City</label>
              <input
                style={inputStyle}
                id="city"
                name="city"
                value={formData.city || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* State */}
            <div>
              <label style={labelStyle} htmlFor="state">State</label>
              <input
                style={inputStyle}
                id="state"
                name="state"
                value={formData.state || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Registration Fee */}
            <div>
              <label style={labelStyle} htmlFor="registration_fee">Registration Fee ($)</label>
              <input
                style={inputStyle}
                id="registration_fee"
                name="registration_fee"
                type="number"
                value={formData.registration_fee || 0}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Competition Type */}
            <div>
              <label style={labelStyle} htmlFor="competition_type">Competition Type</label>
              <input
                style={inputStyle}
                id="competition_type"
                name="competition_type"
                value={formData.competition_type || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Weigh-in Start Time */}
            <div>
              <label style={labelStyle} htmlFor="weighin_start_time">Weigh-in Start Time</label>
              <input
                style={inputStyle}
                id="weighin_start_time"
                name="weighin_start_time"
                type="time"
                value={formData.weighin_start_time || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Weigh-in End Time */}
            <div>
              <label style={labelStyle} htmlFor="weighin_end_time">Weigh-in End Time</label>
              <input
                style={inputStyle}
                id="weighin_end_time"
                name="weighin_end_time"
                type="time"
                value={formData.weighin_end_time || ''}
                onChange={handleInputChange}
                required
              />
            </div>

            {/* Rules Meeting Time */}
            <div>
              <label style={labelStyle} htmlFor="rules_meeting_time">Rules Meeting Time</label>
              <input
                style={inputStyle}
                id="rules_meeting_time"
                name="rules_meeting_time"
                type="time"
                value={formData.rules_meeting_time || ''}
                onChange={handleInputChange}
              />
            </div>

            {/* Bouts Start Time */}
            <div>
              <label style={labelStyle} htmlFor="bouts_start_time">Start Time</label>
              <input
                style={inputStyle}
                id="bouts_start_time"
                name="bouts_start_time"
                type="time"
                value={formData.bouts_start_time || ''}
                onChange={handleInputChange}
              />
            </div>


            <div style={{ marginBottom: '1.5rem' }}>
            <label style={labelStyle} htmlFor="flyer">Event Flyer</label>
            <input
              style={fileInputStyle}
              id="flyer"
              name="flyer"
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
            />
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div style={{ marginTop: '0.5rem' }}>
                Uploading: {uploadProgress}%
              </div>
            )}
            {previewUrl && (
              <div style={imagePreviewContainer}>
                <img
                  src={previewUrl}
                  alt="Flyer preview"
                  style={previewImageStyle}
                />
              </div>
            )}
          </div>

            
          </div>

          <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={secondaryButtonStyle}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              style={{
                ...primaryButtonStyle,
                opacity: loading ? 0.7 : 1,
                cursor: loading ? 'not-allowed' : 'pointer'
              }}
              disabled={loading}
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}