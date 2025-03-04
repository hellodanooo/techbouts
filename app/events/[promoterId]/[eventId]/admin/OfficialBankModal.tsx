'use client';

import React, { FC, useState, useEffect } from 'react';
import { Official } from '@/utils/types';

interface OfficialBankModalProps {
  isOpen: boolean;
  onClose: () => void;
  officialsList: Official[];
  onSelectOfficial: (officialId: string, position: string) => void;
  position: string;
}

const OfficialBankModal: FC<OfficialBankModalProps> = ({
  isOpen,
  onClose,
  officialsList,
  onSelectOfficial,
  position
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOfficials, setFilteredOfficials] = useState<Official[]>([]);

  useEffect(() => {
    // Filter officials based on search term
    if (searchTerm) {
      const filtered = officialsList.filter(official => 
        `${official.first} ${official.last}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (official.city && official.city.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (official.state && official.state.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      setFilteredOfficials(filtered);
    } else {
      setFilteredOfficials(officialsList);
    }
  }, [searchTerm, officialsList]);

  const handleSelect = (officialId: string) => {
    onSelectOfficial(officialId, position);
    setSearchTerm('');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg w-full max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Select {position}</h2>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            ✕
          </button>
        </div>
        
        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, city, or state..."
            className="w-full p-2 border border-gray-300 rounded"
          />
        </div>
        
        <div className="overflow-y-auto flex-grow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOfficials.map(official => (
                <tr key={official.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    {official.first} {official.last}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {official.city}, {official.state}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <button
                      onClick={() => handleSelect(official.id)}
                      className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                    >
                      Select
                    </button>
                  </td>
                </tr>
              ))}
              {filteredOfficials.length === 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                    No officials found matching your search criteria
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default OfficialBankModal;