// app/events/[promoterId]/[eventId]/edit/PageDashboard.tsx
'use client';

import { useState, useEffect } from 'react';
import EditEventForm from './EditEventForm';
import RosterTable from './RosterTable';
import OfficialsEvent from './OfficialsEvent';
import Matches from '../matches/PageClient';
import { EventType } from '@/utils/types';
import { useAuth } from '@/context/AuthContext';
import AuthDisplay from '@/components/ui/AuthDisplay';
import Header from '@/components/headers/Header';
import EmbedMatchesGenerator from '@/components/EmbedMatchesGenerator';

interface Fighter {
  first?: string;
  last?: string;
  gym?: string;
  weightclass?: string | number;
  age?: string | number;
  experience?: string | number;
  status?: string;
  gender: string;
  [key: string]: string | number | undefined;
}

interface PageDashboardProps {
  eventId: string;
  eventData: EventType;
  promoterId: string;
  roster: Fighter[];
}

export default function PageDashboard({ eventData, eventId, promoterId, roster }: PageDashboardProps) {
    const { user, isAdmin } = useAuth();

    const [sanctioningEmail, setSanctioningEmail] = useState<string | null>(null);

    const isPromoter = user?.email === eventData.promoterEmail;
    const [showEmbed, setShowEmbed] = useState(false);


    useEffect(() => {
        if (eventData.sanctioning === 'PMT') {
            setSanctioningEmail('info@pointmuaythaica.com');
        } else if (eventData.sanctioning === 'PBSC') {
            setSanctioningEmail('borntowincsc@gmail.com');
        } else {
            setSanctioningEmail('');
        }
    }, [eventData.sanctioning]);  // ✅ Runs only when eventData.sanctioning changes

    const isSanctioning = user?.email === sanctioningEmail;

    // Check if user is authorized
    const isAuthorized = isAdmin || isPromoter || isSanctioning;
    
    // Return unauthorized message if not authorized
    if (!isAuthorized) {
        return (
            <div className="mx-auto">
                <AuthDisplay 
                    user={user}
                    isAdmin={isAdmin}
                    isPromoter={isPromoter}
                    isNewUser={false}
                />
                
                <div className="mt-12 text-center p-8 bg-gray-50 rounded-lg shadow-sm border border-gray-200 max-w-2xl mx-auto">
                    {/* Lock icon */}
                    <div className="flex justify-center mb-4">
                        <svg 
                            xmlns="http://www.w3.org/2000/svg" 
                            className="h-16 w-16 text-red-500" 
                            fill="none" 
                            viewBox="0 0 24 24" 
                            stroke="currentColor"
                        >
                            <path 
                                strokeLinecap="round" 
                                strokeLinejoin="round" 
                                strokeWidth={2} 
                                d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" 
                            />
                        </svg>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-red-600">Unauthorized Access</h2>
                    <p className="mt-4 text-gray-700">
                        You do not have permission to view or edit this event.
                    </p>
                    <p className="mt-2 text-gray-600">
                        Please contact an administrator if you believe this is an error.
                    </p>
                    
                    <div className="mt-6">
                        <button 
                            onClick={() => window.history.back()} 
                            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-800 rounded transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </div>
        );
    }
  
    // Original content for authorized users
    return (
        <div>
            <Header />
            <AuthDisplay 
                user={user}
                isAdmin={isAdmin}
                isPromoter={isPromoter}
                isNewUser={false}
            />
          
            <div className='mb-6'> 
                <EditEventForm 
                    eventData={eventData}
                    eventId={eventId}
                    promoterId={promoterId}
                />
            </div>
        
            <div>
                <RosterTable 
                    roster={roster}
                    eventId={eventId}
                    promoterId={promoterId}
                />
            </div>


            <div>
                <Matches 
                    initialRoster={roster}
                    eventId={eventId}
                    promoterId={promoterId}
                />
            </div>

            <div className="mt-8">
  <button
    onClick={() => setShowEmbed(prev => !prev)}
    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
  >
    {showEmbed ? 'Hide Embed Code' : 'Embed Matches'}
  </button>

  {showEmbed && (
    <div className="mt-4">
      <EmbedMatchesGenerator 
        eventId={eventId}
        eventName={eventData.name || eventData.event_name || 'Event'}
        promoterId={promoterId}
      />
    </div>
  )}
</div>


            <div className="mt-8 border-t border-gray-200 pt-5">
                <OfficialsEvent
                    eventId={eventId} 
                    numMats={eventData.numMats} 
                    promoterId={eventData.promoterId}
                    sanctioning={eventData.sanctioning}
                    eventName={eventData.event_name}
                    eventDate={eventData.date}
                    eventAddress={eventData.address}
                /> 
            </div>
        </div>
    );
}