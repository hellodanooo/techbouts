'use client';

import React, { useState, useEffect } from 'react';
import { EventType } from '../../../utils/types';
import { parseISO, format } from 'date-fns';
import { FaLock } from "react-icons/fa6";
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { checkDashboardAuthorization } from '../../../utils/authUtils';
import { useAuth } from '../../../context/AuthContext';
import EditEventModal from '@/components/popups/EditEvent';

interface TournamentDashboardProps {
  promoterId: string;
  promoterEmail: string;
  eventData: EventType;
}

export default function TournamentDashboard({
  promoterId,
  promoterEmail,
  eventData
}: TournamentDashboardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isPromoter, setIsPromoter] = useState<boolean | null>(false);
  const [imageError, setImageError] = useState(false);
  const [editEventModalOpen, setEditEventModalOpen] = useState(false);

  // Authentication & Authorization
  useEffect(() => {
    const authorizeUser = async () => {
      if (user?.email) {
        const isAuthorized = checkDashboardAuthorization(promoterEmail, user.email);
        setIsPromoter(isAuthorized);
      } else {
        setIsPromoter(false);
      }
    };

    authorizeUser();
  }, [user, promoterId, promoterEmail]);

  const handleLogin = () => {
    router.push(`/auth/login?promoterId=${promoterId}`);
  };

  const handleImageError = () => {
    setImageError(true);
  };

  const openEditEventModal = () => {
    setEditEventModalOpen(true);
  }

  const handleSaveEvent = async (updatedEvent: EventType) => {
    console.log('eventId', updatedEvent.eventId);

    try {
      const response = await fetch(`/api/pmt/events/${eventData.eventId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedEvent),
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update event');
      }
  
      
      // Update local state or refresh the page
      router.refresh();
      
      // Close the modal
      setEditEventModalOpen(false);
      
    } catch (error) {
      console.error('Error saving event:', error);
      // You might want to show an error notification here
    }
  }

  if (loading) {
    return <div className="flex justify-center items-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="p-5">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{eventData.name}</h1>
         
          {!isPromoter && (
            <button
              onClick={handleLogin}
              className="text-gray-500 hover:text-gray-700"
            >
              <FaLock size={20} />
            </button>
          )}

          {isPromoter && (
            <button
              onClick={openEditEventModal}
              className="text-gray-500 hover:text-gray-700"
            >
             Edit Event
            </button>
          )}
        </div>

        {/* Event Flyer Section */}
        <div className="mb-8">
          {eventData.flyer && !imageError ? (
            <div className="relative w-full h-96 rounded-lg overflow-hidden shadow-lg">
              <Image
                src={eventData.flyer}
                alt={`${eventData.name} flyer`}
                fill
                className="object-contain"
                onError={handleImageError}
                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                priority
              />
            </div>
          ) : (
            <div className="w-full h-96 bg-gray-200 rounded-lg flex items-center justify-center">
              <p className="text-gray-500">No flyer available</p>
            </div>
          )}
        </div>

        {/* Event Details Section */}
        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Event Details</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Date:</span> {format(parseISO(eventData.date), 'MMMM d, yyyy')}</p>
              <p><span className="font-medium">Location:</span> {eventData.city}, {eventData.state}</p>
              <p><span className="font-medium">Registration Fee:</span> ${eventData.registration_fee}</p>
              <p><span className="font-medium">Competition Type:</span> {eventData.competition_type}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-4">Schedule</h2>
            <div className="space-y-3">
              <p><span className="font-medium">Doors Open:</span> {eventData.doors_open}</p>
              <p><span className="font-medium">Weigh-in Time:</span> {eventData.weighin_start_time} - {eventData.weighin_end_time}</p>
              {eventData.rules_meeting_time && (
                <p><span className="font-medium">Rules Meeting:</span> {eventData.rules_meeting_time}</p>
              )}
              {eventData.bouts_start_time && (
                <p><span className="font-medium">Start Time:</span> {eventData.bouts_start_time}</p>
              )}
            </div>
          </div>
        </div>

        {/* Edit Event Modal */}
        <EditEventModal
          isOpen={editEventModalOpen}
          onClose={() => setEditEventModalOpen(false)}
          event={eventData}
          onSave={handleSaveEvent}
        />
      </div>
    </div>
  );
}