'use client';

import React, { useState } from 'react';
import AddEventForm from '@/components/AddEventForm';
import AddPromoter from '@/components/AddPromoter'; 

interface DashboardProps {
    promoters: { id: string; name: string; email: string; promotion: string; sanctioning: string; }[]; // Accept promoters with email
}

const Dashboard: React.FC<DashboardProps> = ({ promoters }) => {
    const [showEventModal, setShowEventModal] = useState(false); // Controls AddEventForm visibility
    const [showPromoterModal, setShowPromoterModal] = useState(false); // Controls AddPromoter visibility


  const openAddPromoter = () => {
    setShowEventModal(false); // Close AddEventForm modal
    setShowPromoterModal(true); // Open AddPromoter modal
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create Event</h1>
      <button
        onClick={() => setShowEventModal(true)} // Open AddEventForm modal
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Create Event
      </button>

      {/* Add Event Modal */}
      {showEventModal && (
        console.log('promoters:', promoters),
        <AddEventForm
          onClose={() => setShowEventModal(false)} // Close the AddEventForm modal
          onOpenAddPromoter={openAddPromoter} // Open AddPromoter modal
          promoters={promoters} // Pass promoters to AddEventForm
        />
      )}

      {/* Add Promoter Modal */}
      {showPromoterModal && (
        <AddPromoter
          onClose={() => setShowPromoterModal(false)} // Close the AddPromoter modal
          promoters={promoters}
          />
      )}
    </div>
  );
};

export default Dashboard;