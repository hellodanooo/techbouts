// components/AddPromoter.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase_techbouts/config';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import SanctionPopup from './popups/One'
import { Promoter } from '../utils/types';
import LogoUpload from './LogoUpload';

interface AddEditPromoterProps {
  onClose: () => void;
  isAdmin?: boolean;
  add?: boolean;
  edit?: boolean;
  promoterData?: Promoter;
  user?: {
    email: string;
    // other user properties if needed
  };
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
  website: '',
  logo: '',
  instagram: '',
  facebook: '',
  createdAt: new Date().toISOString()
};


const SANCTIONING_OPTIONS = [
  { value: 'PMT', label: 'PMT' },
  { value: 'PBSC', label: 'PBSC' },
  { value: 'IKF', label: 'IKF' },


];

const AddEditPromoter: React.FC<AddEditPromoterProps> = ({ 
  onClose, 
  isAdmin = false, 
  edit = false,
  promoterData,
  user
}) => {

  const [formData, setFormData] = useState<Promoter>(
    // Initialize with promoterData if available, otherwise use initialFormData
    edit && promoterData ? {
      ...initialFormData,
      ...promoterData,
      // Ensure all required fields are present with fallbacks
      firstName: promoterData.firstName || '',
      lastName: promoterData.lastName || '',
      name: promoterData.name || promoterData.promotionName || '',
      city: promoterData.city || '',
      state: promoterData.state || '',
      phone: promoterData.phone || '',
      email: promoterData.email || '',
      promoterId: promoterData.promoterId || '',
      promotionName: promoterData.promotionName || '',
    } : initialFormData
  );
  
  const [loading, setLoading] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [selectedSanctioning, setSelectedSanctioning] = useState<string[]>(
    edit && promoterData?.sanctioning ? promoterData.sanctioning : []
  );
  const [sanctionPopupOpen, setSanctionPopupOpen] = useState(false);
  const [currentSanctioning, setCurrentSanctioning] = useState<string>('');
  const [logoUploadOpen, setLogoUploadOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string>(
    edit && promoterData?.logo ? promoterData.logo : ''
  );

  useEffect(() => {
    // When editing: user must be admin OR the owner of the promotion
    if (edit) {
      if (isAdmin || (user?.email && promoterData?.email && user.email === promoterData.email)) {
        setAuthenticated(true);
      }
    } 
    // When creating new: any logged-in user with an email can create a promotion
    else {
      if (isAdmin || user?.email) {
        setAuthenticated(true);
      }
    }
  }, [isAdmin, user, promoterData, edit]);

  useEffect(() => {
    // If adding a new promoter and user email is available, pre-fill the email field
    if (!edit && user?.email) {
      setFormData(prev => ({
        ...prev,
        email: user.email
      }));
    }
  }, [edit, user]);

  const handleLogoUploadSuccess = (downloadUrl: string) => {
    setLogoUrl(downloadUrl);
  };

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
      
      return data.promoters.some((p: Promoter) => 
        // In edit mode, we want to exclude the current promoter from the check
        p.promoterId !== promoterData?.promoterId && (
          p.promoterId === promoterId || 
          p.promotionName?.toLowerCase() === promotionName.toLowerCase()
        )
      );
    } catch (error) {
      console.error('Error checking promotion existence:', error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!authenticated) {
      alert('You are not authorized to perform this action.');
      return;
    }

    try {
      setLoading(true);

      // If editing, use the existing promoterId, otherwise generate a new one
      const promoterId = edit ? formData.promoterId : formData.promotionName.toLowerCase().replace(/\s+/g, '');
      
      // Check if promotion exists (only for new promoters)
      if (!edit) {
        const exists = await checkPromotionExists(formData.promotionName, promoterId);
        if (exists) {
          alert('This Promotion Name Already Exists');
          setLoading(false);
          return;
        }
      }

      const promoterData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        name: formData.promotionName,  // Keep the name field for compatibility
        city: formData.city,
        state: formData.state,
        phone: formData.phone,
        email: formData.email,
        promoterId: promoterId,
        promotionName: formData.promotionName,
        sanctioning: selectedSanctioning,
        logo: logoUrl,
        website: formData.website,
        instagram: formData.instagram,
        facebook: formData.facebook,
        // Only update createdAt if creating a new record
        ...(edit ? {} : { createdAt: new Date().toISOString() }),
        // Add updatedAt for tracking changes
        updatedAt: new Date().toISOString()
      };

      // Update the document in Firestore
      await setDoc(doc(db, 'promotions', promoterId), promoterData, { merge: true });

      // Update the JSON document that contains all promoters
      const jsonDocRef = doc(db, 'promotions', 'promotions_json');
      const jsonDocSnap = await getDoc(jsonDocRef);

      if (jsonDocSnap.exists()) {
        const jsonData = jsonDocSnap.data();
        let updatedPromoters = [];
        
        if (edit) {
          // Update existing promoter in the array
          updatedPromoters = jsonData.promoters.map((p: Promoter) => 
            p.promoterId === promoterId ? { ...p, ...promoterData } : p
          );
        } else {
          // Add new promoter to the array
          updatedPromoters = jsonData.promoters ? [...jsonData.promoters, promoterData] : [promoterData];
        }
        
        await updateDoc(jsonDocRef, { promoters: updatedPromoters });
      } else if (!edit) {
        // Only create a new JSON document if it doesn't exist and we're adding a new promoter
        await setDoc(jsonDocRef, { promoters: [promoterData] });
      }

      alert(`Promotion ${edit ? 'updated' : 'created'} successfully!`);
      onClose();
    } catch (error) {
      console.error(`Error ${edit ? 'updating' : 'creating'} promotion:`, error);
      alert(`Failed to ${edit ? 'update' : 'create'} promotion.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-lg max-h-screen overflow-y-auto relative">
        <h2 className="text-xl font-bold mb-4">{edit ? 'Edit' : 'Create'} Promotion</h2>
        <div className="space-y-4">
        
          
          <input
            type="text"
            placeholder="Promotion Name"
            className="w-full p-2 border rounded"
            value={formData.promotionName}
            onChange={(e) => handleInputChange('promotionName', e.target.value)}
            disabled={!authenticated || (edit && !isAdmin)} // Only admin can change promotion name in edit mode
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
                    disabled={!authenticated}
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            <div className="space-y-2">
              <label className="block text-sm font-semibold">Website</label>
              <input
                type="text"
                placeholder="Website"
                className="w-full p-2 border rounded"
                value={formData.website}
                onChange={(e) => handleInputChange('website', e.target.value)}
                disabled={!authenticated}
              />
              </div>
              <div className="space-y-2">
              <label className="block text-sm font-semibold">Instagram</label>
              <input
                type="text"
                placeholder="Instagram"
                className="w-full p-2 border rounded"
                value={formData.instagram}
                onChange={(e) => handleInputChange('instagram', e.target.value)}
                disabled={!authenticated}
              />
              </div>
              <div className="space-y-2">
              <label className="block text-sm font-semibold">Facebook</label>
              <input
                type="text"
                placeholder="Facebook"
                className="w-full p-2 border rounded"
                value={formData.facebook}
                onChange={(e) => handleInputChange('facebook', e.target.value)}
                disabled={!authenticated}
              />
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
                {logoUrl ? 'Change Logo' : 'Upload Logo'}
              </button>
              {logoUrl && (
                <div className="flex items-center gap-2">
                  <img src={logoUrl} alt="Logo Preview" className="w-10 h-10 rounded-full object-cover" />
                  <span className="text-sm text-green-600">Logo uploaded</span>
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
            {loading ? 'Saving...' : edit ? 'Update' : 'Save'}
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
          docId={formData.promoterId || formData.promotionName.toLowerCase().replace(/\s+/g, '')}
          isOpen={logoUploadOpen}
          onClose={() => setLogoUploadOpen(false)}
          onSuccess={handleLogoUploadSuccess}
          source="promotions"
        />
      )}
    </div>
  );
};

export default AddEditPromoter;