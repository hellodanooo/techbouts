// components/AddPromoter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase_techbouts/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import SanctionPopup from '../components/popups/One'
import { Promoter } from '../utils/types';

interface AddPromoterProps {
  onClose: () => void;
  isAdmin?: boolean; // Add optional isAdmin prop
}


const initialFormData: Promoter = {
  firstName: '',
  lastName: '',
  name: '',
  city: '',
  state: '',
  phone: '',
  email: '',
  promoterId: '',
  promotionName: '',
  sanctioning: [],
  createdAt: new Date().toISOString() 

};

const AddPromoter: React.FC<AddPromoterProps> = ({ onClose, isAdmin = false }) => {
  const [formData, setFormData] = useState<Promoter>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail] = useState('');
  const [sanctioning, setSanctioning] = useState('');
  const [sanctionPopupOpen, setSanctionPopupOpen] = useState(false);
  const [promotionError, setPromotionError] = useState<string | null>(null);


  useEffect(() => {
    if (isAdmin) {
     

      // Set authenticated to true if user is admin
      setAuthenticated(true);
    

    }
  }, [isAdmin]);


  const handleInputChange = async (field: string, value: string) => {
    if (field === 'promotionName') {
      // Clear any existing error
      setPromotionError(null);
      
      try {
        // Generate promoterId from the promotion name
        const newPromoterId = value.toLowerCase().replace(/\s+/g, '_');
        
        // Fetch existing promoters from the API
        const response = await fetch('/api/promoters');
        if (!response.ok) {
          throw new Error('Failed to fetch promoters');
        }
        
        const data = await response.json();
        
        // Check if either the promoterId or promotionName already exists
        const existingPromoter = data.promoters.find((promoter: Promoter) => 
          promoter.promoterId === newPromoterId || 
          promoter.promotionName?.toLowerCase() === value.toLowerCase()
        );
  
        if (existingPromoter) {
          setPromotionError('This Promotion Name Already Exists');
        }
  
        // Update form data with both the promotion name and its generated ID
        setFormData(prev => ({
          ...prev,
          [field]: value,
          promoterId: newPromoterId
        }));
      } catch (error) {
        console.error('Error checking promotion name:', error);
        setPromotionError('Error checking promotion name availability');
      }
    } else {
      // For other fields, just update normally
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
  };



  const handleSubmit = async () => {
    if (!authenticated) {
      alert('Please authenticate with Google before submitting the form.');
      return;
    }

    try {
      setLoading(true);

      const promoterId = `${formData.promoterId.toLowerCase().replace(/\s+/g, '_')}`;

      const promoterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: formData.promotionName,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        promoterId: promoterId,
        promotion: formData.promotionName,
        sanctioning: sanctioning,
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'promotions', promoterId), promoterData);

      // Add promoter details to JSON file in Firestore
      const jsonDocRef = doc(db, 'promotions', 'promotions_json');
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg max-h-screen overflow-y-auto relative">
        
        <h2 className="text-xl font-bold mb-4">Create Promotion</h2>
        <div className="space-y-4">

     

          {authenticated && <p className="text-green-500">Signed in as: {userEmail}</p>}
          
          {isAdmin && <p className="text-green-500">Admin {userEmail}</p>}
          
          <input
            type="text"
            placeholder="Promotion Name"
            className="w-full p-2 border rounded"
            value={formData.promotionName}
            onChange={(e) => handleInputChange('promotionName', e.target.value)}
            disabled={!authenticated}
          />
  {promotionError && (
          <p className="text-red-500 text-sm mt-1">{promotionError}</p>
        )}

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
            onChange={(e) => handleInputChange('email', e.target.value)}

            
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
            loading || !authenticated || promotionError ? 'opacity-50 cursor-not-allowed' : ''
          }`}
          disabled={loading || !authenticated || promotionError !== null}
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
