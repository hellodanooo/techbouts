import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, getFirestore } from 'firebase/firestore';
import { app } from '../../utils/firebase';
import LogoUpload from '../../app/gyms/[gymId]/LogoUpload';
import { GymProfile } from '../../utils/types';
import axios from 'axios';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import Image from 'next/image';

interface GymData {
  id: string;
  gym: string;
  address?: string;
  website?: string;
  city?: string;
  state?: string;
  [key: string]: string | undefined; // More specific type
}

interface FirestoreData {
  gyms: Record<string, GymData>;
}

const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#9c9c9c"
      },
      padding: '10px 12px',
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a"
    }
  },
  hidePostalCode: true
};


interface EditGymDetailsProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  gymId: string;
  initialData?: Partial<GymProfile>;
}

const EditGymDetails: React.FC<EditGymDetailsProps> = ({
  isOpen,
  onClose,
  onSuccess,
  gymId,
  initialData
}) => {
  const [address, setAddress] = useState(initialData?.address || '');
  const [website, setWebsite] = useState(initialData?.website || '');
  const [city, setCity] = useState(initialData?.city || '');
  const [state, setState] = useState(initialData?.state || '');
  const [isLogoUploadOpen, setIsLogoUploadOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showDonationForm, setShowDonationForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState(20);
  
  const stripe = useStripe();
  const elements = useElements();


  useEffect(() => {
    if (initialData) {
      setAddress(initialData.address || '');
      setWebsite(initialData.website || '');
      setCity(initialData.city || '');
      setState(initialData.state || '');
    }
  }, [initialData]);

  const handleLogoUploadSuccess = () => {
    setSuccess('Logo uploaded successfully!');
    setTimeout(() => setSuccess(null), 3000);
  };

  const handleSave = () => {
    setShowDonationForm(true);
  };

  const handleDonationSubmit = async () => {
    if (!stripe || !elements) {
      setError('Payment system not initialized');
      return;
    }
  
    setLoading(true);
    setError(null);
  
    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }
  
      // Create token first
      const { error: tokenError, token } = await stripe.createToken(cardElement);
      
      if (tokenError) {
        throw new Error(tokenError.message);
      }
  
      if (!token) {
        throw new Error('Failed to create payment token');
      }
  
      // Process the payment
      const paymentResponse = await axios.post('/api/stripe_nakmuay', {
        token: token.id,
        amount: donationAmount * 100,
        currency: 'USD',
        idempotencyKey: `donation-${gymId}-${Date.now()}`,
        gymId: gymId,
        gymName: initialData?.gym
      });
  
      if (paymentResponse.data.success) {
        await updateGymDetails();
        setSuccess('Thank you for your donation! Gym details updated successfully.');
        onSuccess();
        onClose();
      } else {
        throw new Error(paymentResponse.data.message || 'Payment failed');
      }
    } catch (err: unknown) {
      console.error('Payment error:', err);
      setError(
        err instanceof Error 
          ? err.message 
          : 'An error occurred during payment processing'
      );
    } finally {
      setLoading(false);
    }
  };


  const updateGymDetails = async () => {
    const db = getFirestore(app);
    const states = ['CA', 'TX', 'CO', 'WY'];
    const collections = states.map((stateName) => ({
      collectionName: `gym_profiles_${stateName}_json_data`,
      winGroups: ['0_win', '1_5_win', '6_10_win', '11_20_win', '21_more_win']
    }));
  
    for (const { collectionName, winGroups } of collections) {
      for (const winGroup of winGroups) {
        const docRef = doc(db, collectionName, winGroup);
        const docSnap = await getDoc(docRef);
  
        if (docSnap.exists()) {
          const data = docSnap.data() as FirestoreData;
          
          const gymEntry = Object.entries(data.gyms).find(([, gym]) => 
            gym.id === gymId || gym.gym.replace(/ /g, '_') === gymId
          );
  
          if (gymEntry) {
            const [gymKey, gymData] = gymEntry;
            const updatedGym: GymData = {
              ...gymData,
              address: address || gymData.address || 'none',
              website: website || gymData.website || 'none',
              city: city || gymData.city || 'none',
              state: state || gymData.state || 'none',
            };
          
            await setDoc(docRef, {
              gyms: {
                ...data.gyms,
                [gymKey]: updatedGym  // Use gymKey here
              }
            }, { merge: true });
            return;
          }
        }
      }
    }
  };


  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        {!showDonationForm ? (
          <>
            <div className="modal-header">
              <h2>Edit Gym Details</h2>
              <button onClick={onClose} className="close-button">×</button>
            </div>

            <div className="form-container">
              <div className="form-group">
                <label>Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Enter gym address"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>Website</label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="Enter gym website"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>City</label>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="Enter city"
                  className="input-field"
                />
              </div>

              <div className="form-group">
                <label>State</label>
                <input
                  type="text"
                  value={state}
                  onChange={(e) => setState(e.target.value)}
                  placeholder="Enter state (e.g., CA)"
                  className="input-field"
                  maxLength={2}
                />
              </div>

              <div className="button-container">
                <button
                  onClick={() => setIsLogoUploadOpen(true)}
                  className="upload-button"
                >
                  Upload Logo
                </button>
                <button
                  onClick={handleSave}
                  className="save-button"
                  disabled={loading}
                >
                  {loading ? 'Processing...' : 'Update Gym Details'}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="form-container">
            <h2>Donation to Nakmuay Foundation</h2>
            <p className="donation-description">Please make a donation to support our foundation (minimum $20)</p>
            
            <div 
  style={{
    display:'block',
    textAlign: 'center',
    margin: 'auto'
  }}
>
  <a 
    href="https://www.nakmuay.foundation" 
    target="_blank" 
    rel="noopener noreferrer"
  >
    <Image 
      src="https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/nakmuay%2Flogos%2FNMF-Logo.png?alt=media&token=4dc3fa29-56c2-4861-8346-0411983417a7"
      alt="logo" 
      width={100} 
      height={75}
    />
  </a>
</div>


            <div className="form-group">
              <label>Donation Amount ($)</label>
              <input
                type="number"
                min="20"
                value={donationAmount}
                onChange={(e) => setDonationAmount(Math.max(20, parseInt(e.target.value)))}
                className="input-field"
              />
            </div>

            <div className="card-element-container">
              <CardElement options={CARD_ELEMENT_OPTIONS} />
            </div>

            <div className="button-container">
              <button
                onClick={() => setShowDonationForm(false)}
                className="upload-button"
              >
                Back
              </button>
              <button
                onClick={handleDonationSubmit}
                className="save-button"
                disabled={loading}
              >
                {loading ? 'Processing...' : `Donate $${donationAmount} & Save Changes`}
              </button>
            </div>
          </div>
        )}

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        {success && (
          <div className="success-message">
            {success}
          </div>
        )}

        {isLogoUploadOpen && (
          <LogoUpload
            gymId={gymId}
            isOpen={isLogoUploadOpen}
            onClose={() => setIsLogoUploadOpen(false)}
            onSuccess={handleLogoUploadSuccess}
          />
        )}


