// app/promoters/[promoterId]/Dashboard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { EventType, Promoter } from '../../../utils/types';
import { parseISO, format } from 'date-fns';
import Calendar from '../Calendar';
import MonthTable from '../../../components/MonthTable';
import Image from 'next/image';
 import AddEventForm from '@/components/AddEventForm';
 import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';
import AddEditPromoter from '@/components/AddEditPromoter';
import { FaFacebookSquare, FaInstagram } from "react-icons/fa";
import { TbWorldWww } from "react-icons/tb";




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

{/* ////////////////// ADMIN SECTION //////////////////////// */}

   {canManageEvents && (
 <div
 className='flex justify-between items-center'
 >
 <button
    onClick={() => setShowEventModal(true)}
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Create Event
  </button>

<button
    onClick={() => setShowAddEditPromoterModal(true)}
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
    Edit Promotion
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

{/* //////////////////^^^^ END ADMIN SECTION END ^^^^//////////////////////// */}

<div className="social-media-links flex justify-center gap-4 mt-4">
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


      <div className="mt-8">
        <MonthTable 
          events={allEvents}
        />
        <Calendar />
      </div>


        <div className="mt-6">
          <h2 className="text-center text-xl font-semibold mb-4">Upcoming Events</h2>
          <div className="events-list">
            {allEvents
              .filter(event => event.status === 'confirmed')
              .map(event => (
                <div key={event.id}>
                  {event.event_name} - {format(event.parsedDate, 'MMMM d, yyyy')}
               
                </div>
              ))}
          </div>
        </div>

    </div>
  );
}