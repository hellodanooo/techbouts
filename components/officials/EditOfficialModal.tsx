// components/officials/EditOfficialModal.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Official } from '@/utils/types';
import PhotoUpload from './PhotoUpload';
import { deleteOfficial } from '@/utils/officials/fetchOfficials';

interface EditOfficialModalProps {
  official: Official;
  allOfficials: Official[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedOfficial: Official) => void;
  onDelete: (officials: Official[]) => void;
}

export default function EditOfficialModal({ 
  official, 
  allOfficials,
  isOpen, 
  onClose, 
  onSave,
  onDelete
}: EditOfficialModalProps) {
  const [editedOfficial, setEditedOfficial] = useState<Official>(official);
  const [isPhotoModalOpen, setIsPhotoModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmation, setDeleteConfirmation] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Update editedOfficial when the official prop changes
  useEffect(() => {
    setEditedOfficial(official);
  }, [official]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEditedOfficial(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setEditedOfficial(prev => ({
      ...prev,
      [name]: parseInt(value) || 0
    }));
  };

  const handlePhotoUploadSuccess = (downloadUrl: string) => {
    setEditedOfficial(prev => ({
      ...prev,
      photo: downloadUrl
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    
    try {
      onSave(editedOfficial);
    } catch (error) {
      console.error('Error saving official:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteClick = () => {
    setIsDeleting(true);
  };

  const handleCancelDelete = () => {
    setIsDeleting(false);
    setDeleteConfirmation('');
    setDeleteError('');
  };

  const handleConfirmDelete = async () => {
    if (deleteConfirmation !== `${editedOfficial.first} ${editedOfficial.last}`) {
      setDeleteError('Name does not match. Please try again.');
      return;
    }

    try {
      const updatedOfficials = await deleteOfficial(editedOfficial.id, allOfficials);
      onDelete(updatedOfficials);
      onClose();
    } catch (error) {
      console.error('Error deleting official:', error);
      setDeleteError('Failed to delete official. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-90vh overflow-y-auto">
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-white pb-2">
          <h2 className="text-xl font-bold">Edit Official</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            &times;
          </button>
        </div>

        {isDeleting ? (
          <div className="space-y-4">
            <div className="p-4 bg-red-50 border border-red-200 rounded">
              <h3 className="text-lg font-semibold text-red-700">Delete Official</h3>
              <p className="mt-2 text-red-600">
                This action cannot be undone. This will permanently delete the official
                and all associated data.
              </p>
              <p className="mt-2 font-medium">
                Please type <span className="font-bold">{editedOfficial.first} {editedOfficial.last}</span> to confirm:
              </p>
              <input 
                type="text" 
                value={deleteConfirmation}
                onChange={(e) => setDeleteConfirmation(e.target.value)}
                className="mt-2 w-full p-2 border border-red-300 rounded focus:ring-red-500 focus:border-red-500"
                placeholder="Type full name to confirm"
              />
              {deleteError && (
                <p className="mt-2 text-red-600">{deleteError}</p>
              )}
              <div className="mt-4 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={handleCancelDelete}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                  disabled={deleteConfirmation !== `${editedOfficial.first} ${editedOfficial.last}`}
                >
                  Delete Official
                </button>
              </div>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-h-96 overflow-y-auto p-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  First Name *
                </label>
                <input
                  type="text"
                  name="first"
                  value={editedOfficial.first}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Last Name *
                </label>
                <input
                  type="text"
                  name="last"
                  value={editedOfficial.last}
                  onChange={handleChange}
                  required
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  City
                </label>
                <input
                  type="text"
                  name="city"
                  value={editedOfficial.city || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  State
                </label>
                <input
                  type="text"
                  name="state"
                  value={editedOfficial.state || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Position
                </label>
                <select
                  name="position"
                  value={editedOfficial.position || 'Pending'}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
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
                  value={editedOfficial.phone || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Email
                </label>
                <input
                  type="email"
                  name="email"
                  value={editedOfficial.email || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Facebook/Instagram URL
                </label>
                <input
                  type="text"
                  name="facebookUrl"
                  value={editedOfficial.facebookUrl || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Have you judged before?
                </label>
                <div className="mt-2">
                  <label className="inline-flex items-center mr-4">
                    <input
                      type="radio"
                      name="judgedBefore"
                      checked={editedOfficial.judgedBefore === true}
                      onChange={() => setEditedOfficial(prev => ({...prev, judgedBefore: true}))}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="judgedBefore"
                      checked={editedOfficial.judgedBefore === false}
                      onChange={() => setEditedOfficial(prev => ({...prev, judgedBefore: false}))}
                      className="form-radio h-4 w-4 text-blue-600"
                    />
                    <span className="ml-2">No</span>
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  value={editedOfficial.location || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Mat Number
                </label>
                <input
                  type="number"
                  name="mat"
                  value={editedOfficial.mat || 0}
                  onChange={handleNumberChange}
                  min="0"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Muay Thai Experience
                </label>
                <textarea
                  name="muayThaiExperience"
                  value={editedOfficial.muayThaiExperience || ''}
                  onChange={handleChange}
                  rows={3}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Payment Note
                </label>
                <input
                  type="text"
                  name="payment"
                  value={editedOfficial.payment || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>

            

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Paypal ID/Email
                </label>
                <input
                  type="text"
                  name="paymentId"
                  value={editedOfficial.paymentId || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                  placeholder="PayPal Email, Venmo username, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Official ID
                </label>
                <input
                  type="text"
                  name="official_id"
                  value={editedOfficial.official_id || ''}
                  onChange={handleChange}
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>
              
              {/* Photo upload */}
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">
                  Photo
                </label>
                <div className="mt-1 flex items-center space-x-3">
                  <div className="flex-grow">
                    <input
                      type="text"
                      name="photo"
                      value={editedOfficial.photo || ''}
                      onChange={handleChange}
                      className="block w-full p-2 border border-gray-300 rounded shadow-sm"
                      placeholder="Photo URL"
                      readOnly
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsPhotoModalOpen(true)}
                    className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                  >
                    {editedOfficial.photo ? 'Change Photo' : 'Upload Photo'}
                  </button>
                  {editedOfficial.photo && (
                    <div className="h-14 w-14 flex-shrink-0">
                      <img 
                        src={editedOfficial.photo} 
                        alt={`${editedOfficial.first} ${editedOfficial.last}`} 
                        className="h-full w-full object-cover rounded-md"
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Optional: Statistics fields */}
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bouts Judged
                </label>
                <input
                  type="number"
                  name="bouts_judged"
                  value={editedOfficial.bouts_judged || 0}
                  onChange={handleNumberChange}
                  min="0"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Bouts Refereed
                </label>
                <input
                  type="number"
                  name="bouts_reffed"
                  value={editedOfficial.bouts_reffed || 0}
                  onChange={handleNumberChange}
                  min="0"
                  className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                />
              </div>
              
              {/* Quiz score if available */}
              {editedOfficial.quizScore !== undefined && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Quiz Score (%)
                  </label>
                  <input
                    type="number"
                    name="quizScore"
                    value={editedOfficial.quizScore || 0}
                    onChange={handleNumberChange}
                    min="0"
                    max="100"
                    className="mt-1 block w-full p-2 border border-gray-300 rounded shadow-sm"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 border-t mt-6">
              <button
                type="button"
                onClick={handleDeleteClick}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Delete Official
              </button>
              
              <div className="space-x-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
      
      {/* Photo Upload Modal */}
      <PhotoUpload
        officialId={editedOfficial.officialId}
        isOpen={isPhotoModalOpen}
        onClose={() => setIsPhotoModalOpen(false)}
        onSuccess={handlePhotoUploadSuccess}
      />
    </div>
  );
}