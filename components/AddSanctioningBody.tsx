// components/AddSanctioningBody.tsx
'use client';

import { useState } from 'react';
import { db } from '@/utils/firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { DetailedSanctioningBody } from '@/utils/types';

interface AddSanctioningBodyProps {
  onClose: () => void;
  sanctioningBodies: DetailedSanctioningBody[];
}

const AddSanctioningBody: React.FC<AddSanctioningBodyProps> = ({ onClose, sanctioningBodies }) => {
  const [formData, setFormData] = useState({
    name: '', // Organization's common name
    officialName: '', // Legal registered name
    registeredAddress: '', // Official business address
    corporateUrl: '', // OpenCorporates profile URL
    email: '',
    website: '',
    region: '',
    yearsActive: 0,
    combatSportsTypes: [] as string[],
    representativeName: '',
    representativeTitle: '',
    licenseNumber: '', // State athletic commission license if applicable
    insuranceProvider: '',
    stateAffiliations: [] as string[],
    mainOfficePhone: '',
    emergencyContact: '',
  });

  const combatSportOptions = [
    'Boxing',
    'Kickboxing',
    'Muay Thai',
    'MMA',
    'Other',
  ];

  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Enhanced validation
      if (!formData.name || !formData.officialName || !formData.registeredAddress || 
          !formData.corporateUrl || !formData.email || 
          !formData.representativeName || !formData.mainOfficePhone) {
        throw new Error('Please fill in all required fields');
      }

      if (formData.combatSportsTypes.length === 0) {
        throw new Error('Please select at least one combat sport type');
      }

      // Create new sanctioning body object with unique ID
      const newBody = {
        ...formData,
        id: `${formData.name.replace(/\s+/g, '_')}_${formData.region.replace(/\s+/g, '_')}_${sanctioningBodies.length}`,
        createdAt: new Date().toISOString(),
        status: 'pending_review', // Add status for admin verification
      };

      // Update Firestore document
      const docRef = doc(db, 'techbouts_sanctioning_bodies', 'sanctioning_json');
      await updateDoc(docRef, {
        sanctioning_bodies: arrayUnion(newBody)
      });

      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add sanctioning body');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center">
      <div className="relative bg-white rounded-lg w-full max-w-2xl my-4 mx-auto h-[calc(100vh-2rem)]">
        {/* Fixed Header */}
        <div className="sticky top-0 bg-white px-6 py-4 border-b border-gray-200 rounded-t-lg">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Register as Sanctioning Body</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              ×
            </button>
          </div>
        </div>
  
        {/* Scrollable Content */}
        <div className="px-6 py-4 overflow-y-auto h-[calc(100%-8rem)]">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="p-2 bg-red-100 text-red-600 rounded">
                {error}
              </div>
            )}
  
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Organization Information */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-3">Organization Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Common Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="e.g., WBA, IBF"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Official Legal Name *
              </label>
              <input
                type="text"
                value={formData.officialName}
                onChange={(e) => setFormData({ ...formData, officialName: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Legal registered name"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Registered Business Address *
              </label>
              <input
                type="text"
                value={formData.registeredAddress}
                onChange={(e) => setFormData({ ...formData, registeredAddress: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
                placeholder="Official business address"
              />
            </div>

            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OpenCorporates Profile URL *
              </label>
              <div className="space-y-2">
                <input
                  type="url"
                  value={formData.corporateUrl}
                  onChange={(e) => setFormData({ ...formData, corporateUrl: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                  placeholder="https://opencorporates.com/companies/..."
                />
                <div className="text-sm text-gray-500">
                  <a 
                    href="https://opencorporates.com/companies"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500 hover:underline"
                  >
                    Find your company on OpenCorporates →
                  </a>
                </div>
              </div>
            </div>

            {/* Combat Sports Types */}
            <div className="col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Combat Sports Types *
              </label>
              <div className="grid grid-cols-2 gap-2">
                {combatSportOptions.map((sport) => (
                  <label key={sport} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={formData.combatSportsTypes.includes(sport)}
                      onChange={(e) => {
                        const updatedSports = e.target.checked
                          ? [...formData.combatSportsTypes, sport]
                          : formData.combatSportsTypes.filter(s => s !== sport);
                        setFormData({ ...formData, combatSportsTypes: updatedSports });
                      }}
                      className="rounded border-gray-300"
                    />
                    <span>{sport}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Representative Information */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-3">Representative Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Representative Name *
              </label>
              <input
                type="text"
                value={formData.representativeName}
                onChange={(e) => setFormData({ ...formData, representativeName: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Title/Position *
              </label>
              <input
                type="text"
                value={formData.representativeTitle}
                onChange={(e) => setFormData({ ...formData, representativeTitle: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Contact Information */}
            <div className="col-span-2">
              <h3 className="text-lg font-semibold mb-3">Contact Information</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Main Office Phone *
              </label>
              <input
                type="tel"
                value={formData.mainOfficePhone}
                onChange={(e) => setFormData({ ...formData, mainOfficePhone: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="https://"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Emergency Contact *
              </label>
              <input
                type="tel"
                value={formData.emergencyContact}
                onChange={(e) => setFormData({ ...formData, emergencyContact: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            {/* Additional Information */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                State Athletic Commission License (if applicable)
              </label>
              <input
                type="text"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="License number if available"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Insurance Provider
              </label>
              <input
                type="text"
                value={formData.insuranceProvider}
                onChange={(e) => setFormData({ ...formData, insuranceProvider: e.target.value })}
                className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                placeholder="Current insurance provider"
              />
            </div>
            </div>
        </form>
      </div>

      {/* Fixed Footer */}
      <div className="sticky bottom-0 bg-white px-6 py-4 border-t border-gray-200 rounded-b-lg">
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            form="sanctioning-body-form" // Add id to your form
            disabled={isSubmitting}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
          >
            {isSubmitting ? 'Submitting...' : 'Submit for Review'}
          </button>
        </div>
      </div>
    </div>
  </div>
);
  
};

export default AddSanctioningBody;