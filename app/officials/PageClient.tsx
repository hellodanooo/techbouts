// PageClient.tsx
'use client';
import React, { useState, useEffect } from 'react';
import { Official } from '@/utils/types';
import { useRouter } from 'next/navigation';
import { 
  fetchOfficials, 
  updateOfficial, 
  addOfficial,
} from '@/utils/officials/fetchOfficials';
import AddOfficialModal from '@/components/officials/AddOfficialModal';
import EditOfficialModal from '@/components/officials/EditOfficialModal';

export default function PageClient() {
  const [officials, setOfficials] = useState<Official[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [transferStatus, setTransferStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [editingOfficial, setEditingOfficial] = useState<Official | null>(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
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
        setStatusMessage('Failed to fetch officials');
        setTransferStatus('error');
        setIsLoading(false);
      }
    };
    
    getOfficials();
  }, []);

  const handleEdit = (official: Official) => {
    setEditingOfficial(official);
    setIsEditModalOpen(true);
  };

  const handleSave = async (updatedOfficial: Official) => {
    try {
      const updatedOfficials = await updateOfficial(updatedOfficial, officials);
      setOfficials(updatedOfficials);
      setIsEditModalOpen(false);
      setEditingOfficial(null);
      setTransferStatus('success');
      setStatusMessage('Official updated successfully!');
      
      // Reset status after a delay
      setTimeout(() => setTransferStatus('idle'), 3000);
    } catch (error) {
      console.error('Error in component:', error);
      setTransferStatus('error');
      setStatusMessage('Failed to update official');
    }
  };

  const handleAddOfficial = async (newOfficial: Official) => {
    try {
      const updatedOfficials = await addOfficial(newOfficial, officials);
      setOfficials(updatedOfficials);
      setIsAddModalOpen(false);
      setTransferStatus('success');
      setStatusMessage('Official added successfully!');
      
      // Reset status after a delay
      setTimeout(() => setTransferStatus('idle'), 3000);
    } catch (error) {
      console.error('Error adding official:', error);
      setTransferStatus('error');
      setStatusMessage('Failed to add official');
    }
  };
  
  const handleDelete = (updatedOfficials: Official[]) => {
    setOfficials(updatedOfficials);
    setIsEditModalOpen(false);
    setEditingOfficial(null);
    setTransferStatus('success');
    setStatusMessage('Official deleted successfully!');
    
    // Reset status after a delay
    setTimeout(() => setTransferStatus('idle'), 3000);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <section className="space-y-4">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Officials</h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
        >
          <span className="mr-1">+</span> Add Official
        </button>
      </div>

      {/* Status Messages */}
      {transferStatus === 'success' && (
        <div className="p-4 mb-4 bg-green-50 border border-green-200 rounded">
          <p className="text-green-800">{statusMessage}</p>
        </div>
      )}

      {transferStatus === 'error' && (
        <div className="p-4 mb-4 bg-red-50 border border-red-200 rounded">
          <p className="text-red-800">{statusMessage}</p>
        </div>
      )}

      {/* Add Official Modal */}
      <AddOfficialModal 
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSave={handleAddOfficial}
      />

      {/* Edit Official Modal */}
      {editingOfficial && (
        <EditOfficialModal
          official={editingOfficial}
          allOfficials={officials}
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setEditingOfficial(null);
          }}
          onSave={handleSave}
          onDelete={handleDelete}
        />
      )}

      {/* Officials Table */}
      {officials.length > 0 ? (
        <div className="overflow-x-auto rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {officials.map((official) => (
                <tr 
                  key={official.id}
                  className="hover:bg-gray-50 transition-colors"
                >    
                  <td 
                    onClick={() => router.push(`/officials/${official.officialId}`)}
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  >
                    {official.photo ? (
                      <img 
                        src={official.photo} 
                        alt={`${official.first} ${official.last}`}
                        className="h-10 w-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                        {official.first?.charAt(0)}{official.last?.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td 
                    onClick={() => router.push(`/officials/${official.officialId}`)}
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  >
                    <div className="font-medium text-gray-900">{official.first} {official.last}</div>
                    <div className="text-sm text-gray-500">{official.email}</div>
                  </td>
                  <td 
                    onClick={() => router.push(`/officials/${official.officialId}`)}
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  >
                    {official.city && official.state 
                      ? `${official.city}, ${official.state}`
                      : official.city || official.state || '-'}
                  </td>
                  <td
                    onClick={() => router.push(`/officials/${official.officialId}`)}
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  >
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      official.position?.toLowerCase() === 'pending' 
                        ? 'bg-yellow-100 text-yellow-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {official.position || 'Pending'}
                    </span>
                  
                  </td>
                  <td 
                    onClick={() => router.push(`/officials/${official.officialId}`)}
                    className="px-6 py-4 whitespace-nowrap cursor-pointer"
                  >
                    <div className="text-sm">{official.phone || '-'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap cursor-pointer"
                    onClick={() => router.push(`/officials/${official.officialId}`)}
                  >
                    <div className="text-sm">
                      {official.judgedBefore ? 'Experienced' : 'New'}
                    </div>
                    {(official.bouts_judged || official.bouts_reffed) && (
                      <div className="text-xs text-gray-500">
                        {official.bouts_judged ? `${official.bouts_judged} judged` : ''}
                        {official.bouts_judged && official.bouts_reffed ? ' | ' : ''}
                        {official.bouts_reffed ? `${official.bouts_reffed} reffed` : ''}
                      </div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(official);
                      }}
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
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">No officials found. Click Add Official to add one.</p>
        </div>
      )}
    </section>
  );
}