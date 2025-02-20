// components/AddPromoter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase_techbouts/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import SanctionPopup from '../components/popups/One'
import { Promoter } from '../utils/types';
import LogoUpload from './LogoUpload';

interface AddPromoterProps {
  onClose: () => void;
  isAdmin?: boolean;
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


const SANCTIONING_OPTIONS = [
  { value: 'PMT', label: 'PMT' },
  { value: 'PBSC', label: 'PBSC' },
  { value: 'IKF', label: 'IKF' },


];

const AddPromoter: React.FC<AddPromoterProps> = ({ onClose, isAdmin = false }) => {
  const [formData, setFormData] = useState<Promoter>(initialFormData);
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [userEmail] = useState('');
  const [selectedSanctioning, setSelectedSanctioning] = useState<string[]>([]);
  const [sanctionPopupOpen, setSanctionPopupOpen] = useState(false);
  const [currentSanctioning, setCurrentSanctioning] = useState<string>('');
  const [logoUploadOpen, setLogoUploadOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>('');

  const handleLogoUploadSuccess = (downloadUrl: string) => {
    setLogoUrl(downloadUrl);
  };

  useEffect(() => {
    if (isAdmin) {
      setAuthenticated(true);
    }
  }, [isAdmin]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSanctioningSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    if (value && !selectedSanctioning.includes(value)) {
      setSelectedSanctioning(prev => [...prev, value]);
      setCurrentSanctioning(value);
      setSanctionPopupOpen(true);
    }
  };

  const handleRemoveSanctioning = (sanctioningToRemove: string) => {
    setSelectedSanctioning(prev => prev.filter(s => s !== sanctioningToRemove));
  };


  const checkPromotionExists = async (promotionName: string, promoterId: string): Promise<boolean> => {
    try {
      const response = await fetch('/api/promoters');
      if (!response.ok) {
        throw new Error('Failed to fetch promoters');
      }
      
      const data = await response.json();
      
      return data.promoters.some((promoter: Promoter) => 
        promoter.promoterId === promoterId || 
        promoter.promotionName?.toLowerCase() === promotionName.toLowerCase()
      );
    } catch (error) {
      console.error('Error checking promotion existence:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!authenticated) {
      alert('Please authenticate with Google before submitting the form.');
      return;
    }

    try {
      setLoading(true);

      const promoterId = formData.promotionName.toLowerCase().replace(/\s+/g, '');
      
      const exists = await checkPromotionExists(formData.promotionName, promoterId);
      if (exists) {
        alert('This Promotion Name Already Exists');
        setLoading(false);
        return;
      }

      const promoterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: formData.promotionName,
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        promoterId: promoterId,
        promotionName: formData.promotionName,
        sanctioning: selectedSanctioning,
        logo: logoUrl, // Add the logo URL to the data
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'promotions', promoterId), promoterData);

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
            disabled={!authenticated}
          />


<div className="space-y-2">
            <select
              className="w-full p-2 border rounded"
              onChange={handleSanctioningSelect}
              value=""
              disabled={!authenticated}
            >
              <option value="">Add Sanctioning</option>
              {SANCTIONING_OPTIONS.map(option => (
                <option 
                  key={option.value} 
                  value={option.value}
                  disabled={selectedSanctioning.includes(option.value)}
                >
                  {option.label}
                </option>
              ))}
            </select>

            {/* Selected Sanctioning Tags */}
            <div className="flex flex-wrap gap-2">
              {selectedSanctioning.map(sanction => (
                <div 
                  key={sanction}
                  className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full flex items-center gap-2"
                >
                  <span>{sanction}</span>
                  <button
                    onClick={() => handleRemoveSanctioning(sanction)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setLogoUploadOpen(true)}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={!authenticated}
              >
                Upload Logo
              </button>
              {logoUrl && (
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt="Logo Preview" className="w-10 h-10 rounded-full object-cover" />
                  <span className="text-sm text-green-600">Logo uploaded successfully</span>
                </div>
              )}
            </div>
          </div>


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
              loading || !authenticated ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-600'
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
       selectedSanctioning={currentSanctioning}
       onClose={() => setSanctionPopupOpen(false)}
     />
      )}

{logoUploadOpen && (
        <LogoUpload
          docId={formData.promotionName.toLowerCase().replace(/\s+/g, '')}
          isOpen={logoUploadOpen}
          onClose={() => setLogoUploadOpen(false)}
          onSuccess={handleLogoUploadSuccess}
          source="promotions"
        />
      )}

    </div>
  );
};

export default AddPromoter;