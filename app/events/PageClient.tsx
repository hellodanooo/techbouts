// app/events/PageClient.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { EventType } from '../../utils/types';

import MonthTable from '../../components/MonthTable';
import AddPromoter from '@/components/AddEditPromoter';
import AddEventForm from '@/components/events/AddEventForm';

import { useAuth } from '@/context/AuthContext';
import Header from '@/components/headers/Header';

interface Props {
  initialConfirmedEvents?: EventType[];
  initialPendingEvents?: EventType[];
  allTechBoutsEvents?: EventType[];
}

const EventsDashboard = ({
  initialConfirmedEvents = [],
  initialPendingEvents = [],
    allTechBoutsEvents = [],


}: Props) => {

  const [activeSanctioning, setActiveSanctioning] = useState<'ALL' | 'PMT' | 'IKF' | 'PBSC'>('ALL');
    const [showPromoterModal, setShowPromoterModal] = useState(false); 
  const {  isAdmin, isPromoter } = useAuth();
const [showAddEventModal, setShowAddEventModal] = useState(false);


  const toggleButton = (isActive: boolean) => ({
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: isActive ? '#fee2e2' : '#f3f4f6',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
  });



  const toggleButtons = {
    display: 'flex',
    gap: '10px',
    marginBottom: '20px',
  };





  const { ikfEvents, pbscEvents } = useMemo(() => {
    return {
      ikfEvents: allTechBoutsEvents.filter(event => event.sanctioning === 'IKF'),
      pbscEvents: allTechBoutsEvents.filter(event => event.sanctioning === 'PBSC')
    };
  }, [allTechBoutsEvents]);

  const activeEvents = useMemo(() => {
    switch (activeSanctioning) {
      
      
        case 'ALL':
            const pmtEvents = [
              ...initialConfirmedEvents.map(event => ({
                ...event,
                uniqueId: `confirmed_${event.eventId}`,
                sanctioning: 'PMT'
              })),
              ...initialPendingEvents.map(event => ({
                ...event,
                uniqueId: `pending_${event.eventId}`,
                sanctioning: 'PMT'
              }))
            ];
            
            const ikfWithIds = ikfEvents.map(event => ({
              ...event,
              uniqueId: `ikf_${event.eventId}`,
              sanctioning: 'IKF'
            }));
            
            const pbscWithIds = pbscEvents.map(event => ({
              ...event,
              uniqueId: `pbsc_${event.eventId}`,
              sanctioning: 'PBSC'
            }));
            
            return [...pmtEvents, ...ikfWithIds, ...pbscWithIds];
      
      
      
        case 'PMT':
        const confirmedWithPrefix = initialConfirmedEvents.map(event => ({
          ...event,
          uniqueId: `confirmed_${event.eventId}`,
          sanctioning: 'PMT'
        }));
        const pendingWithPrefix = initialPendingEvents.map(event => ({
          ...event,
          uniqueId: `pending_${event.eventId}`,
          sanctioning: 'PMT'
        }));
        return [...confirmedWithPrefix, ...pendingWithPrefix];
      case 'IKF':
        return ikfEvents.map(event => ({
          ...event,
          uniqueId: `ikf_${event.eventId}`,
          sanctioning: 'IKF'
        }));
      case 'PBSC':
        return pbscEvents.map(event => ({
          ...event,
          uniqueId: `pbsc_${event.eventId}`,
          sanctioning: 'PBSC'
        }));
      default:
        return [];
    }
  }, [activeSanctioning, initialConfirmedEvents, initialPendingEvents, ikfEvents, pbscEvents]);


  const openAddPromoter = () => {
    setShowPromoterModal(true);
  
  };

  return (
    <div>
      <Header />
  
      <h1>Events Dashboard</h1>

      {isAdmin || isPromoter && (

        <div
      
          style={{
            width: '50%'
          }}
        >
          <div>
            Admin Enabled
          </div>
         
          <button
            className=" mt-2 px-4 py-2 bg-green-500 text-white rounded"
            onClick={openAddPromoter}
          >
            Add Promoter
          </button>

          <button
  onClick={() => setShowAddEventModal(true)}
    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
  >
    Create Event
  </button>


        </div>
      )}


{showAddEventModal && ( 
        <AddEventForm
          onClose={() => setShowAddEventModal(false)}
        />
      )}
      
      {showPromoterModal && (


<AddPromoter
  onClose={() => setShowPromoterModal(false)}

  isAdmin={isAdmin} // Pass the isAdmin status
/>
)}




      <div
        className='p5'
      style={toggleButtons}>
      <button
  style={toggleButton(activeSanctioning === 'ALL')}
  onClick={() => setActiveSanctioning('ALL')}
>
  All Events
</button>
        <button
          style={toggleButton(activeSanctioning === 'PMT')}
          onClick={() => setActiveSanctioning('PMT')}
        >
          PMT
        </button>
        <button
          style={toggleButton(activeSanctioning === 'IKF')}
          onClick={() => setActiveSanctioning('IKF')}
        >
          IKF
        </button>
        <button
          style={toggleButton(activeSanctioning === 'PBSC')}
          onClick={() => setActiveSanctioning('PBSC')}
        >
          PBSC
        </button>
      </div>



      <div style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
      }}>
        <MonthTable
          events={activeEvents}
          isPromoter={isPromoter}
          isAdmin={isAdmin}
          activeSanctioning={activeSanctioning}
        />
 
      </div>
    </div>
  );
};

export default EventsDashboard;