// app/promoters/Dashboard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { EventType } from '../../utils/types';

import MonthTable from '../../components/MonthTable';
import AddPromoter from '@/components/AddPromoter';
import AddEventForm from '@/components/AddEventForm';

import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';



interface Props {
  initialConfirmedEvents?: EventType[];
  initialPendingEvents?: EventType[];
  allTechBoutsEvents?: EventType[];
}

const PromoterDashboard = ({
  initialConfirmedEvents = [],
  initialPendingEvents = [],
    allTechBoutsEvents = [],


}: Props) => {

  const [activeSanctioning, setActiveSanctioning] = useState<'ALL' | 'PMT' | 'IKF' | 'PBSC'>('ALL');
    const [showPromoterModal, setShowPromoterModal] = useState(false); 
  const { user, isAdmin, isPromoter, isNewUser } = useAuth();
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

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '40px',
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
      gap: '5px',
      width: '95%',
      margin: 'auto'
    },
    card: (isHighlighted: boolean, isHovered: boolean) => ({
      padding: '20px',
      backgroundColor: isHighlighted ? '#fee2e2' : 'white',
      borderRadius: '8px',
      border: '1px solid #ddd',
      cursor: 'pointer',
      transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      boxShadow: isHovered
        ? '0 4px 6px rgba(0, 0, 0, 0.1)'
        : '0 1px 3px rgba(0, 0, 0, 0.1)',
      transform: isHovered ? 'translateY(-2px)' : 'none',
      textDecoration: 'none',
    }),
    cardTitle: {
      margin: '0 0 10px 0',
      fontSize: '1.1rem',
      fontWeight: '600',
      textTransform: 'capitalize' as const,
      color: 'black',
    },
    cardSubText: {
      margin: '0',
      color: '#666',
      fontSize: '0.9rem',
    },
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
    <div style={styles.container}>
  <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isPromoter={isPromoter}
        isNewUser={isNewUser}
      />
      <h1>Promoter Dashboard</h1>





      {isAdmin && (

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




      <div style={toggleButtons}>
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

export default PromoterDashboard;