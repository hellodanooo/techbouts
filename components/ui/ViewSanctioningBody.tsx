// components/ui/ViewSanctioningBody.tsx
'use client';

import { useState } from 'react';
import { db } from '@/utils/firebase';
import { doc, updateDoc } from 'firebase/firestore';

interface ViewSanctioningBodyProps {
  onClose: () => void;
  sanctioningBody: {
    id: string;
    name: string;
    email: string;
    website: string;
    region: string;
  };
}

const ViewSanctioningBody: React.FC<ViewSanctioningBodyProps> = ({
  onClose,
  sanctioningBody,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState(sanctioningBody);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      // Validate form
      if (!formData.name || !formData.email || !formData.region) {
        throw new Error('Name, email, and region are required');
      }

      // Update Firestore document
      const docRef = doc(db, 'techbouts_sanctioning_bodies', 'sanctioning_json');
      await updateDoc(docRef, {
        // You'll need to implement the logic to update the specific sanctioning body
        // within the array. This might require fetching the current array first,
        // updating the specific item, and then updating the whole array
        [`sanctioning_bodies.${sanctioningBody.id}`]: formData
      });

      setIsEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update sanctioning body');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center">
      <div className="bg-white rounded-lg p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">
            {isEditing ? 'Edit Sanctioning Body' : 'Sanctioning Body Details'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ×
          </button>
        </div>

        {error && (
          <div className="mb-4 p-2 bg-red-100 text-red-600 rounded">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{sanctioningBody.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              {isEditing ? (
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{sanctioningBody.email}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Website
              </label>
              {isEditing ? (
                <input
                  type="url"
                  value={formData.website}
                  onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://"
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">
                  {sanctioningBody.website ? (
                    <a
                      href={sanctioningBody.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      {sanctioningBody.website}
                    </a>
                  ) : (
                    'Not provided'
                  )}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Region
              </label>
              {isEditing ? (
                <input
                  type="text"
                  value={formData.region}
                  onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                  className="w-full p-2 border rounded focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              ) : (
                <p className="p-2 bg-gray-50 rounded">{sanctioningBody.region}</p>
              )}
            </div>
          </div>

          <div className="mt-6 flex justify-end space-x-3">
            {isEditing ? (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setFormData(sanctioningBody);
                    setIsEditing(false);
                  }}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 border rounded text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Edit
                </button>
              </>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ViewSanctioningBody;