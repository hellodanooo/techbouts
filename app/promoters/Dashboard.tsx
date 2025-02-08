// app/promoters/Dashboard.tsx
'use client';

import React, { useState, useMemo } from 'react';
import { Event, Promoter } from '../../utils/types';
import Calendar from './Calendar';
import MonthTable from '../../components/MonthTable';
import { useRouter } from 'next/navigation';
import AddPromoter from '@/components/AddPromoter';
import { useMultiFirebase } from '@/context/MultiFirebaseContext';

interface Props {
  initialConfirmedEvents?: Event[];
  initialPendingEvents?: Event[];
  ikfEvents?: Event[];
  ikfPromoters?: Promoter[];
  pmtPromoters?: Promoter[];
}

const NORCAL_CITIES = new Set([
  'sacramento',
  'san francisco',
  'oakland',
  'san jose',
  'santa cruz',
  'gilroy',
  'berkeley',
  'el cerrito',
  'mountain view',
  'palo alto',
  'fremont',
  'hayward',
  'vallejo',
  'santa rosa',
  'modesto',
  'stockton',
  'fresno',
  'redding',
  'chico'
]);

const isNorCalLocation = (city: string, state: string): boolean => {
  // Normalize the city name for comparison
  const normalizedCity = city.toLowerCase().trim();

  // Check if it's in California first
  if (state.toLowerCase() !== 'ca' && state.toLowerCase() !== 'california') {
    return false;
  }

  // Check if it's in our NorCal cities set
  if (NORCAL_CITIES.has(normalizedCity)) {
    return true;
  }

  // Additional checks for regions/areas that might be written differently
  return normalizedCity.includes('bay area') ||
    normalizedCity.includes('northern california') ||
    normalizedCity.includes('norcal');
};

const PromoterDashboard = ({
  initialConfirmedEvents = [],
  initialPendingEvents = [],
  ikfEvents = [],
  ikfPromoters = [],
  pmtPromoters = [],
}: Props) => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeSanctioning, setActiveSanctioning] = useState<'PMT' | 'IKF'>('PMT');
  const [showPromoterModal, setShowPromoterModal] = useState(false); // Controls AddPromoter visibility
  const { authState, user } = useMultiFirebase();
  console.log('Auth State in Dashboard:', authState);
  console.log('User in Dashboard:', user);
  const { isAdmin, isPromoter } = authState;


  // const debugSection = (
  //   <div className="mb-4 p-4 bg-gray-100 rounded">
  //     <h2 className="font-bold mb-2">Auth Debug Info:</h2>
  //     <p>Is Admin: {isAdmin ? 'Yes' : 'No'}</p>
  //     <p>Is Promoter: {isPromoter ? 'Yes' : 'No'}</p>
  //     <p>User Email: {user.techbouts?.email || 'Not logged in'}</p>
  //     <p>Auth State: {JSON.stringify(authState)}</p>
  //   </div>
  // );



  const activePromoters = useMemo(() => {
    const promoters = activeSanctioning === 'PMT' ? pmtPromoters : ikfPromoters;

    return promoters
      .map(promoter => ({
        ...promoter,
        isNorCal: activeSanctioning === 'PMT' ?
          isNorCalLocation(promoter.city, promoter.state) :
          false
      }))
      .sort((a, b) => {
        // Sort NorCal promoters first for PMT system
        if (activeSanctioning === 'PMT') {
          if (a.isNorCal && !b.isNorCal) return -1;
          if (!a.isNorCal && b.isNorCal) return 1;
        }
        // Then sort by name
        return a.name.localeCompare(b.name);
      });
  }, [activeSanctioning, pmtPromoters, ikfPromoters]);

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


  const handlePromoterClick = (promoter: Promoter) => {
    if (activeSanctioning === 'PMT') {
      router.push(`/promoters/${promoter.name.toLowerCase()}`);
    } else {
      // For IKF, use the promoterId
      router.push(`/promoter/${promoter.promoterId}`);
    }
  };


  const activeEvents = useMemo(() => {
    if (activeSanctioning === 'PMT') {
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
    }
    return ikfEvents.map(event => ({
      ...event,
      sanctioning: 'IKF'
    }));
  }, [activeSanctioning, initialConfirmedEvents, ikfEvents, initialPendingEvents]);



  const openAddPromoter = () => {
    setShowPromoterModal(true); // Open AddPromoter modal
  };

  return (
    <div style={styles.container}>
      <h1>Promoter Dashboard</h1>


{/* {debugSection} */}


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
        </div>
      )}



      {showPromoterModal && (


        <AddPromoter
          onClose={() => setShowPromoterModal(false)}
          promoters={activePromoters}
          isAdmin={isAdmin} // Pass the isAdmin status
        />
      )}


      <div style={toggleButtons}>
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
      </div>

      <div style={styles.grid}>
        {activePromoters.map((promoter) => {

          const promoterEvents = activeEvents.filter(event => {
            if (activeSanctioning === 'PMT') {
              return event.promoterId === promoter.name.toLowerCase();
            } else {
              // For IKF, match on promoterId
              // Add console.log to debug the matching
              console.log('Event promoterId:', event.promoterId);
              console.log('Promoter promoterId:', promoter.promoterId);
              return event.promoterId === promoter.promoterId;
            }
          });

          return (
            <div
              key={promoter.name}
              onClick={() => handlePromoterClick(promoter)} // Pass the entire promoter object
              onMouseEnter={() => setHoveredCard(promoter.name)}
              onMouseLeave={() => setHoveredCard(null)}
              style={styles.card(
                promoter.isNorCal,
                hoveredCard === promoter.name
              )}
            >
              <h2 style={styles.cardTitle}>{promoter.name}</h2>
              <p style={styles.cardSubText}>
                {promoter.city}, {promoter.state}
              </p>
              <p style={styles.cardSubText}>
                {promoterEvents.length} upcoming events

              </p>
            </div>
          );
        })}
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
        <Calendar />
      </div>
    </div>
  );
};

export default PromoterDashboard;