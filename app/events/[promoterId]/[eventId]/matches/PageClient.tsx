// app/events/[promoterId]/[eventId]/matches/PageClient.tsx
'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { RosterFighter, EventType, Bout } from '@/utils/types';
import MatchesDisplay from './MatchesDisplay';
import { useAuth } from '@/context/AuthContext';
import RosterTable from '@/app/events/[promoterId]/[eventId]/admin/RosterTable';
import Header from '@/components/headers/Header';
import { createMatchesFromWeighins, createMatchesFromWeightclasses } from '@/utils/events/matches';
import { fetchTechboutsBouts, deleteTechboutsMatchesJson } from '@/utils/apiFunctions/techboutsBouts';
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react";
import StatusMessages from '@/components/loading_screens/StatusMessages';
import CreateEditMatches from './CreateEditMatches';
import { fighterClick } from '@/utils/handleFighterClick';
import { handleExportHtml } from '@/utils/events/matches';
import { ClipboardCopy } from "lucide-react";

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
  const { user, isAdmin } = useAuth();
  const router = useRouter();
  const [bouts, setBouts] = useState<Bout[]>(initialBouts);
  const [statusMessages, setStatusMessages] = useState<string[]>([]);
  const [showStatusModal, setShowStatusModal] = useState(false);
  const [isCreatingMatches, setIsCreatingMatches] = useState(false);
  const [sanctioningEmail, setSanctioningEmail] = useState<string | null>(null);
  
  // Lifted state for fighter selection

  
  const [red, setRed] = useState<RosterFighter | null>(null);
const [blue, setBlue] = useState<RosterFighter | null>(null);
const [third, setThird] = useState<RosterFighter | null>(null);
const [fourth, setFourth] = useState<RosterFighter | null>(null);
const [selectedFighter, setSelectedFighter] = useState<RosterFighter | null>(null);

  
  
  const [selectedBout, setSelectedBout] = useState<Bout | null>(null);
  
  const [matchMethod, setMatchMethod] = useState<'weighins' | 'weightclasses'>('weighins');
