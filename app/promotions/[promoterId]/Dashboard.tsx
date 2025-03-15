// app/promoters/[promoterId]/Dashboard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { EventType, Promoter } from '../../../utils/types';
import { parseISO } from 'date-fns';
import Calendar from '../Calendar';
import MonthTable from '../../../components/MonthTable';
import Image from 'next/image';
import AddEventForm from '@/components/events/AddEventForm';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';
import AddEditPromoter from '@/components/AddEditPromoter';
import { FaFacebookSquare, FaInstagram } from "react-icons/fa";
import { TbWorldWww } from "react-icons/tb";
import UpcomingEvents from './UpcomingEventsList';

interface PromoterDashboardProps {
  promoter: Promoter; 
  promoterId: string;
  initialConfirmedEvents: EventType[];
  initialPendingEvents: EventType[];
  logoUrl: string;
  allTechBoutsEvents: EventType[];
}

export default function PromoterDashboard({ 
  initialConfirmedEvents, 
  initialPendingEvents, 
  promoter,
  allTechBoutsEvents
}: PromoterDashboardProps) {
  console.log('Promoter data in dashboard:', promoter);
  const [showEventModal, setShowEventModal] = useState(false);
  const { user, isAdmin, isPromoter, isNewUser } = useAuth();
  const [showAddEditPromoterModal, setShowAddEditPromoterModal] = useState(false);

  // Check if current user is this specific promoter or an admin
  const canManageEvents = useMemo(() => {
    return (user?.email && promoter?.email && user.email === promoter.email) || isAdmin;
  }, [user?.email, promoter?.email, isAdmin]);

  // Process events with status
  const allEvents = useMemo(() => {
    const confirmed = initialConfirmedEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'confirmed' as const,
      eventType: 'pmt' as const
    }));

    const pending = initialPendingEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'pending' as const,
      eventType: 'pmt' as const
    }));

    const ikf = allTechBoutsEvents.map(event => ({
      ...event,
      parsedDate: parseISO(event.date),
      status: 'confirmed' as const,
    }));

    return [...confirmed, ...pending, ...ikf];
  }, [initialConfirmedEvents, initialPendingEvents, allTechBoutsEvents]);

  // Check if the promoter has any social media links
  const hasSocialLinks = promoter.facebook || promoter.instagram || promoter.website;
  
  return (
    <div className="p-5">
      <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isPromoter={isPromoter}
        isNewUser={isNewUser}
      />
      
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <div className="relative h-10 w-10">
            <Image
              src={promoter.logo || '/logos/techboutslogoFlat.png'}
              alt="Promoter Logo"
              fill
              className={`rounded-full object-cover ${isPromoter ? 'cursor-pointer' : 'cursor-not-allowed'}`}
            />
          </div>
          <h1 className="text-2xl font-bold">
            {promoter.promotionName || `No Promotion Name`} Events
          </h1>
        </div>
      </div>

      {/* ADMIN SECTION */}
      {canManageEvents && (
        <div className='flex justify-between items-center m-5'>
          <button
            onClick={() => setShowEventModal(true)}
            className="button-2"
          >
            <div className='text-2'>Create Event</div>
          </button>

          <button
            onClick={() => setShowAddEditPromoterModal(true)}
            className="button-2"
          >
            <div className='text-2'>Edit Promotion</div>
          </button>
        </div>
      )}

      {showAddEditPromoterModal && (
        <AddEditPromoter
          onClose={() => setShowAddEditPromoterModal(false)}
          isAdmin={isAdmin}
          edit={true}
          promoterData={promoter}
        />
      )}

      {showEventModal && (
        <AddEventForm
          onClose={() => setShowEventModal(false)}
          promoter={promoter}
        />
      )}
      {/* END ADMIN SECTION */}

      {/* Social Media Links Section */}
      {hasSocialLinks ? (
        <div className="social-media-links flex justify-center gap-4 m-4">
          {promoter.facebook && (
            <a
              href={promoter.facebook}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-blue-600 border-solid flex items-center gap-2 text-blue-600 hover:text-blue-800 transition-colors duration-300 hover:scale-105 p-1 rounded-md"
            >
              <FaFacebookSquare className="text-2xl" />
              <span className="font-medium">Facebook</span>
            </a>
          )}
          {promoter.instagram && (
            <a
              href={promoter.instagram}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-pink-600 border-solid rounded-md p-1 flex items-center gap-2 text-pink-600 hover:text-pink-800 transition-transform duration-300 hover:scale-105"
            >
              <FaInstagram className="text-2xl" />
              <span className="font-medium">Instagram</span>
            </a>
          )}
          {promoter.website && (
            <a
              href={promoter.website}
              target="_blank"
              rel="noopener noreferrer"
              className="border border-black border-solid rounded-md p-1 flex items-center gap-2 text-gray-600 hover:text-gray-800 transition-transform duration-300 hover:scale-110"
            >
              <TbWorldWww className="text-2xl" />
              <span className="font-medium">Website</span>
            </a>
          )}
        </div>
      ) : (
        // Display message only to the specific promoter who owns this page
        isPromoter && user?.email === promoter?.email && (
          <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <svg className="w-5 h-5 text-yellow-400 mr-2" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <p className="text-sm text-yellow-700">
                Your Promoter Page has no social links. Let people know how to follow your promotion by clicking <button 
                  onClick={() => setShowAddEditPromoterModal(true)}
                  className="font-bold text-blue-600 hover:underline"
                >
                  Edit Promotion
                </button> and add your social media links and website.
              </p>
            </div>
          </div>
        )
      )}

      <UpcomingEvents events={allEvents} />
      
      <div className="mt-8">
        <MonthTable events={allEvents} />
        <Calendar />
      </div>
    </div>
  );
}