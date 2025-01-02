// app/sanctioning/Dashboard.tsx
'use client';

import React, { useState } from 'react';
import AddSanctioningBody from '../../components/AddSanctioningBody';
import ViewSanctioningBody from '../../components/ui/ViewSanctioningBody';
import { BasicSanctioningBody } from '../../utils/types';

interface DashboardProps {
  sanctioningBodies: BasicSanctioningBody[];
}

const Dashboard: React.FC<DashboardProps> = ({ sanctioningBodies }) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBody, setSelectedBody] = useState<BasicSanctioningBody | null>(null);

  const openViewModal = (body: BasicSanctioningBody) => {
    setSelectedBody(body);
    setShowViewModal(true);
  };

  // Transform basic sanctioning bodies to detailed format with default values
  const detailedSanctioningBodies = sanctioningBodies.map(body => ({
    ...body,
    officialName: '',
    registeredAddress: '',
    corporateUrl: '',
    yearsActive: 0,
    combatSportsTypes: [],
    representativeName: '',
    representativeTitle: '',
    stateAffiliations: [],
    mainOfficePhone: '',
    emergencyContact: '',
  }));

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Sanctioning Bodies</h1>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Add Sanctioning Body
        </button>
      </div>

      {/* Sanctioning Bodies List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sanctioningBodies.map((body) => (
          <div
            key={body.id}
            className="p-4 border rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openViewModal(body)}
          >
            <h3 className="font-semibold text-lg">{body.name}</h3>
            <p className="text-gray-600">{body.region}</p>
            <p className="text-sm text-blue-500 truncate">{body.website}</p>
          </div>
        ))}
      </div>

      {/* Add Sanctioning Body Modal */}
      {showAddModal && (
        <AddSanctioningBody
          onClose={() => setShowAddModal(false)}
          sanctioningBodies={detailedSanctioningBodies}
        />
      )}

      {/* View/Edit Sanctioning Body Modal */}
      {showViewModal && selectedBody && (
        <ViewSanctioningBody
          onClose={() => setShowViewModal(false)}
          sanctioningBody={selectedBody}
        />
      )}
    </div>
  );
};

export default Dashboard;