<div
style={{
  display: 'flex',
  justifyContent: 'center',
  marginTop: '1rem'
}}
>
<Image 
              src="/logos/techboutslogoFlat.png"
              alt="Techbouts Logo"
              width={80}
              height={20}
            />
</div>

      </div>

      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 1rem;
          z-index: 50;
        }

        .modal-content {
          background-color: white;
          border-radius: 0.5rem;
          padding: 1.5rem;
          width: 100%;
          max-width: 500px;
          box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }

        .modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1rem;
        }

        .close-button {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
        }

        .form-container {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }

        .input-field {
          padding: 0.5rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          font-size: 1rem;
        }

        .button-container {
          display: flex;
          gap: 1rem;
          margin-top: 1rem;
        }

        .upload-button, .save-button {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 0.25rem;
          cursor: pointer;
          font-weight: 500;
          flex: 1;
        }

        .upload-button {
          background-color: #f0f0f0;
          color: #333;
        }

        .save-button {
          background-color: #007bff;
          color: white;
        }

        .save-button:disabled {
          background-color: #ccc;
          cursor: not-allowed;
        }

        .error-message {
          color: #dc3545;
          padding: 0.5rem;
          border-radius: 0.25rem;
          background-color: #ffc0cb;
          margin-top: 1rem;
        }

        .success-message {
          color: #28a745;
          padding: 0.5rem;
          border-radius: 0.25rem;
          background-color: #d4edda;
          margin-top: 1rem;
        }

        .donation-description {
          color: #666;
          margin-bottom: 1rem;
        }

        .card-element-container {
          padding: 1rem;
          border: 1px solid #ddd;
          border-radius: 0.25rem;
          background-color: #fff;
        }
      `}</style>
    </div>
  );
};

export default EditGymDetails;