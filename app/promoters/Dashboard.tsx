'use client';

import React, { useState, useMemo } from 'react';
import { EventType, Promoter } from '../../utils/types';
import Calendar from './Calendar';
import MonthTable from '../../components/MonthTable';
import { useRouter } from 'next/navigation';
import AddPromoter from '@/components/AddPromoter';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';
import Image from 'next/image';

interface Props {
  initialConfirmedEvents?: EventType[];
  initialPendingEvents?: EventType[];
  allTechBoutsEvents: EventType[];
  techBoutsPromoters?: Promoter[];
  pmtPromoters?: Promoter[];
}

const NORCAL_CITIES = new Set([
  'sacramento', 'san francisco', 'oakland', 'san jose', 'santa cruz',
  'gilroy', 'berkeley', 'el cerrito', 'mountain view', 'palo alto',
  'fremont', 'hayward', 'vallejo', 'santa rosa', 'modesto',
  'stockton', 'fresno', 'redding', 'chico'
]);

const isNorCalLocation = (city: string, state: string): boolean => {
  const normalizedCity = city.toLowerCase().trim();
  if (state.toLowerCase() !== 'ca' && state.toLowerCase() !== 'california') {
    return false;
  }
  if (NORCAL_CITIES.has(normalizedCity)) {
    return true;
  }
  return normalizedCity.includes('bay area') ||
    normalizedCity.includes('northern california') ||
    normalizedCity.includes('norcal');
};

