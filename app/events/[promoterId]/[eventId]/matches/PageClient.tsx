// app/events/[promoterId]/[eventId]/matches/PageClient.tsx
'use client';

import React, { useState } from 'react';


import { RosterFighter, EventType, Bout } from '@/utils/types';
import MatchesDisplay from './MatchesDisplay';
import { useAuth } from '@/context/AuthContext';
import RosterTable from '@/app/events/[promoterId]/[eventId]/admin/RosterTable';
import Header from '@/components/headers/Header';
import { createMatchesFromWeighins } from '@/utils/events/matches';
import { fetchTechboutsBouts, deleteTechboutsMatchesJson } from '@/utils/apiFunctions/techboutsBouts';
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react";
import StatusMessages from '@/components/loading_screens/StatusMessages';



interface PageClientProps {
  eventId: string;
  promoterId: string;
  initialRoster: RosterFighter[];
  bouts: Bout[];
  sanctioning?: string;
  eventData: EventType;
  roster: RosterFighter[];
}


export default function PageClient({
  eventId,
  promoterId,
  eventData,
  bouts: initialBouts,
  roster,

}: PageClientProps) {
  console.log("eventData Page Client", eventData);
  const { isAdmin } = useAuth();
  const [bouts, setBouts] = useState<Bout[]>(initialBouts);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isCreatingMatches, setIsCreatingMatches] = useState(false);


  const refreshBouts = async () => {
    try {
      const updated = await fetchTechboutsBouts(promoterId, eventId);
      setBouts(updated);
    } catch (err) {
      console.error("Failed to refresh bouts", err);
    }
  };


  const handleDeleteMatches = async () => {
    const success = await deleteTechboutsMatchesJson(promoterId, eventId);
    if (success) {
      // Clear the bouts in the UI
      setBouts([]);
    }
  };


  const handleAutoMatch = async () => {
    // Reset status messages and show modal
    setStatusMessages([]);
    setShowStatusModal(true);
    setIsCreatingMatches(true);

    // First add an initial message
    setStatusMessages(["🔍 Starting match creation process..."]);

    // We'll use a set to prevent duplicate messages
    const processedMessages = new Set();

    // Create a wrapper around console.log to capture all logs
    const originalConsoleLog = console.log;
    console.log = function(message, ...args) {
      // Call the original console.log
      originalConsoleLog.apply(console, [message, ...args]);
      
      // If it's a string that looks like one of our status messages and we haven't processed it yet
      if (typeof message === 'string' && 
          (message.includes('🔍') || 
           message.includes('📋') || 
           message.includes('✅') || 
           message.includes('👥') || 
           message.includes('👶') || 
           message.includes('🔄') || 
           message.includes('⚙️') ||
           message.includes('❌')) && 
          !processedMessages.has(message)) {
        
        // Mark this message as processed
        processedMessages.add(message);
        
        // Update the UI
        setStatusMessages(prev => [...prev, message]);
      }
    };

    try {
      // Create a more direct status updater function
      const updateStatus = (message: string) => {
        // Only process if we haven't seen this message
        if (!processedMessages.has(message)) {
          // Log to console (will be captured by our wrapper)
          originalConsoleLog(message);
          
          // Mark this message as processed
          processedMessages.add(message);
          
          // Force an immediate state update
          setStatusMessages(prev => [...prev, message]);
        }
      };

      // Call the match creation function with status updates
      const result = await createMatchesFromWeighins({
        eventId,
        promoterId,
        eventName: eventData.name || '',
        promotionName: eventData.promotionName || '',
        date: eventData.date || '',
        sanctioning: eventData.sanctioning || '',
        setIsCreatingMatches,
        updateStatus,
        saveMatches: true
      });

      // If successful, refresh the bouts display
      if (result && result.success) {
        updateStatus("✅ Successfully created matches! Refreshing display...");
        await refreshBouts();
      } else if (result) {
        updateStatus(`⚠️ ${result.message || "No matches were created"}`);
      } else {
        updateStatus("❌ Function completed but returned no result");
      }
    } catch (error) {
      console.error("Error creating matches:", error);
      setStatusMessages(prev => [...prev, `❌ Unexpected error: ${error instanceof Error ? error.message : String(error)}`]);
    } finally {
      // Restore the original console.log
      console.log = originalConsoleLog;
      setIsCreatingMatches(false);
      // Keep the modal open so user can see all messages
      // They'll need to close it manually
    }
  };

  const closeStatusModal = () => {
    setShowStatusModal(false);
  };


  return (
    <div className="">
      <Header />

      
      {isAdmin && (
             <div style={{ display: 'flex', justifyContent: 'center', margin: '1rem 0', gap:'5px' }}>

        <Button 
            onClick={handleAutoMatch}
            disabled={isCreatingMatches}
        >
          {isCreatingMatches ? "Creating Matches..." : "Auto Match"}
        </Button>

       
          <Button 
            variant="destructive" 
            onClick={handleDeleteMatches}
            className="flex items-center gap-2"
            disabled={isCreatingMatches}
          >
            <Trash2 size={16} />
            Delete Matches
          </Button>

          </div>

        )}

<StatusMessages 
        messages={statusMessages} 
        isVisible={showStatusModal} 
        onClose={closeStatusModal} 
      />
      <MatchesDisplay bouts={bouts} promoterId={promoterId} eventId={eventId} isAdmin={isAdmin} eventData={eventData} />

      <RosterTable promoterId={promoterId} eventId={eventId} roster={roster} eventData={eventData} isAdmin={isAdmin} bouts={bouts} onBoutsRefresh={refreshBouts} />

     
    </div>
  );
}