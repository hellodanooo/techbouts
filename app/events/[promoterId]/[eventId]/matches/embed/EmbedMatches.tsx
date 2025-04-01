'use client';

import { useEffect } from 'react';
import MatchesDisplay from '../MatchesDisplay';
import { EventType } from '@/utils/types';

import { Bout } from '@/utils/types';

type Props = {
    eventId: string;
    promoterId: string;
    eventData: EventType | null;
    bouts: Bout[];
    isAdmin: boolean;
  };
  



export default function EmbedMatchesPage({ eventId, promoterId, bouts, eventData, isAdmin=false }: Props) {


  useEffect(() => {
    if (!eventData?.promoterId || !eventId) return;

    const adjustHeight = () => {
      if (window.self !== window.top) {
        const newHeight = document.body.scrollHeight;
        window.parent.postMessage({
          type: 'MATCHES_IFRAME_HEIGHT',
          height: newHeight,
          eventId
        }, '*');
      }
    };

    adjustHeight();
    const heightInterval = setInterval(adjustHeight, 500);

    if (window.self !== window.top) {
      window.parent.postMessage({
        type: 'MATCHES_IFRAME_READY',
        eventId,
        eventName: eventData?.name || 'Event'
      }, '*');
    }

    return () => clearInterval(heightInterval);
  }, [eventId, eventData]);

  if (!eventData || !promoterId) {
    return (
      <div className="p-4 text-center">
        <p className="text-gray-500">Loading event data...</p>
      </div>
    );
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h2 className="text-xl font-semibold mb-4">{eventData.name} Matches</h2>
      <MatchesDisplay promoterId={promoterId} eventId={eventId} bouts={bouts} isAdmin={isAdmin} eventData={eventData} />
      </div>
  );
}
