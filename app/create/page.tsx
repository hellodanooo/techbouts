'use client';

import React, { useState } from 'react';
import AddEventForm from '@/components/AddEventForm';

const CreateEventPage: React.FC = () => {
  const [showModal, setShowModal] = useState(false);

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Create Event</h1>
      <button
        onClick={() => setShowModal(true)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        Create Event
      </button>

      {showModal && <AddEventForm onClose={() => setShowModal(false)} />}
    </div>
  );
};

export default CreateEventPage;
