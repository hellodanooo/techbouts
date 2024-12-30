'use client';

import React, { useState, useEffect } from 'react';
import { Event, PromoterType } from '../../../utils/types';
import { parseISO, format } from 'date-fns';
import Calendar from '../Calendar';
import MonthTable from '../MonthTable';
import PromoterEditEvent from '../PromoterEditEvent';
import PasswordVerification from '../../../components/promoters/PasswordVerification';
import SubmitEvent from '../../../components/promoters/SubmitEvent';
import { FaCalendarPlus } from "react-icons/fa6";
import buttons from '../../../styles/buttons.module.css';
import { useAuth } from '../../../context/AuthContext';
import { useRouter } from 'next/navigation';
import { getDatabase, ref, get } from 'firebase/database';

interface PromoterEvent extends Event {
  parsedDate: Date;
  status?: 'confirmed' | 'pending' | 'approved';
}

interface PromoterDashboardProps {
  promoterId: string;
  initialConfirmedEvents: Event[];
  initialPendingEvents: Event[];
}

export default function PromoterDashboard({ 
  promoterId, 
  initialConfirmedEvents, 
  initialPendingEvents 
}: PromoterDashboardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  // Events State
  const [confirmedEvents, setConfirmedEvents] = useState<PromoterEvent[]>(
    initialConfirmedEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'confirmed'
    }))
  );
  
  const [pendingEvents, setPendingEvents] = useState<PromoterEvent[]>(
    initialPendingEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'pending'
    }))
  );

  // UI State
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [showPasswordVerification, setShowPasswordVerification] = useState(false);
  const [pendingEditEventId, setPendingEditEventId] = useState<string | null>(null);
  const [showSubmitPendingEvent, setShowSubmitPendingEvent] = useState(false);
  const [pendingEventPasswordVerification, setPendingEventPasswordVerification] = useState(false);
  const [selectedView, setSelectedView] = useState<'all' | 'confirmed' | 'pending'>('all');

  // Authentication & Authorization
  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login');
      return;
    }

    const checkAuthorization = async () => {
      if (!user?.email) return;

      try {
        console.log('Checking authorization for:', {
          promoterId,
          userEmail: user.email
        });

        const db = getDatabase();
        const promoterRef = ref(db, `promoters/${promoterId}/authorizedEmails`);
        const snapshot = await get(promoterRef);

        if (snapshot.exists()) {
          const authorizedEmails = snapshot.val();
          console.log('Authorized emails:', authorizedEmails);
          
          // Check if authorizedEmails is an array and includes the user's email
          const isAuthorizedUser = Array.isArray(authorizedEmails) && 
            authorizedEmails.some(email => email.toLowerCase() === user.email?.toLowerCase());
          
          console.log('Is authorized:', isAuthorizedUser);
          setIsAuthorized(isAuthorizedUser);
        } else {
          console.log('No authorized emails found for promoter:', promoterId);
          setIsAuthorized(false);
        }
      } catch (error) {
        console.error('Error checking authorization:', error);
        setIsAuthorized(false);
      }
    };

    if (user) {
      checkAuthorization();
    }
  }, [user, loading, promoterId, router]);

  // Event Handlers
  const handleSubmitPendingEventClick = () => {
    setPendingEventPasswordVerification(true);
  };

  const handlePendingEventPasswordSuccess = () => {
    setPendingEventPasswordVerification(false);
    setShowSubmitPendingEvent(true);
  };

  const handlePendingEventPasswordCancel = () => {
    setPendingEventPasswordVerification(false);
  };

  const refreshEvents = async () => {
    try {
      const [confirmedResponse, pendingResponse] = await Promise.all([
        fetch('/api/pmt/events'),
        fetch('/api/pmt/promoterEvents')
      ]);

      if (confirmedResponse.ok) {
        const data = await confirmedResponse.json();
        const filteredEvents = data.events
          .filter((event: Event) => event.promoterId === promoterId)
          .map((event: Event) => ({
            ...event,
            parsedDate: parseISO(event.date),
            status: 'confirmed'
          }));
        setConfirmedEvents(filteredEvents);
      }

      if (pendingResponse.ok) {
        const data = await pendingResponse.json();
        const filteredEvents = data.events
          .filter((event: Event) => event.promoterId === promoterId)
          .map((event: Event) => ({
            ...event,
            parsedDate: parseISO(event.date),
            status: 'pending'
          }));
        setPendingEvents(filteredEvents);
      }
    } catch (error) {
      console.error('Error refreshing events:', error);
    }
  };

  const handleSubmitSuccess = async () => {
    setShowSubmitPendingEvent(false);
    await refreshEvents();
  };

  const handleEditClick = (eventId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setPendingEditEventId(eventId);
    setShowPasswordVerification(true);
  };

  const handlePasswordSuccess = () => {
    setShowPasswordVerification(false);
    setEditingEventId(pendingEditEventId);
    setPendingEditEventId(null);
  };

  const handlePasswordCancel = () => {
    setShowPasswordVerification(false);
    setPendingEditEventId(null);
  };

  const handleEditSuccess = async () => {
    setEditingEventId(null);
    await refreshEvents();
  };

  const toggleEventDetails = (eventId: string) => {
    setExpandedEventId(expandedEventId === eventId ? null : eventId);
  };

  const getDisplayedEvents = () => {
    switch (selectedView) {
      case 'confirmed':
        return confirmedEvents;
      case 'pending':
        return pendingEvents;
      default:
        return [...confirmedEvents, ...pendingEvents].sort(
          (a, b) => a.parsedDate.getTime() - b.parsedDate.getTime()
        );
    }
  };

  // Loading States
  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null; // Will redirect in useEffect
  }

  if (isAuthorized === false) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="max-w-md w-full bg-white p-8 rounded-lg shadow-lg">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Unauthorized Access</h1>
          <p className="text-gray-600 mb-4">
            {`Access denied for ${user.email}. This dashboard is only accessible to authorized promoter emails.`}
          </p>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  if (isAuthorized !== true) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">Verifying access...</div>
      </div>
    );
  }

  // Main Dashboard UI
  return (
    <div className="p-5">
      <h1 className="text-center text-2xl font-bold mb-6">
        {promoterId.charAt(0).toUpperCase() + promoterId.slice(1)} Events
      </h1>

      <div className="flex justify-center gap-4 mb-6">
        <button 
          onClick={() => setSelectedView('all')}
          className={`px-4 py-2 rounded ${selectedView === 'all' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          All Events
        </button>
        <button 
          onClick={() => setSelectedView('confirmed')}
          className={`px-4 py-2 rounded ${selectedView === 'confirmed' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Confirmed Events
        </button>
        <button 
          onClick={() => setSelectedView('pending')}
          className={`px-4 py-2 rounded ${selectedView === 'pending' ? 'bg-blue-500 text-white' : 'bg-gray-200'}`}
        >
          Pending Events
        </button>
      </div>

      {/* Events List */}
      {getDisplayedEvents().length === 0 ? (
        <p className="text-center">No events found for the selected filter.</p>
      ) : (
        <div className="flex flex-col gap-4 items-center">
          {getDisplayedEvents().map((event) => (
            <div
              key={event.id}
              className="w-full max-w-2xl border rounded-lg overflow-hidden"
            >
              <div
                onClick={() => toggleEventDetails(event.id!)}
                className={`p-4 cursor-pointer flex justify-between items-center
                  ${event.status === 'pending' ? 'bg-yellow-50' : 
                    event.status === 'approved' ? 'bg-green-50' : 'bg-gray-50'}`}
              >
                <div className="font-bold">
                  {event.event_name}
                  {event.status && (
                    <span className={`ml-2 px-2 py-1 text-xs rounded
                      ${event.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 
                        event.status === 'approved' ? 'bg-green-100 text-green-800' : ''}`}>
                      {event.status}
                    </span>
                  )}
                </div>
                <div>{format(event.parsedDate, 'MMMM d, yyyy')}</div>
              </div>

              {expandedEventId === event.id && (
                <div className="p-4">
                  {showPasswordVerification && pendingEditEventId === event.id ? (
                    <PasswordVerification
                      promoterId={promoterId as PromoterType}
                      onSuccess={handlePasswordSuccess}
                      onCancel={handlePasswordCancel}
                    />
                  ) : editingEventId === event.id ? (
                    <PromoterEditEvent
                      event={event}
                      eventId={event.id!}
                      onCancelUpdate={() => setEditingEventId(null)}
                      onUpdateSuccess={handleEditSuccess}
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-4">
                      {event.flyer && (
                        <img
                          src={event.flyer}
                          alt="Event flyer"
                          className="max-w-full h-auto max-h-96"
                        />
                      )}
                      {event.address && (
                        <p><strong>Address:</strong> {event.address}</p>
                      )}
                      <button
                        onClick={(e) => handleEditClick(event.id!, e)}
                        className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600"
                      >
                        Edit Event
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Submit Event Button */}
      <div className="mt-6 text-center">
        {pendingEventPasswordVerification ? (
          <PasswordVerification
            promoterId={promoterId as PromoterType}
            onSuccess={handlePendingEventPasswordSuccess}
            onCancel={handlePendingEventPasswordCancel}
          />
        ) : showSubmitPendingEvent ? (
          <SubmitEvent
            promoterId={promoterId as PromoterType}
            onSuccess={handleSubmitSuccess}
            onCancel={() => setShowSubmitPendingEvent(false)}
          />
        ) : (
          <button
            onClick={handleSubmitPendingEventClick}
            className={`${buttons.submitButton2} flex items-center gap-2 mx-auto`}
          >
            Submit Event Request <FaCalendarPlus />
          </button>
        )}
      </div>

      {/* Calendar Views */}
      <div className="mt-8">
        <MonthTable 
          initialEvents={confirmedEvents} 
          initialPendingEvents={pendingEvents}
        />
        <Calendar />
      </div>
    </div>
  );
}