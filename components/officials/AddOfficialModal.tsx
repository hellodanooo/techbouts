// components/officials/AddOfficialModal.tsx
'use client';
import React, { useState } from 'react';
import { Official } from '@/utils/types';
import PhotoUpload from './PhotoUpload';

interface AddOfficialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (newOfficial: Official) => void;
}

export default function AddOfficialModal({ isOpen, onClose, onSave }: AddOfficialModalProps) {
  const [tempId, setTempId] = useState<string>(`temp_${Date.now()}`);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);

  const [newOfficial, setNewOfficial] = useState<Partial<Official>>({
    first: '',
    last: '',
    city: '',
    state: '',
    position: 'Pending',
    phone: '',
    email: '',
    facebookUrl: '',
    judgedBefore: false,
    location: '',
    mat: 0,
    muayThaiExperience: '',
    official_id: '',
    payment: '',
    paymentId: '',
    paymentType: '',
    photo: '',
  });

  // Add the missing function to handle photo upload success
  const handlePhotoUploadSuccess = (downloadUrl: string) => {
    setNewOfficial(prev => ({
      ...prev,
      photo: downloadUrl
    }));
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setNewOfficial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Generate a unique ID
    const id = `${newOfficial.first}${newOfficial.last}${Date.now()}`;
    const officialId = id;
    
    // Create complete official object
    const completeOfficial: Official = {
      ...newOfficial as Official,
      id,
      officialId
    };
    
    onSave(completeOfficial);
    
    // Reset form
    setNewOfficial({
      first: '',
      last: '',
      city: '',
      state: '',
      position: 'Pending',
      phone: '',
      email: '',
      facebookUrl: '',
      judgedBefore: false,
      location: '',
      mat: 0,
      muayThaiExperience: '',
      official_id: '',
      payment: '',
      paymentId: '',
      paymentType: '',
      photo: '',
    });
    
    // Generate new temp ID for next official
    setTempId(`temp_${Date.now()}`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Add New Official</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            &times;
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                First Name *
              </label>
              <input
                type="text"
                name="first"
                value={newOfficial.first}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Last Name *
              </label>
              <input
                type="text"
                name="last"
                value={newOfficial.last}
                onChange={handleChange}
                required
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                City
              </label>
              <input
                type="text"
                name="city"
                value={newOfficial.city}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                State
              </label>
              <input
                type="text"
                name="state"
                value={newOfficial.state}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Position
              </label>
              <select
                name="position"
                value={newOfficial.position}
                onChange={(e) => setNewOfficial(prev => ({...prev, position: e.target.value}))}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              >
                <option value="Pending">Pending</option>
                <option value="Judge">Judge</option>
                <option value="Referee">Referee</option>
                <option value="Timekeeper">Timekeeper</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone
              </label>
              <input
                type="tel"
                name="phone"
                value={newOfficial.phone}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={newOfficial.email}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Facebook/Instagram URL
              </label>
              <input
                type="text"
                name="facebookUrl"
                value={newOfficial.facebookUrl}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Have you judged before?
              </label>
              <div className="mt-2">
                <label className="inline-flex items-center mr-4">
                  <input
                    type="radio"
                    name="judgedBefore"
                    checked={newOfficial.judgedBefore === true}
                    onChange={() => setNewOfficial(prev => ({...prev, judgedBefore: true}))}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">Yes</span>
                </label>
                <label className="inline-flex items-center">
                  <input
                    type="radio"
                    name="judgedBefore"
                    checked={newOfficial.judgedBefore === false}
                    onChange={() => setNewOfficial(prev => ({...prev, judgedBefore: false}))}
                    className="form-radio h-4 w-4 text-blue-600"
                  />
                  <span className="ml-2">No</span>
                </label>
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Muay Thai Experience
              </label>
              <textarea
                name="muayThaiExperience"
                value={newOfficial.muayThaiExperience}
                onChange={(e) => setNewOfficial(prev => ({...prev, muayThaiExperience: e.target.value}))}
                rows={3}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Paypal email
              </label>
              <input
                type="text"
                name="paymentId"
                value={newOfficial.paymentId}
                onChange={handleChange}
                className="mt-1 block w-full p-2 border border-gray-300 rounded-md shadow-sm"
                placeholder="PayPal Email"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Photo URL
              </label>
              <div className="flex mt-1">
               
                <button
                  type="button"
                  onClick={() => setIsPhotoModalOpen(true)}
                  className="ml-2 px-3 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
                >
                  Upload
                </button>
              </div>
              {newOfficial.photo && (
                <div className="mt-2">
                  <img 
                    src={newOfficial.photo} 
                    alt="Official preview" 
                    className="h-16 w-16 object-cover rounded-md"
                  />
                </div>
              )}
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              Add Official
            </button>
          </div>
        </form>
      </div>
      
      {/* Photo Upload Modal */}
      <PhotoUpload
        officialId={tempId}
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSuccess={handlePhotoUploadSuccess}
      />
    </div>
  );
}