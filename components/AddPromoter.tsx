'use client';

import React, { useState } from 'react';
import { db } from '../utils/firebase';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { getAuth, signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import SanctionPopup from '../components/popups/One'


interface AddPromoterProps {
  onClose: () => void;
  promoters: { id: string; name: string; email: string; promotion: string }[];
}

const AddPromoter: React.FC<AddPromoterProps> = ({ onClose, promoters }) => {
  const [formData, setFormData] = useState({
    promotion: '',
    firstName: '',
    lastName: '',
    city: '',
    state: '',
    phone: '',
    email: '',
    santioning: '',
  });
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [sanctioning, setSanctioning] = useState('');
  const [sanctionPopupOpen, setSanctionPopupOpen] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGoogleSignIn = async () => {
    const auth = getAuth();
    const provider = new GoogleAuthProvider();
  
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      if (user && user.email) {
        // Check if a promoter with this email already exists
        const existingPromoter = promoters.find(promoter => promoter.email === user.email);
        
        if (existingPromoter) {
          alert(`A promoter already exists for this email (${user.email})`);
          return;
        }
  
        setUserEmail(user.email);
        setAuthenticated(true);
        setFormData((prev) => ({
          ...prev,
          email: user.email ?? ''
        }));
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      alert('Failed to authenticate with Google.');
    }
  };

  const handleSubmit = async () => {
    if (!authenticated) {
      alert('Please authenticate with Google before submitting the form.');
      return;
    }

    try {
      setLoading(true);

      const promoterId = `${formData.promotion.replace(/\s+/g, '_')}_${formData.city.replace(/\s+/g, '_')}`;

      const promoterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: `${formData.firstName} ${formData.lastName}`,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        promoterId: promoterId,
        promotion: formData.promotion,
        sanctioning: sanctioning,
      };

      await setDoc(doc(db, 'techbouts_promotions', promoterId), promoterData);

      // Add promoter details to JSON file in Firestore
      const jsonDocRef = doc(db, 'techbouts_promotions', 'promotions_json');
      const jsonDocSnap = await getDoc(jsonDocRef);

      if (jsonDocSnap.exists()) {
        const jsonData = jsonDocSnap.data();
        const updatedPromoters = jsonData.promoters ? [...jsonData.promoters, promoterData] : [promoterData];
        await updateDoc(jsonDocRef, { promoters: updatedPromoters });
      } else {
        await setDoc(jsonDocRef, { promoters: [promoterData] });
      }

      alert('Promotion created successfully!');
      onClose();
    } catch (error) {
      console.error('Error creating promotion:', error);
      alert('Failed to create promotion.');
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
        <h2 className="text-xl font-bold mb-4">Create Promotion</h2>
        <div className="space-y-4">
          {!authenticated && (
            <button
              onClick={handleGoogleSignIn}
              className="w-full p-2 border rounded bg-blue-500 text-white hover:bg-blue-600"
            >
              Sign in with Google
            </button>
          )}

          {authenticated && <p className="text-green-500">Signed in as: {userEmail}</p>}

          <input
            type="text"
            placeholder="Promotion Name"
            className="w-full p-2 border rounded"
            value={formData.promotion}
            onChange={(e) => handleInputChange('promotion', e.target.value)}
            disabled={!authenticated}
          />


 {/* Sanctioning Selection */}
 <select
                value={sanctioning}
                onChange={handleSanctioningChange}
                className="w-full p-2 border rounded"
                disabled={!authenticated}

              >
                <option value="">Select Sanctioning</option>
                <option value="IKF">International Kickboxing Federation (IKF)</option>
                <option value="PMT">Point Muay Thai (PMT)</option>
                <option value="PBSC">Point Boxing Sparring Circuit (PBSC)</option>
                <option value="none">None</option>
              </select>

          <input
            type="text"
            placeholder="First Name"
            className="w-full p-2 border rounded"
            value={formData.firstName}
            onChange={(e) => handleInputChange('firstName', e.target.value)}
            disabled={!authenticated}
          />
          <input
            type="text"
            placeholder="Last Name"
            className="w-full p-2 border rounded"
            value={formData.lastName}
            onChange={(e) => handleInputChange('lastName', e.target.value)}
            disabled={!authenticated}
          />
          <input
            type="text"
            placeholder="City"
            className="w-full p-2 border rounded"
            value={formData.city}
            onChange={(e) => handleInputChange('city', e.target.value)}
            disabled={!authenticated}
          />
          <input
            type="text"
            placeholder="State"
            className="w-full p-2 border rounded"
            value={formData.state}
            onChange={(e) => handleInputChange('state', e.target.value)}
            disabled={!authenticated}
          />
          <input
            type="text"
            placeholder="Phone"
            className="w-full p-2 border rounded"
            value={formData.phone}
            onChange={(e) => handleInputChange('phone', e.target.value)}
            disabled={!authenticated}
          />
          <input
            type="email"
            placeholder="Email"
            className="w-full p-2 border rounded"
            value={formData.email}
            disabled
          />
        </div>
        <div className="mt-6 flex justify-end space-x-4">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className={`px-4 py-2 bg-green-500 text-white rounded ${
              loading || !authenticated ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            disabled={loading || !authenticated}
          >
            {loading ? 'Saving...' : 'Save'}
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

export default AddPromoter;