const PromoterDashboard = ({
  initialConfirmedEvents = [],
  initialPendingEvents = [],
  allTechBoutsEvents = [],
  techBoutsPromoters = [],
  pmtPromoters = [],
}: Props) => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [activeSanctioning, setActiveSanctioning] = useState<'ALL' | 'PMT' | 'IKF' | 'PBSC'>('ALL');
  const [showPromoterModal, setShowPromoterModal] = useState(false);
  const { user, isAdmin, isPromoter, isNewUser } = useAuth();

  const activePromoters = useMemo(() => {

    const promoterMap = new Map<string, Promoter>();
    
    // Helper function to add promoter to map, merging sanctioning if exists
    const addPromoter = (promoter: Promoter, sanctioningType: 'PMT' | 'IKF' | 'PBSC') => {
      const existing = promoterMap.get(promoter.promoterId);
      if (existing) {
        // If promoter already exists, just ensure the sanctioning type is included
        if (!existing.sanctioning.includes(sanctioningType)) {
          existing.sanctioning.push(sanctioningType);
        }
      } else {
        // If new promoter, add to map
        promoterMap.set(promoter.promoterId, {
          ...promoter,
          sanctioning: [sanctioningType]
        });
      }
    };

    // Add promoters based on active sanctioning
    switch (activeSanctioning) {
      case 'PMT':
        pmtPromoters.forEach(p => addPromoter(p, 'PMT'));
        break;
      case 'IKF':
        techBoutsPromoters.forEach(p => addPromoter(p, 'IKF'));
        break;
      case 'PBSC':
        // Filter PBSC promoters from allTechBoutsEvents
        const pbscPromoterIds = new Set(
          allTechBoutsEvents
            .filter(event => event.sanctioning === 'PBSC')
            .map(event => event.promoterId)
        );
        Array.from(pbscPromoterIds).forEach(promoterId => {
          const event = allTechBoutsEvents.find(e => e.promoterId === promoterId && e.sanctioning === 'PBSC');
          if (event) {
            addPromoter({
              promoterId: event.promoterId,
              name: event.promotionName || 'Unknown Promoter',
              sanctioning: ['PBSC'],
              city: event.city || '',
              state: event.state || '',
              email: '',
              firstName: '',
              lastName: '',
              phone: '',
              promotionName: event.promotionName || ''
            }, 'PBSC');
          }
        });
        break;
      case 'ALL':
        pmtPromoters.forEach(p => addPromoter(p, 'PMT'));
        techBoutsPromoters.forEach(p => addPromoter(p, 'IKF'));
        // Add PBSC promoters from events
        const allPbscPromoterIds = new Set(
          allTechBoutsEvents
            .filter(event => event.sanctioning === 'PBSC')
            .map(event => event.promoterId)
        );
        Array.from(allPbscPromoterIds).forEach(promoterId => {
          const event = allTechBoutsEvents.find(e => e.promoterId === promoterId && e.sanctioning === 'PBSC');
          if (event) {
            addPromoter({
              promoterId: event.promoterId,
              name: event.promotionName || 'Unknown Promoter',
              sanctioning: ['PBSC'],
              city: event.city || '',
              state: event.state || '',
              email: '',
              firstName: '',
              lastName: '',
              phone: '',
              promotionName: event.promotionName || ''
            }, 'PBSC');
          }
        });
        break;
    }

    // Convert map values to array and add isNorCal property
    return Array.from(promoterMap.values())
      .map(promoter => ({
        ...promoter,
        isNorCal: promoter.sanctioning.includes('PMT') ?
          isNorCalLocation(promoter.city, promoter.state) :
          false
      }))
      .sort((a, b) => {
        if (a.isNorCal && !b.isNorCal) return -1;
        if (!a.isNorCal && b.isNorCal) return 1;
        return a.name.localeCompare(b.name);
      });
  }, [activeSanctioning, pmtPromoters, techBoutsPromoters, allTechBoutsEvents]);

  const activeEvents = useMemo(() => {
    const ikfEvents = allTechBoutsEvents.filter(event => event.sanctioning === 'IKF');
    const pbscEvents = allTechBoutsEvents.filter(event => event.sanctioning === 'PBSC');

    // Helper function to map events and ensure sanctioning
    const mapEvents = (events: EventType[], sanctioning: string, isConfirmed?: boolean) => {
      return events.map(event => ({
        ...event,
        uniqueId: isConfirmed !== undefined ? 
          `${isConfirmed ? 'confirmed' : 'pending'}_${event.eventId}` : 
          `${sanctioning.toLowerCase()}_${event.eventId}`,
        sanctioning
      }));
    };

    switch (activeSanctioning) {
      case 'PMT':
        return [
          ...mapEvents(initialConfirmedEvents, 'PMT', true),
          ...mapEvents(initialPendingEvents, 'PMT', false)
        ];
      case 'IKF':
        return mapEvents(ikfEvents, 'IKF');
      case 'PBSC':
        return mapEvents(pbscEvents, 'PBSC');
      case 'ALL':
        return [
          ...mapEvents(initialConfirmedEvents, 'PMT', true),
          ...mapEvents(initialPendingEvents, 'PMT', false),
          ...mapEvents(ikfEvents, 'IKF'),
          ...mapEvents(pbscEvents, 'PBSC')
        ];
      default:
        return [];
    }
  }, [activeSanctioning, initialConfirmedEvents, initialPendingEvents, allTechBoutsEvents]);

  const handlePromoterClick = (promoter: Promoter) => {
    const routePrefix = '/promoters/';
    const promoterId = promoter.sanctioning.includes('PMT') ? 
      promoter.promoterId.toLowerCase() : 
      promoter.promoterId;
    router.push(`${routePrefix}${promoterId}`);
  };

  const toggleButton = (isActive: boolean) => ({
    padding: '8px 16px',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: isActive ? '#fee2e2' : '#f3f4f6',
    cursor: 'pointer',
    fontWeight: isActive ? '600' : '400',
    transition: 'all 0.2s ease',
  });

  const styles = {
    container: {
      maxWidth: '1200px',
      margin: '0 auto',
      padding: '20px',
      display: 'flex',
      flexDirection: 'column' as const,
      gap: '40px',
    },
    toggleButtons: {
      display: 'flex',
      gap: '10px',
      marginBottom: '20px',
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
      boxShadow: isHovered ? '0 4px 6px rgba(0, 0, 0, 0.1)' : '0 1px 3px rgba(0, 0, 0, 0.1)',
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
        <div style={{ width: '50%' }}>
          <div>Admin Enabled</div>
          <button
            className="mt-2 px-4 py-2 bg-green-500 text-white rounded"
            onClick={() => setShowPromoterModal(true)}
          >
            Add Promoter
          </button>
        </div>
      )}

      {showPromoterModal && (
        <AddPromoter
          onClose={() => setShowPromoterModal(false)}
          isAdmin={isAdmin}
        />
      )}

      <div style={styles.toggleButtons}>
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

      <div style={styles.grid}>
        {activePromoters.map((promoter) => {
          const promoterEvents = activeEvents.filter(event => 
            event.promoterId === (promoter.sanctioning.includes('PMT') ? 
              promoter.promoterId.toLowerCase() : 
              promoter.promoterId
            )
          );

          return (
            <div
              key={promoter.promoterId}
              onClick={() => handlePromoterClick(promoter)}
              onMouseEnter={() => setHoveredCard(promoter.name)}
              onMouseLeave={() => setHoveredCard(null)}
              style={styles.card(promoter.isNorCal, hoveredCard === promoter.name)}
            >
              {promoter.logo ? (
                <Image
                  src={promoter.logo}
                  alt={promoter.name}
                  width={150}
                  height={150}
                  className="rounded-full object-cover"
                />
              ) : (
                <div className="w-[150px] h-[150px] bg-gray-200 rounded-full flex items-center justify-center">
                  <span className="text-gray-400 text-lg">
                    {promoter.name?.charAt(0)?.toUpperCase() || 'P'}
                  </span>
                </div>
              )}
              <h2 style={styles.cardTitle}>{promoter.name}</h2>
              <p style={styles.cardSubText}>
                {promoter.city}, {promoter.state}
              </p>
              <p style={styles.cardSubText}>
                {promoterEvents.length} upcoming events
              </p>
              <p style={styles.cardSubText}>
                {promoter.sanctioning.join(', ')}
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