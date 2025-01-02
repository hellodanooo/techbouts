'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { Event, PROMOTER_OPTIONS } from '../../utils/types';
import Calendar from './Calendar';
import MonthTable from './MonthTable';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../context/AuthContext';
import { getDatabase, ref, get } from 'firebase/database';
import { FaLock } from "react-icons/fa6";

interface PromoterEvent extends Event {
  parsedDate: Date;
}

interface Props {
  initialConfirmedEvents?: Event[];
  initialPendingEvents?: Event[];
}

const PROMOTER_CITIES: Record<string, string> = {
  'techbouts': 'San Jose',
  'shadowpack': 'Sacramento',
  'legends': 'San Francisco',
  'genx': 'El Cerrito',
  'antdawgs': 'Gilroy',
  'ultamatefitness': 'Sacramento',
  'santacruz': 'Santa Cruz',
  'purist': 'NorCal',
};

const norcalPromoters = new Set([
  'techbouts',
  'shadowpack',
  'legends',
  'genx',
  'antdawgs',
  'ultamatefitness',
  'santacruz',
  'voodoo'
]);

const PromoterDashboard = ({ 
  initialConfirmedEvents = [], 
  initialPendingEvents = [] 
}: Props) => {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const { user } = useAuth();
  const [isPromoter, setIsPromoter] = useState<boolean>(false);


  // Authentication & Authorization
  useEffect(() => {
    const checkAuthorization = async () => {
      if (user?.email) {
        try {
          const db = getDatabase();
          const promoterRef = ref(db, `promoters/techbouts/authorizedEmails`);
          const snapshot = await get(promoterRef);

          if (snapshot.exists()) {
            const authorizedEmails = snapshot.val();
            const isAuthorizedUser = Array.isArray(authorizedEmails) && 
              authorizedEmails.some(email => email.toLowerCase() === user.email?.toLowerCase());
            setIsPromoter(isAuthorizedUser);
            console.log('isAuthorizedUser:', isAuthorizedUser);
          } else {
            setIsPromoter(false);
          }
        } catch (error) {
          console.error('Error checking authorization:', error);
          setIsPromoter(false);
        }
      }
    };

    if (user) {
      checkAuthorization();
    } else {
      setIsPromoter(false);
    }
  }, [user]);


  
  const handleLogin = () => {
    router.push(`/auth/login`);
  };

  const allEvents = useMemo(() => {
    const confirmed = (initialConfirmedEvents || []).map(event => ({
      ...event,
      parsedDate: event.date ? new Date(event.date) : new Date()
    }));
    const pending = (initialPendingEvents || []).map(event => ({
      ...event,
      parsedDate: event.date ? new Date(event.date) : new Date()
    }));
    return [...confirmed, ...pending];
  }, [initialConfirmedEvents, initialPendingEvents]);

  const allPromoters = useMemo(() => {
    return [...PROMOTER_OPTIONS].sort((a, b) => {
      const aInNorcal = norcalPromoters.has(a.toLowerCase());
      const bInNorcal = norcalPromoters.has(b.toLowerCase());

      if (!aInNorcal && !bInNorcal) return 0;
      if (!aInNorcal) return 1;
      if (!bInNorcal) return -1;
      return 0;
    });
  }, []);

  const handlePromoterClick = (promoter: string) => {
    router.push(`/promoter/${promoter}`);
  };

  const promoterEventsMap = useMemo(() => {
    return allPromoters.reduce((map: Record<string, PromoterEvent[]>, promoter) => {
      map[promoter] = allEvents.filter(
        (event) => event.promoterId === promoter
      );
      return map;
    }, {});
  }, [allEvents, allPromoters]);

  const isHighlightedPromoter = (promoter: string): boolean => {
    return norcalPromoters.has(promoter.toLowerCase());
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

  return (
    <div style={styles.container}>
      <h1>Promoter Dashboard</h1>
      {!isPromoter && (
          <button 
            onClick={handleLogin} 
            className="text-gray-500 hover:text-gray-700">
            <FaLock size={20} />
          </button>
        )}
      <div style={styles.grid}>
        {allPromoters.map((promoter) => {
          const promoterEvents = promoterEventsMap[promoter] || [];

          return (
            <div
              key={promoter}
              onClick={() => handlePromoterClick(promoter)}
              onMouseEnter={() => setHoveredCard(promoter)}
              onMouseLeave={() => setHoveredCard(null)}
              style={styles.card(
                isHighlightedPromoter(promoter),
                hoveredCard === promoter
              )}
            >
              <h2 style={styles.cardTitle}>{promoter}</h2>
              <p style={styles.cardSubText}>{PROMOTER_CITIES[promoter]}</p>
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
          initialEvents={initialConfirmedEvents} 
          initialPendingEvents={initialPendingEvents}
          isAuthorized={isPromoter}
        />
        <Calendar />
      </div>
    </div>
  );
};

export default PromoterDashboard;