const [showMatchOptions, setShowMatchOptions] = useState(false);

  // Set up sanctioning email based on event sanctioning body
  useEffect(() => {
    if (eventData.sanctioning === 'PMT') {
      setSanctioningEmail('info@pointmuaythaica.com');
    } else if (eventData.sanctioning === 'PBSC') {
      setSanctioningEmail('borntowincsc@gmail.com');
    } else {
      setSanctioningEmail('');
    }
  }, [eventData.sanctioning]);
  
  // Check authorization statuses
  const isPromoter = user?.email === eventData.promoterEmail;
  const isSanctioning = user?.email === sanctioningEmail;
  const isAuthorized = isAdmin || isPromoter || isSanctioning;
  const isAdminOrSanctioningOrPromoter = isAdmin || isSanctioning || isPromoter;
  
  // Create a shared fighter click handler for all child components
  const handleFighterClick = useMemo(() => {
    return fighterClick(
      isAuthorized,
      router,
      setRed,
      setBlue,
      setThird,
      setFourth,
      setSelectedFighter,
      red,
      blue,
      third,
      fourth
    );
  }, [isAuthorized, router, red, blue, third, fourth]); // Updated dependency array

  const refreshBouts = async () => {
    try {
      // Fetch bouts - they'll be automatically processed by the updated fetchTechboutsBouts function
      const updatedBouts = await fetchTechboutsBouts(promoterId, eventId);
      
      // Simply update the state with the processed bouts
      setBouts(updatedBouts);
      
      // Clear fighter selection states after refresh
      setSelectedFighter(null);
      setRed(null);
      setBlue(null);
      setSelectedBout(null);
      setThird(null);
      setFourth(null);
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
    if (!showMatchOptions) {
      // If options aren't shown yet, show them first
      setShowMatchOptions(true);
      return;
    }
    
    // Reset options display
    setShowMatchOptions(false);
    
    // Reset status messages and show modal
    setStatusMessages([]);
    setShowStatusModal(true);
    setIsCreatingMatches(true);
  
    // First add an initial message
    setStatusMessages([`🔍 Starting match creation process using ${matchMethod}...`]);
  
    const matchedFighterIds = new Set();
    bouts.forEach((bout) => {
      if (bout.red?.fighter_id) matchedFighterIds.add(bout.red.fighter_id);
      if (bout.blue?.fighter_id) matchedFighterIds.add(bout.blue.fighter_id);
    });
  
    // Filter the roster to only include unmatched fighters
    const unmatchedRoster = roster.filter(fighter => 
      !matchedFighterIds.has(fighter.fighter_id)
    );
  
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
  
      // Call the appropriate match creation function based on selected method
      let result;
      if (matchMethod === 'weighins') {
        result = await createMatchesFromWeighins({
          eventId,
          promoterId,
          eventName: eventData.name || '',
          promotionName: eventData.promotionName || '',
          date: eventData.date || '',
          sanctioning: eventData.sanctioning || '',
          setIsCreatingMatches,
          updateStatus,
          saveMatches: true,
          roster: unmatchedRoster,
        });
      } else {
        result = await createMatchesFromWeightclasses({
          eventId,
          promoterId,
          eventName: eventData.name || '',
          promotionName: eventData.promotionName || '',
          date: eventData.date || '',
          sanctioning: eventData.sanctioning || '',
          setIsCreatingMatches,
          updateStatus,
          saveMatches: true,
          roster: unmatchedRoster,
        });
      }
  
      // If successful, refresh the bouts display
      if (result && result.success) {
        updateStatus(`✅ Successfully created matches using ${matchMethod}! Refreshing display...`);
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

  // Handle bout selection
  const handleBoutSelect = (bout: Bout) => {
    if (isAdminOrSanctioningOrPromoter) { // Updated from isAdmin to isAdminOrSanctioningOrPromoter
      setSelectedBout(bout);
      // Clear any fighter selection when selecting a bout
      setSelectedFighter(null);
      setRed(null);
      setBlue(null);
    }
  };

  const handleCloseCreateEditBout = () => {
    setSelectedFighter(null);
    setRed(null);
    setBlue(null);
    setSelectedBout(null);
    refreshBouts();
    setThird(null);
    setFourth(null);
  };

  return (
    <div className="">
      <Header />
      
      <div className="bg-gray-100 p-2 rounded mb-4 flex justify-center">
        {isAdminOrSanctioningOrPromoter && (
          <div className="text-sm text-gray-700">
            {isSanctioning ? 'Sanctioning Access Enabled' : 
             isPromoter ? 'Promoter Access Enabled' : 
             'Admin Access Enabled'}
          </div>
        )}
      </div>
      



   {isAdminOrSanctioningOrPromoter && (
  <div className="flex flex-wrap justify-center gap-2 mx-2 my-4">
    
    {showMatchOptions ? (
  <div className="bg-gray-50 p-4 rounded-lg border shadow-sm max-w-xl mx-auto my-4">
    <div className="mb-3 text-center">
      <h3 className="text-sm font-medium text-gray-700">1. Select matching method:</h3>
      <div className="flex justify-center gap-3 mt-2">
        <Button 
          variant={matchMethod === 'weighins' ? 'default' : 'outline'}
          onClick={() => setMatchMethod('weighins')}
          disabled={isCreatingMatches}
          className="flex-1 max-w-[150px]"
          size="sm"
        >
          <span>Use Weighins</span>
        </Button>
        
        <Button 
          variant={matchMethod === 'weightclasses' ? 'default' : 'outline'}
          onClick={() => setMatchMethod('weightclasses')}
          disabled={isCreatingMatches}
          className="flex-1 max-w-[150px]"
          size="sm"
        >
          <span>Use Weightclasses</span>
        </Button>
      </div>
    </div>
    
    <div className="text-center">
      <h3 className="text-sm font-medium text-gray-700 mb-2">2. Create matches:</h3>
      <div className="flex justify-center gap-3">
        <Button 
          onClick={handleAutoMatch}
          disabled={isCreatingMatches}
          size="sm"
          className="flex-1 max-w-[150px]"
        >
          {isCreatingMatches ? "Creating..." : "Create Matches"}
        </Button>
        
        <Button 
          variant="outline" 
          onClick={() => setShowMatchOptions(false)}
          disabled={isCreatingMatches}
          size="sm"
          className="flex-1 max-w-[150px]"
        >
          Cancel
        </Button>
      </div>
    </div>
  </div>
) : (
  <Button 
    onClick={handleAutoMatch}
    disabled={isCreatingMatches}
    size="sm"
  >
    {isCreatingMatches ? "Creating..." : "Auto Match"}
  </Button>
)}
        
    <Button
      variant="outline"
      onClick={() => handleExportHtml(bouts, eventData)}
      className="flex items-center gap-1"
      disabled={isCreatingMatches}
      size="sm"
    >
      <ClipboardCopy size={14} />
      Copy HTML
    </Button>

    <Button 
      variant="destructive" 
      onClick={handleDeleteMatches}
      className="flex items-center gap-1"
      disabled={isCreatingMatches}
      size="sm"
    >
      <Trash2 size={14} />
      Delete Matches
    </Button>
  </div>
)}




      <StatusMessages 
        messages={statusMessages} 
        isVisible={showStatusModal} 
        onClose={closeStatusModal} 
      />
      
      <MatchesDisplay 
        bouts={bouts} 
        promoterId={promoterId} 
        eventId={eventId} 
        isAdmin={isAdminOrSanctioningOrPromoter} // Updated from isAdmin to isAdminOrSanctioningOrPromoter
        eventData={eventData}
        // Pass down the shared state and handlers
        handleFighterClick={handleFighterClick}
        onBoutSelect={handleBoutSelect}
      />

      <RosterTable 
        promoterId={promoterId} 
        eventId={eventId} 
        roster={roster} 
        eventData={eventData} 
        isAdmin={isAdminOrSanctioningOrPromoter} // Updated from isAdmin to isAdminOrSanctioningOrPromoter
        bouts={bouts}
        // Pass down the shared state and handlers 
        handleFighterClick={handleFighterClick}
        onBoutsRefresh={refreshBouts}
      />
      
      {/* Add the CreateEditBout here at the parent level */}
      {isAdminOrSanctioningOrPromoter && (selectedFighter || selectedBout) && ( // Updated from isAdmin to isAdminOrSanctioningOrPromoter
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h2 className="text-lg font-semibold mb-2">
            {selectedBout ? "Edit Bout" : "Create New Bout"}
          </h2>
          <CreateEditMatches
      roster={roster}
      promoterId={promoterId}
      eventId={eventId}
      isAdmin={isAdminOrSanctioningOrPromoter}
      red={selectedBout ? selectedBout.red : red}
      blue={selectedBout ? selectedBout.blue : blue}
      third={third}               
      fourth={fourth}              
      weightclass={(selectedBout?.weightclass || selectedFighter?.weightclass || 0)}
      setWeightclass={() => {}}
      bout_ruleset={selectedBout?.bout_ruleset || "MT"}
      setBoutRuleset={() => {}}
      boutConfirmed={selectedBout ? true : false}
      setBoutConfirmed={() => {}}
      isCreatingMatch={false}
      setRed={setRed}
      setBlue={setBlue}
      setThird={setThird}         
      setFourth={setFourth}      
      setIsCreatingMatch={() => {}}
      eventData={eventData}
      action={selectedBout ? "edit" : "create"}
      existingBoutId={selectedBout?.boutId}
      existingBouts={bouts}
      onClose={handleCloseCreateEditBout}
      sanctioning={eventData.sanctioning}
    />
        </div>
      )}
    </div>
  );
}