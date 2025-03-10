'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { addDoc, updateDoc, doc, getDoc, collection } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { Promoter, BoutData, FullContactFighter } from '@/utils/types'; 
import { handleSearch } from '@/utils/scrape/scrapeBout';
import FighterSearch from '@/components/searchbars/FighterSearch';



//import GymSearch from '@/components/searchbars/GymSearch'; // You'll need to create/import this component



interface FightVerification extends SearchResults {
  resultVerified: boolean;
  verificationReason?: string;
  detectedResult?: {
    winner?: string;
    method?: string;
  };
}

interface BoutSearchProps {
  firstName: string;
  lastName: string;
  fighterId: string;
}

interface SearchResults {
  fighterName: boolean;
  opponentName: boolean;
  date: boolean;
  promotionName: boolean;
  sanctioningBody: boolean;
}

interface Fighter {
  fighterId: string;
  firstName: string;
  lastName: string;
  photo?: string;
}

interface Gym {
  gymId: string;
  gymName: string;
  logo?: string;
}

const BoutSearch: React.FC<BoutSearchProps> = ({ firstName, lastName, fighterId }) => {
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [opponentFirstName, setOpponentFirstName] = useState('');
  const [opponentLastName, setOpponentLastName] = useState('');
  const [sanctioningBody, setSanctioningBody] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [redResult, setRedResult] = useState<'W' | 'L' | 'NC' | 'DQ' | 'DRAW'>('W');
  const [blueResult, setBlueResult] = useState<'W' | 'L' | 'NC' | 'DQ' | 'DRAW'>('L');
  const [searchResults, setSearchResults] = useState<FightVerification | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<string[]>([]);
  const [showScrapeDetails, setShowScrapeDetails] = useState(false);
  const [promotionName, setPromotionName] = useState('');
  const [promotionNameInput, setPromotionNameInput] = useState('');
  const [promotionResults, setPromotionResults] = useState<Promoter[]>([]);
  const [showPromotionDropdown, setShowPromotionDropdown] = useState(false);
  const [promotionId, setPromotionId] = useState('');
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [blueCornerId, setBlueCornerId] = useState('');
  
  // New fields from BoutData interface
  const [redGymId, setRedGymId] = useState('');
  const [blueGymId, setBlueGymId] = useState('');
  const [redGymName, setRedGymName] = useState('');
  const [blueGymName, setBlueGymName] = useState('');
  const [redFighterPhoto, setRedFighterPhoto] = useState('');
  const [blueFighterPhoto, setBlueFighterPhoto] = useState('');
  const [redGymLogo, setRedGymLogo] = useState('');
  const [blueGymLogo, setBlueGymLogo] = useState('');
  
  // Add state for selected opponent
  const [selectedOpponent, setSelectedOpponent] = useState<Fighter | null>(null);
  const [showManualOpponentInput, setShowManualOpponentInput] = useState(true);

  // Add state for selected gyms
  const [selectedRedGym, setSelectedRedGym] = useState<Gym | null>(null);
  const [selectedBlueGym, setSelectedBlueGym] = useState<Gym | null>(null);
  const [showManualRedGymInput, setShowManualRedGymInput] = useState(true);
  const [showManualBlueGymInput, setShowManualBlueGymInput] = useState(true);

  // Function to handle when an opponent is selected from FighterSearch
  const handleOpponentSelect = (fighter: FullContactFighter) => {
    setSelectedOpponent({
      fighterId: fighter.fighter_id,
      firstName: fighter.first,
      lastName: fighter.last,
      photo: fighter.photo || ''
    });
    setOpponentFirstName(fighter.first);
    setOpponentLastName(fighter.last);
    setBlueCornerId(fighter.fighter_id);
    setBlueFighterPhoto(fighter.photo || '');
    setShowManualOpponentInput(false);
  };



 
  // Function to toggle between fighter search and manual input
  const toggleOpponentInput = () => {
    setShowManualOpponentInput(!showManualOpponentInput);
    if (showManualOpponentInput) {
      // Switching to fighter search, clear manual inputs
      setOpponentFirstName('');
      setOpponentLastName('');
    } else {
      // Switching to manual input, clear selected fighter
      setSelectedOpponent(null);
      setBlueCornerId('');
      setBlueFighterPhoto('');
    }
  };

  // Function to toggle red gym input methods
  const toggleRedGymInput = () => {
    setShowManualRedGymInput(!showManualRedGymInput);
    if (showManualRedGymInput) {
      setRedGymName('');
    } else {
      setSelectedRedGym(null);
      setRedGymId('');
      setRedGymLogo('');
    }
  };

  // Function to toggle blue gym input methods
  const toggleBlueGymInput = () => {
    setShowManualBlueGymInput(!showManualBlueGymInput);
    if (showManualBlueGymInput) {
      setBlueGymName('');
    } else {
      setSelectedBlueGym(null);
      setBlueGymId('');
      setBlueGymLogo('');
    }
  };

  const searchPromotions = async (searchText: string) => {
    if (searchText.length < 3) {
      setPromotionResults([]);
      setShowPromotionDropdown(false);
      return;
    }

    setIsLoadingPromotions(true);
    try {
      // Fetch all promoters
      const response = await fetch('/api/promoters');
      if (!response.ok) {
        throw new Error('Failed to fetch promoters');
      }
      
      const data = await response.json();
      
      // Filter promoters that match the search text
      const filteredPromoters = data.promoters.filter((promoter: Promoter) => 
        promoter.promotionName?.toLowerCase().includes(searchText.toLowerCase())
      );
      
      setPromotionResults(filteredPromoters);
      setShowPromotionDropdown(filteredPromoters.length > 0);
    } catch (error) {
      console.error('Error searching promotions:', error);
      setPromotionResults([]);
    } finally {
      setIsLoadingPromotions(false);
    }
  };

  // Handle input change for promotion name
  const handlePromotionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPromotionNameInput(value);
    setPromotionName(value); // Also update the actual promotion name
    
    // Reset promotionId if the input is cleared
    if (value === '') {
      setPromotionId('');
    }
    
    // Search promotions when input length is >= 3
    if (value.length >= 3) {
      searchPromotions(value);
    } else {
      setPromotionResults([]);
      setShowPromotionDropdown(false);
    }
  };

  // Handle promotion selection
  const handleSelectPromotion = (promoter: Promoter) => {
    setPromotionName(promoter.promotionName);
    setPromotionNameInput(promoter.promotionName);
    setPromotionId(promoter.promoterId);
    setShowPromotionDropdown(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setShowPromotionDropdown(false);
    };

    document.addEventListener('click', handleClickOutside);
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    if (promotionName && !promotionId) {
      // Create a promotionId based on the name (removing spaces and lowercase)
      const generatedId = promotionName.toLowerCase().replace(/\s+/g, '');
      setPromotionId(generatedId);
    }
  }, [promotionName, promotionId]);

  // Set the opposite result when one result is selected
  useEffect(() => {
    if (redResult === 'W') setBlueResult('L');
    else if (redResult === 'L') setBlueResult('W');
    else if (redResult === 'DRAW') setBlueResult('DRAW');
    else if (redResult === 'NC') setBlueResult('NC');
    else if (redResult === 'DQ') setBlueResult('DQ');
  }, [redResult]);



  const saveBoutData = async (boutData: BoutData) => {
    setIsSaving(true);
    setSaveMessage(null);

    // If no opponent is selected from search, create a generated ID
    if (!selectedOpponent && opponentFirstName && opponentLastName) {
      const generatedOpponentId = `${opponentFirstName}${opponentLastName}`.toUpperCase();
      setBlueCornerId(generatedOpponentId);
      boutData.blueCornerId = generatedOpponentId;
    } else if (selectedOpponent) {
      boutData.blueCornerId = selectedOpponent.fighterId;
    }

    try {
      // Add the bout document to the "techbouts_verified_bouts" collection
      const boutCollectionRef = collection(db, 'techbouts_verified_bouts');
      
      // Add the document and get the reference
      const newBoutDocRef = await addDoc(boutCollectionRef, boutData);
      
      // Optionally, you might want to add a reference to this bout in the fighter's document
      // This allows quick access to a fighter's bouts without needing to query the entire collection
      const fighterRef = doc(db, 'techbouts_fighters', fighterId);
      const fighterDoc = await getDoc(fighterRef);
      
      if (fighterDoc.exists()) {
        // Add the new bout ID to the fighter's bout references
        const boutRefs = fighterDoc.data().boutRefs || [];
        await updateDoc(fighterRef, {
          boutRefs: [...boutRefs, newBoutDocRef.id]
        });
      }

      // If we have an opponent ID (either from search or generated), also update their document
      if (boutData.blueCornerId) {
        try {
          const opponentRef = doc(db, 'techbouts_fighters', boutData.blueCornerId);
          const opponentDoc = await getDoc(opponentRef);
          
          if (opponentDoc.exists()) {
            // Add the new bout ID to the opponent's bout references
            const boutRefs = opponentDoc.data().boutRefs || [];
            await updateDoc(opponentRef, {
              boutRefs: [...boutRefs, newBoutDocRef.id]
            });
          }
        } catch (error) {
          console.log('Opponent document may not exist yet, skipping reference update', error);
        }
      }

      setSaveMessage('Bout data saved successfully!');

      // Clear form after successful save
      resetForm();
      
    } catch (error) {
      console.error('Error saving bout data:', error);
      setSaveMessage('Error saving bout data. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const resetForm = () => {
    setUrl('');
    setDate('');
    setOpponentFirstName('');
    setOpponentLastName('');
    setPromotionName('');
    setSanctioningBody('');
    setSearchResults(null);
    setRedResult('W');
    setBlueResult('L');
    setPromotionId('');
    setSelectedOpponent(null);
    setShowManualOpponentInput(true);
    setRedGymId('');
    setBlueGymId('');
    setRedGymName('');
    setBlueGymName('');
    setRedFighterPhoto('');
    setBlueFighterPhoto('');
    setRedGymLogo('');
    setBlueGymLogo('');
    setSelectedRedGym(null);
    setSelectedBlueGym(null);
    setShowManualRedGymInput(true);
    setShowManualBlueGymInput(true);
  };





  const constructBoutData = (
    url: string,
    searchResults: SearchResults & { resultVerified: boolean },
    inputDate: string
  ): BoutData => {
  
   
  

    return {
      // Fighter information
      redCornerId: fighterId,
      redFighterName: `${firstName} ${lastName}`,
      blueFighterName: `${opponentFirstName} ${opponentLastName}`,
      opponentName: `${opponentFirstName} ${opponentLastName}`,
      
      // Bout details
      url: url,
      date: inputDate,
      redResult: redResult,
      blueResult: blueResult,
      promotionName: promotionName,
      sanctioningBody: sanctioningBody,
      
      // Gym information
      redGymId: redGymId,
      blueGymId: blueGymId,
      redGymName: redGymName,
      blueGymName: blueGymName,
      
      // Media
      redFighterPhoto: redFighterPhoto,
      blueFighterPhoto: blueFighterPhoto,
      redGymLogo: redGymLogo,
      blueGymLogo: blueGymLogo,
      
      // IDs for relationships
      blueCornerId: blueCornerId,
      
      // Verification fields
      namePresent: searchResults.fighterName,
      datePresent: searchResults.date,
      promotionPresent: searchResults.promotionName,
      sanctioningPresent: searchResults.sanctioningBody,
      opponentPresent: searchResults.opponentName,
      resultVerified: searchResults.resultVerified,
      
      // Additional metadata
      timestamp: new Date().toISOString(),
      inputDate: inputDate,
      inputOpponentFirst: opponentFirstName,
      inputOpponentLast: opponentLastName
    };
  };




  const addScrapeStatus = (message: string) => {
    setScrapeStatus(prev => [...prev, message]);
  };

  const handleSearchClick = () => {
    const searchParams = {
      url,
      firstName,
      lastName,
      opponentFirstName,
      opponentLastName,
      date,
      promotionName,
      sanctioningBody,
      result: redResult // Use redResult for verification
    };

    const callbacks = {
      setIsSearching,
      setSearchResults,
      addScrapeStatus
    };

    handleSearch(searchParams, callbacks);
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="md:col-span-2">
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Enter URL to search"
            className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
            required
          />
        </div>
  
        <div>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            placeholder="Enter Date"
            className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
            required
          />
        </div>
  
        <select
          value={redResult}
          onChange={(e) => setRedResult(e.target.value as 'W' | 'L' | 'NC' | 'DQ' | 'DRAW')}
          className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
          required
        >
          <option value="W">Win (Red Corner)</option>
          <option value="L">Loss (Red Corner)</option>
          <option value="NC">No Contest</option>
          <option value="DQ">Disqualification</option>
          <option value="DRAW">Draw</option>
        </select>
  
        {/* Opponent Selection Section */}
        <div className="md:col-span-2 p-4 border border-[#d4c5b1] rounded-lg bg-[#f8f5f0]">
          <div className="flex justify-start items-center mb-3">
            <h3 className="font-medium">Opponent Information (Blue Corner)</h3>
            <button 
              type="button"
              onClick={toggleOpponentInput}
              className="text-sm text-[#8B7355] hover:underline ml-10"
            >
              {showManualOpponentInput ? "Search For Opponent" : "Enter Manually"}
            </button>
          </div>
          
          {showManualOpponentInput ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <input
                  type="text"
                  value={opponentFirstName}
                  onChange={(e) => setOpponentFirstName(e.target.value)}
                  placeholder="Opponent First Name"
                  className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
                  required
                />
              </div>
              <div>
                <input
                  type="text"
                  value={opponentLastName}
                  onChange={(e) => setOpponentLastName(e.target.value)}
                  placeholder="Opponent Last Name"
                  className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
                  required
                />
              </div>
              <div className="md:col-span-2">
                <input
                  type="url"
                  value={blueFighterPhoto}
                  onChange={(e) => setBlueFighterPhoto(e.target.value)}
                  placeholder="Opponent Photo URL (optional)"
                  className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
                />
              </div>
            </div>
          ) : (
            <div>
<FighterSearch onFighterSelect={handleOpponentSelect} />

{selectedOpponent && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium">Selected: {selectedOpponent.firstName} {selectedOpponent.lastName}</p>
                  <p className="text-xs text-gray-600">Fighter ID: {selectedOpponent.fighterId}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Red Gym Section */}
        <div className="p-4 border border-[#d4c5b1] rounded-lg bg-[#f8f5f0]">
          <div className="flex justify-start items-center mb-3">
            <h3 className="font-medium">Red Corner Gym</h3>
            <button 
              type="button"
              onClick={toggleRedGymInput}
              className="text-sm text-[#8B7355] hover:underline ml-10"
            >
              {showManualRedGymInput ? "Search For Gym" : "Enter Manually"}
            </button>
          </div>
          
          {showManualRedGymInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={redGymName}
                onChange={(e) => setRedGymName(e.target.value)}
                placeholder="Red Corner Gym Name"
                className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
              />
              <input
                type="url"
                value={redGymLogo}
                onChange={(e) => setRedGymLogo(e.target.value)}
                placeholder="Red Gym Logo URL (optional)"
                className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
              />
            </div>
          ) : (
            <div>
              {/* Replace with your GymSearch component once created */}
              <p className="text-sm text-gray-500">GymSearch component here</p>
              {selectedRedGym && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium">Selected: {selectedRedGym.gymName}</p>
                  <p className="text-xs text-gray-600">Gym ID: {selectedRedGym.gymId}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Blue Gym Section */}
        <div className="p-4 border border-[#d4c5b1] rounded-lg bg-[#f8f5f0]">
          <div className="flex justify-start items-center mb-3">
            <h3 className="font-medium">Blue Corner Gym</h3>
            <button 
              type="button"
              onClick={toggleBlueGymInput}
              className="text-sm text-[#8B7355] hover:underline ml-10"
            >
              {showManualBlueGymInput ? "Search For Gym" : "Enter Manually"}
            </button>
          </div>
          
          {showManualBlueGymInput ? (
            <div className="space-y-3">
              <input
                type="text"
                value={blueGymName}
                onChange={(e) => setBlueGymName(e.target.value)}
                placeholder="Blue Corner Gym Name"
                className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
              />
              <input
                type="url"
                value={blueGymLogo}
                onChange={(e) => setBlueGymLogo(e.target.value)}
                placeholder="Blue Gym Logo URL (optional)"
                className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
              />
            </div>
          ) : (
            <div>
              {/* Replace with your GymSearch component once created */}
              <p className="text-sm text-gray-500">GymSearch component here</p>
              {selectedBlueGym && (
                <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium">Selected: {selectedBlueGym.gymName}</p>
                  <p className="text-xs text-gray-600">Gym ID: {selectedBlueGym.gymId}</p>
                </div>
              )}
            </div>
          )}
        </div>
  
        <div className="relative">
          <input
            type="text"
            value={promotionNameInput}
            onChange={handlePromotionInputChange}
            placeholder="Promotion Name"
            className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
            required
            onClick={(e) => {
              e.stopPropagation();
              if (promotionNameInput.length >= 3) {
                setShowPromotionDropdown(promotionResults.length > 0);
              }
            }}
          />
          
          {showPromotionDropdown && (
            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
              {isLoadingPromotions ? (
                <div className="p-2 text-center text-gray-500">Loading...</div>
              ) : promotionResults.length === 0 ? (
                <div className="p-2 text-center text-gray-500">No promotions found</div>
              ) : (
                promotionResults.map((promoter) => (
                  <div
                    key={promoter.promoterId}
                    className="p-2 hover:bg-gray-100 cursor-pointer flex items-center"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelectPromotion(promoter);
                    }}
                  >
                    {promoter.logo && (
                      <img src={promoter.logo} alt="" className="w-6 h-6 mr-2 rounded-full" />
                    )}
                    <span>{promoter.promotionName}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </div>
        
        <div>
          <input
            type="text"
            value={sanctioningBody}
            onChange={(e) => setSanctioningBody(e.target.value)}
            placeholder="Sanctioning Body"
            className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
            required
          />
        </div>

        {/* Red Fighter Photo */}
        <div>
          <input
            type="url"
            value={redFighterPhoto}
            onChange={(e) => setRedFighterPhoto(e.target.value)}
            placeholder="Red Fighter Photo URL (optional)"
            className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
          />
        </div>
      </div>
  
      <button
        onClick={handleSearchClick}
        disabled={isSearching || !url || !date || (!selectedOpponent && (!opponentFirstName || !opponentLastName))}
        className="w-full px-6 py-3 bg-[#8B7355] text-white rounded-lg hover:bg-[#7a654b] disabled:bg-[#c4b5a1] disabled:cursor-not-allowed transition-colors"
      >
        {isSearching ? 'Searching...' : 'Verify Bout Data'}
      </button>

      {isSearching && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow border border-[#d4c5b1]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Scraper Status</h3>
            <div className="flex items-center">
              <div className="animate-spin mr-2 h-4 w-4 border-t-2 border-[#8B7355] border-r-2 rounded-full"></div>
              <span className="text-sm text-gray-600">Processing...</span>
            </div>
          </div>
          <div className="space-y-1 text-sm">
            {scrapeStatus.map((status, index) => (
              <div 
                key={index} 
                className={`py-1 ${
                  status.includes('✅') 
                    ? 'text-green-600' 
                    : status.includes('❌') 
                      ? 'text-red-600' 
                      : 'text-gray-600'
                }`}
              >
                {status}
              </div>
            ))}
          </div>
        </div>
      )}

      {!isSearching && scrapeStatus.length > 0 && !searchResults && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow border border-[#d4c5b1]">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Scraper Results</h3>
            <button 
              onClick={() => setShowScrapeDetails(!showScrapeDetails)}
              className="text-sm text-[#8B7355] hover:underline"
            >
              {showScrapeDetails ? 'Hide Details' : 'Show Details'}
            </button>
          </div>
          {showScrapeDetails && (
            <div className="space-y-1 text-sm max-h-64 overflow-y-auto">
              {scrapeStatus.map((status, index) => (
                <div 
                  key={index} 
                  className={`py-1 ${
                    status.includes('✅') 
                      ? 'text-green-600' 
                      : status.includes('❌') 
                        ? 'text-red-600' 
                        : 'text-gray-600'
                  }`}
                >
                  {status}
                </div>
              ))}
            </div>
          )}
          
          {/* Only show the error message if there was actually an error */}
          {scrapeStatus.some(status => status.includes('❌')) && (
            <div className="mt-3 text-center text-red-600 font-medium">
              Verification failed. Please check your inputs and try again.
            </div>
          )}
        </div>
      )}

      {searchResults && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <div className="flex justify-between items-center mb-3">
            <h3 className="text-lg font-semibold">Search Results</h3>
            <button 
              onClick={() => setShowScrapeDetails(!showScrapeDetails)}
              className="text-sm text-[#8B7355] hover:underline"
            >
              {showScrapeDetails ? 'Hide Details' : 'Show Scraper Details'}
            </button>
          </div>
          
          {showScrapeDetails && (
            <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200 max-h-64 overflow-y-auto">
              <div className="space-y-1 text-sm">
                {scrapeStatus.map((status, index) => (
                  <div 
                    key={index} 
                    className={`py-1 ${
                      status.includes('✅') 
                        ? 'text-green-600' 
                        : status.includes('❌') 
                          ? 'text-red-600' 
                          : 'text-gray-600'
                    }`}
                  >
                    {status}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Fighter Name ({firstName} {lastName})</span>
              {searchResults.fighterName ? 
                <CheckCircle className="text-green-500 w-5 h-5" /> : 
                <XCircle className="text-red-500 w-5 h-5" />
              }
            </div>
            <div className="flex items-center justify-between">
              <span>Opponent Name ({opponentFirstName} {opponentLastName})</span>
              {searchResults.opponentName ? 
                <CheckCircle className="text-green-500 w-5 h-5" /> : 
                <XCircle className="text-red-500 w-5 h-5" />
              }
            </div>
            <div className="flex items-center justify-between">
              <span>Date ({date})</span>
              {searchResults.date ? 
                <CheckCircle className="text-green-500 w-5 h-5" /> : 
                <XCircle className="text-red-500 w-5 h-5" />
              }
            </div>
            <div className="flex items-center justify-between">
              <span>Promotion ({promotionName})</span>
              {searchResults.promotionName ? 
                <CheckCircle className="text-green-500 w-5 h-5" /> : 
                <XCircle className="text-red-500 w-5 h-5" />
              }
            </div>
            <div className="flex items-center justify-between">
              <span>Sanctioning Body ({sanctioningBody})</span>
              {searchResults.sanctioningBody ? 
                <CheckCircle className="text-green-500 w-5 h-5" /> : 
                <XCircle className="text-red-500 w-5 h-5" />
              }
            </div>

            <div className="flex flex-col space-y-2">
              <div className="flex items-center justify-between">
                <span>Fight Result ({redResult})</span>
                {searchResults.resultVerified ? 
                  <CheckCircle className="text-green-500 w-5 h-5" /> : 
                  <XCircle className="text-red-500 w-5 h-5" />
                }
              </div>
              {searchResults.verificationReason && (
                <div className={`text-sm ${searchResults.resultVerified ? 'text-green-600' : 'text-red-600'}`}>
                  {searchResults.verificationReason}
                </div>
              )}
            </div>
          </div>
          
          <div className="mt-4 space-y-2">
            <button
              onClick={() => {
                if (searchResults) {
                  const boutData = constructBoutData(
                    url,
                    searchResults,
                    date
                  );
                  saveBoutData(boutData);
                } else {
                  setSaveMessage('Error: No verification results. Please verify the bout first.');
                }
              }}
              disabled={isSaving || !searchResults}
              className="w-full px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-green-300 disabled:cursor-not-allowed"
            >
              {isSaving ? 'Saving...' : 'Save Bout Data'}
            </button>

            {saveMessage && (
              <div className={`p-3 rounded-lg text-center ${
                saveMessage.includes('success') 
                  ? 'bg-green-100 text-green-700' 
                  : 'bg-red-100 text-red-700'
              }`}>
                {saveMessage}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default BoutSearch;