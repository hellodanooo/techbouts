// PageClient.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Official } from '@/utils/types';
import { useRouter } from 'next/navigation';
import { fetchOfficials, updateOfficial } from '@/utils/officials/fetchOfficials';

export default function PageClient() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const router = useRouter();

  // Fetch officials on component mount
  useEffect(() => {
    const getOfficials = async () => {
      try {
        const data = await fetchOfficials();
        setOfficials(data);
        setIsLoading(false);
      } catch (error) {
        console.error('Error in component:', error);
        setErrorMessage('Failed to fetch officials');
        setIsLoading(false);
      }
    };
    
    getOfficials();
  }, []);

  const handleEdit = (official: Official) => {
    setEditingOfficial(official);
  };

  const handleSave = async (updatedOfficial: Official) => {
    try {
      const updatedOfficials = await updateOfficial(updatedOfficial, officials);
      setOfficials(updatedOfficials);
      setEditingOfficial(null);
      setTransferStatus('success');
    } catch (error) {
      console.error('Error in component:', error);
      setTransferStatus('error');
      setErrorMessage('Failed to update official');
    }
  };

  if (isLoading) {
    return <div>Loading officials...</div>;
  }

  return (
    <section className="space-y-4">
      {editingOfficial ? (
        <div className="p-4 border rounded">
          <h3 className="text-lg font-bold mb-4">Edit Official</h3>
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              value={editingOfficial.first}
              onChange={e => setEditingOfficial({...editingOfficial, first: e.target.value})}
              className="p-2 border rounded"
              placeholder="First Name"
            />
            <input
              type="text"
              value={editingOfficial.last}
              onChange={e => setEditingOfficial({...editingOfficial, last: e.target.value})}
              className="p-2 border rounded"
              placeholder="Last Name"
            />
            {/* Add more fields as needed */}
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => handleSave(editingOfficial)}
              className="px-4 py-2 bg-green-600 text-white rounded"
            >
              Save
            </button>
            <button
              onClick={() => setEditingOfficial(null)}
              className="px-4 py-2 bg-gray-600 text-white rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : null}

      {transferStatus === 'success' && (
        <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">Changes saved successfully!</p>
        </div>
      )}

      {transferStatus === 'error' && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{errorMessage}</p>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">First</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Last</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">City</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">State</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {officials.map((official) => (
              <tr 
                key={official.id}
                className="hover:bg-gray-50 cursor-pointer transition-colors"
              >    
                <td 
                  onClick={() => router.push(`/officials/${official.officialId}`)}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {official.first}
                </td>
                <td
                  onClick={() => router.push(`/officials/${official.officialId}`)}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {official.last}
                </td>
                <td 
                  onClick={() => router.push(`/officials/${official.officialId}`)}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {official.city}
                </td>
                <td 
                  onClick={() => router.push(`/officials/${official.officialId}`)}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {official.state}
                </td>
                <td
                  onClick={() => router.push(`/officials/${official.id}`)}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {official.position}
                </td>
                <td 
                  onClick={() => router.push(`/officials/${official.officialId}`)}
                  className="px-6 py-4 whitespace-nowrap"
                >
                  {official.phone}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {official.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    onClick={() => handleEdit(official)}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Edit
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}