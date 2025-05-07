'use client';

import React, { useState, useEffect } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { Promoter, FullContactFighter, RosterFighter, EventType } from '@/utils/types';
import { handleSearch } from '@/utils/scrape/scrapeBout';
import FighterSearch from '@/components/searchbars/FighterSearch';
import GoogleAutocomplete from '@/components/ui/GoogleAutocomplete';
import GoogleMapsProvider from "@/components/ui/GoogleMapsProvider";

import { getGeocode } from 'use-places-autocomplete';
import { createMatch } from '@/utils/events/matches';

// 1) Import your event management functions
import { generateDocId, addEvent } from '@/utils/events/eventManagement';


// ---------- TYPINGS & INTERFACES ----------
interface FightVerification extends SearchResults {
  resultVerified: boolean;
  verificationReason?: string;
  detectedResult?: {
    winner?: string;
    method?: string;
  };
  score: number; // ✅ Add this line
}

interface SearchResults {
  fighterName: boolean;
  opponentName: boolean;
  date: boolean;
  promotionName: boolean;
  sanctioningBody: boolean;
}

interface BoutSearchProps {
  fighter: FullContactFighter;
}



const BoutSearch: React.FC<BoutSearchProps> = ({ fighter }) => {
  // ----- BOUT DATA FIELDS -----
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [opponentFirstName, setOpponentFirstName] = useState('');
  const [opponentLastName, setOpponentLastName] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // ----- Results & Method of Victory -----
  const [redResult, setRedResult] = useState<'W' | 'L' | 'NC' | 'DQ' | 'DRAW'>('W');
  const [blueResult, setBlueResult] = useState<'W' | 'L' | 'NC' | 'DQ' | 'DRAW'>('L');
  const [methodOfVictory, setMethodOfVictory] = useState('');

  // ----- SCRAPE RESULTS -----
  const [searchResults, setSearchResults] = useState<FightVerification | null>(null);
  const [scrapeStatus, setScrapeStatus] = useState<string[]>([]);
  const [showScrapeDetails, setShowScrapeDetails] = useState(false);

  // ----- PROMOTION & SANCTIONING -----
  const [promotionName, setPromotionName] = useState('');
  const [promotionNameInput, setPromotionNameInput] = useState('');
  const [promotionResults, setPromotionResults] = useState<Promoter[]>([]);
  const [showPromotionDropdown, setShowPromotionDropdown] = useState(false);
  const [promotionId, setPromotionId] = useState('');
  const [isLoadingPromotions, setIsLoadingPromotions] = useState(false);
  const [sanctioningBody, setSanctioningBody] = useState('');

  // ----- EVENT FIELDS -----
  const [eventName, setEventName] = useState('');
  const [eventNameInput, setEventNameInput] = useState('');
  const [eventNameResults, setEventNameResults] = useState<EventType[]>([]);
  const [, setShowEventNameDropdown] = useState(false);
  const [selectedEventId, setSelectedEventId] = useState('');
  const [, setIsLoadingEventNames] = useState(false);

  // ----- EVENT ADDRESS FIELDS -----
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [stateRegion, setStateRegion] = useState('');
  const [country, setCountry] = useState('');
  const [locale, setLocale] = useState('en');
  const [currency, setCurrency] = useState('USD');
  const [coordinates, setCoordinates] = useState({ latitude: 0, longitude: 0 });

  // ----- OPPONENT STATE -----
  const [selectedOpponent, setSelectedOpponent] = useState<FullContactFighter | null>(null);

  // ----- GYM STATES (RED & BLUE) -----
  const [, setRedGymId] = useState('');
  const [, setBlueGymId] = useState('');
  const [, setRedGymName] = useState('');
  const [, setBlueGymName] = useState('');
  const [redFighterPhoto, setRedFighterPhoto] = useState('');
  const [, setBlueFighterPhoto] = useState('');
  const [, setRedGymLogo] = useState('');
  const [, setBlueGymLogo] = useState('');
  const [, setSelectedRedGym] = useState<string | null>(null);
  const [, setSelectedBlueGym] = useState<string | null>(null);
  const [, setShowManualRedGymInput] = useState(true);
  const [, setShowManualBlueGymInput] = useState(true);

  // ----- OVERRIDES FOR GYM NAME -----
  // if the user wants to change the red corner fighter’s gym
  const [redGymOverride, setRedGymOverride] = useState<string | null>(null);
  const [blueGymOverride, setBlueGymOverride] = useState<string | null>(null);


  const [showAddNewEvent, setShowAddNewEvent] = useState(false);

  // ---------- USE EFFECTS ----------
  // Keep red/blue results in sync
  useEffect(() => {
    if (redResult === 'W') setBlueResult('L');
    else if (redResult === 'L') setBlueResult('W');
    else if (redResult === 'DRAW') setBlueResult('DRAW');
    else if (redResult === 'NC') setBlueResult('NC');
    else if (redResult === 'DQ') setBlueResult('DQ');
  }, [redResult]);

  // On mount, if fighter prop has a gym, ID, photo, etc., set them
  useEffect(() => {
    if (fighter) {
      setRedFighterPhoto(fighter.photo || '');
      setRedGymName(fighter.gym || '');
    }
  }, [fighter]);

  // ---------- HANDLERS FOR OPPONENT & GYM ----------
  const handleOpponentSelect = (opponent: RosterFighter) => {
    setSelectedOpponent({
      ...opponent,
    });
    setBlueFighterPhoto(opponent.photo || '');
  };



  // ---------- PROMOTION SEARCH ----------
  const searchPromotions = async (searchText: string) => {
    if (searchText.length < 3) {
      setPromotionResults([]);
      setShowPromotionDropdown(false);
      return;
    }
    setIsLoadingPromotions(true);
    try {
      const response = await fetch('/api/promoters');
      if (!response.ok) throw new Error('Failed to fetch promoters');

      const data = await response.json();
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

  const handlePromotionInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPromotionNameInput(value);
    setPromotionName(value);
    setPromotionId(''); // Clear previous ID
    setShowAddNewEvent(false); // Reset state
  
    if (value.length >= 3) {
      searchPromotions(value);
    } else {
      setPromotionResults([]);
      setShowPromotionDropdown(false);
    }
  
    // Check if the promotion exists in the results
    const match = promotionResults.find((p) => p.promotionName === value);
    if (!match) {
      const generatedId = value.toLowerCase().replace(/\s+/g, '');
      setPromotionId(generatedId);
      setShowAddNewEvent(true);
      setEventNameResults([]); // No existing events for unknown promotion
    }
  };

  const handleSelectPromotion = (promoter: Promoter) => {
    setPromotionName(promoter.promotionName);
    setPromotionNameInput(promoter.promotionName);
    setPromotionId(promoter.promoterId);
    setShowPromotionDropdown(false);
    setShowAddNewEvent(false);
  
    // Load events immediately for known promotion
    searchEventNames();
  };
  

  // ---------- EVENT NAME SEARCH ----------
  const searchEventNames = async () => {
    if (!promotionId) return;
    setIsLoadingEventNames(true);
    try {
      const res = await fetch('/api/events');
      const data = await res.json();
      const filtered = (data.events as EventType[]).filter(
        (event) => event.promoterId === promotionId
      );
      setEventNameResults(filtered);
    } catch (err) {
      console.error('Failed to fetch events', err);
      setEventNameResults([]);
    } finally {
      setIsLoadingEventNames(false);
    }
  };

  const handleEventNameInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEventNameInput(value);
    setEventName(value);
    if (value.length >= 3) {
      searchEventNames();
    } else {
      setEventNameResults([]);
      setShowEventNameDropdown(false);
    }
  };

  const handleSelectEvent = (event: EventType) => {
    setEventNameInput(event.event_name);
    setEventName(event.event_name);
    setSelectedEventId(event.eventId);
    setShowEventNameDropdown(false);

    // If you want to auto-populate address/city/state from existing event
    if (event.address) setAddress(event.address);
    if (event.city) setCity(event.city);
    if (event.state) setStateRegion(event.state);
  };

  // ---------- ADDRESS AUTOCOMPLETE ----------
  const handleAddressSelect = async (fullAddress: string, coords: { lat: number; lng: number }) => {
    try {
      const results = await getGeocode({ address: fullAddress });
      const place = results[0];
      if (!place) {
        console.error('No geocode results found');
        return;
      }
      const addressComponents = place.address_components;
      let cityLocal = '';
      let stateLocal = '';
      let countryLocal = '';

      addressComponents.forEach((component) => {
        const types = component.types;
        if (types.includes('locality')) {
          cityLocal = component.long_name;
        } else if (types.includes('administrative_area_level_1')) {
          stateLocal = component.short_name;
        } else if (types.includes('country')) {
          countryLocal = component.short_name;
        }
      });

      // Possibly tailor locale/currency
      let localeDefault = 'en';
      let currencyDefault = 'USD';
      if (countryLocal === 'MX') {
        localeDefault = 'es';
        currencyDefault = 'MXN';
      }

      // set states
      setAddress(fullAddress);
      setCity(cityLocal);
      setStateRegion(stateLocal);
      setCountry(countryLocal);
      setLocale(localeDefault);
      setCurrency(currencyDefault);
      setCoordinates({ latitude: coords.lat, longitude: coords.lng });
    } catch (error) {
      console.error('Error extracting location details:', error);
    }
  };

  // ---------- SCRAPER ----------
  const addScrapeStatus = (message: string) => {
    setScrapeStatus((prev) => [...prev, message]);
  };

  const handleSearchClick = () => {
    const searchParams = {
      url,
      first: fighter.first,
      last: fighter.last,
      opponentFirstName,
      opponentLastName,
      date,
      promotionName,
      sanctioningBody,
      result: redResult,
    };

    const callbacks = {
      setIsSearching,
      setSearchResults,
      addScrapeStatus,
    };

    handleSearch(searchParams, callbacks);
  };

  // ---------- CREATE MATCH HANDLER ----------
  const [isCreatingMatch, setIsCreatingMatch] = useState(false);

  const handleCreateFinishedMatch = async () => {
    if (!fighter || !selectedOpponent) {
      setSaveMessage('Please select both red and blue fighters first.');
      return;
    }
    if (!promotionId || !promotionName || !sanctioningBody || !date) {
      setSaveMessage('Please fill in all promotion and sanctioning info.');
      return;
    }
    
    let finalEventId = selectedEventId;


    try {
      setIsCreatingMatch(true);
  
      // Check if eventId exists — if not, generate and save event
 
      if (!finalEventId) {
        try {
          const generatedId = generateDocId(
            sanctioningBody,
            eventName,
            city,
            stateRegion,
            date
          );
  
          const newEvent: EventType = {
            promoterId: promotionId,
            sanctioning: sanctioningBody,
            event_name: eventName,
            date,
            city,
            state: stateRegion,
            country,
            address,
            coordinates,
            docId: generatedId,
            eventId: generatedId,
            id: generatedId,
            weighin_date: date,
            locale,
            currency,
            flyer: '', // Add appropriate value
            disableRegistration: false, // Add appropriate value
            registration_enabled: true, // Add appropriate value
            registration_link: '', // Add appropriate value
            registration_fee: 0, // Add appropriate value
            tickets_enabled: false, // Add appropriate value
            ticket_price: 0, // Add appropriate value
            email: '', // Add appropriate value
            promoterEmail: '', // Add appropriate value
            promotionName: promotionName, // Add promotion name
            numMats: 1, // Default value, update as needed
            photoPackagePrice: 0, // Default value, update as needed
            coachRegPrice: 0, // Default value, update as needed
            photoPackageEnabled: false, // Default value, update as needed
            display_matches: true,
            recieve_email_notifications: false
          };
  
          const result = await addEvent(newEvent);
          if (!result.success) {
            setSaveMessage('Failed to create new event: ' + result.message);
            setIsCreatingMatch(false);
            return;
          }
          finalEventId = generatedId;
          setSelectedEventId(generatedId);
        } catch (err) {
          console.error('Error generating or saving event:', err);
          setSaveMessage('Failed to create event.');
          setIsCreatingMatch(false);
          return;
        }
      }
  
      const redFighter: RosterFighter = {
        ...fighter,
        gym: redGymOverride !== null ? redGymOverride : fighter.gym,
        result: redResult,
        fullContactbouts: [...(fighter.fullContactbouts || [])],
        weightclass: fighter.weightclass || 0, // Provide a default or appropriate value
        weighin: 0, // Provide a default or appropriate value
        payment_info: {
          paymentIntentId: '',
          paymentAmount: 0,
          paymentCurrency: '',
        }, // Provide a default or appropriate value
      };
      
      const blueFighter: RosterFighter = {
        ...selectedOpponent,
        gym: blueGymOverride !== null ? blueGymOverride : selectedOpponent.gym,
        result: blueResult,
        fullContactbouts: [...(selectedOpponent.fullContactbouts || [])],
        weightclass: fighter.weightclass,
        weighin: 0, // Provide a default or appropriate value
        payment_info: {
          paymentIntentId: '',
          paymentAmount: 0,
          paymentCurrency: '',
        }, // Provide a default or appropriate value
      };
  
      await createMatch({
        red: redFighter,
        blue: blueFighter,
        boutNum: 1,
        ringNum: 1,
        eventId: finalEventId,
        promoterId: promotionId,
        weightclass: 0,
        eventName,
        promotionName,
        date,
        sanctioning: sanctioningBody,
        bout_ruleset: 'MT', 
        dayNum: 1,
        setIsCreatingMatch,
        setRed: () => {},
        setBlue: () => {},
      });
  
      setSaveMessage('Match created successfully!');
    } catch (error) {
      console.error('Error creating match:', error);
      setSaveMessage('Error creating match');
    } finally {
      setIsCreatingMatch(false);
    }
  };

  // ---------- RESET FORM ----------
  const resetForm = () => {
    setUrl('');
    setDate('');
    setEventName('');
    setEventNameInput('');
    setEventNameResults([]);
    setSelectedEventId('');
    setOpponentFirstName('');
    setOpponentLastName('');
    setPromotionName('');
    setPromotionNameInput('');
    setPromotionId('');
    setSanctioningBody('');
    setSearchResults(null);
    setRedResult('W');
    setBlueResult('L');
    setSelectedOpponent(null);
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
    setAddress('');
    setCity('');
    setStateRegion('');
    setCountry('');
    setLocale('en');
    setCurrency('USD');
    setCoordinates({ latitude: 0, longitude: 0 });
    setScrapeStatus([]);
    setShowScrapeDetails(false);
    setIsSearching(false);
    setSaveMessage(null);
    setMethodOfVictory('');
    setRedGymOverride(null);
    setBlueGymOverride(null);
  };

  // ---------- RENDER ----------
  return (
    <GoogleMapsProvider>
      <div className="space-y-6">
        <div className="text-center font-semibold">Enter Bout Details Here</div>

        {/* ---------- Promotion, event, sanctioning, date row ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* PROMOTION NAME */}
          <div className="relative">
            <input
              type="text"
              value={promotionNameInput}
              onChange={handlePromotionInputChange}
              placeholder="Promotion Name"
              className="w-full px-4 py-3 border border-[#d4c5b1] 
                         rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                         focus:border-[#8B7355] bg-[#f8f5f0]"
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

          {/* EVENT NAME */}
          {eventNameResults.length > 0 && !showAddNewEvent && (
  <div className="border border-[#d4c5b1] p-2 rounded bg-white shadow-sm">
    <div className="font-semibold mb-2">Select Existing Event:</div>
    <ul className="space-y-1 max-h-48 overflow-y-auto">
      {eventNameResults.map((event) => (
        <li
          key={event.eventId}
          onClick={() => handleSelectEvent(event)}
          className="cursor-pointer hover:bg-gray-100 px-2 py-1 rounded"
        >
          {event.event_name} ({event.date})
        </li>
      ))}
    </ul>
    <button
      className="mt-2 text-sm text-blue-600 hover:underline"
      onClick={() => setShowAddNewEvent(true)}
    >
      Add New Event
    </button>
  </div>
)}

{showAddNewEvent && (
  <div className="mt-2">
    <input
      type="text"
      value={eventNameInput}
      onChange={handleEventNameInputChange}
      placeholder="Event Name"
      className="w-full px-4 py-3 border border-[#d4c5b1] 
                 rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                 focus:border-[#8B7355] bg-[#f8f5f0]"
      required
    />
  </div>
)}

          {/* SANCTIONING BODY */}
          <div>
            <input
              type="text"
              value={sanctioningBody}
              onChange={(e) => setSanctioningBody(e.target.value)}
              placeholder="Sanctioning Body"
              className="w-full px-4 py-3 border border-[#d4c5b1] 
                         rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                         focus:border-[#8B7355] bg-[#f8f5f0]"
              required
            />
          </div>

          {/* DATE */}
          <div>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              placeholder="Enter Date"
              className="w-full px-4 py-3 border border-[#d4c5b1] 
                         rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                         focus:border-[#8B7355] bg-[#f8f5f0]"
              required
            />
          </div>
        </div>

        {/* ---------- ADDRESS AUTOCOMPLETE ---------- */}
        <div className="md:col-span-2 text-center font-semibold">Event Address</div>
        <div className="md:col-span-2">
          <GoogleAutocomplete onSelect={handleAddressSelect} />
        </div>

        {/* ---------- URL + RESULT SELECTION ---------- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Enter URL to search"
              className="w-full px-4 py-3 border border-[#d4c5b1] 
                         rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                         focus:border-[#8B7355] bg-[#f8f5f0]"
              required
            />
          </div>

          <div>
            <label className="mb-1 block font-semibold">Fight Result (Red Corner)</label>
            <select
              value={redResult}
              onChange={(e) =>
                setRedResult(e.target.value as 'W' | 'L' | 'NC' | 'DQ' | 'DRAW')
              }
              className="w-full px-4 py-3 border border-[#d4c5b1] 
                         rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                         focus:border-[#8B7355] bg-[#f8f5f0]"
              required
            >
              <option value="W">Win</option>
              <option value="L">Loss</option>
              <option value="NC">No Contest</option>
              <option value="DQ">Disqualification</option>
              <option value="DRAW">Draw</option>
            </select>
          </div>

          <div>
            <label className="mb-1 block font-semibold">Method of Victory (optional)</label>
            <input
              type="text"
              value={methodOfVictory}
              onChange={(e) => setMethodOfVictory(e.target.value)}
              placeholder="KO, TKO, UD, etc."
              className="w-full px-4 py-3 border border-[#d4c5b1] 
                         rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                         focus:border-[#8B7355] bg-[#f8f5f0]"
            />
          </div>
        </div>

        {/* ---------- RED CORNER FIGHTER INFO ---------- */}
        <div className="p-4 border border-[#d4c5b1] rounded-lg bg-[#f8f5f0]">
          <h3 className="font-medium mb-2">Red Corner Fighter Info</h3>
          {fighter ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-semibold">Name:</span> {fighter.first} {fighter.last}
              </p>
              <p>
                <span className="font-semibold">Fighter ID:</span> {fighter.fighter_id}
              </p>
              <p>
                <span className="font-semibold">Age:</span> {fighter.age}
              </p>
              <p>
                <span className="font-semibold">Gender:</span> {fighter.gender}
              </p>
              <p>
                <span className="font-semibold">Email:</span> {fighter.email}
              </p>
              <p>
                <span className="font-semibold">Phone:</span> {fighter.phone}
              </p>
              <p>
                <span className="font-semibold">City/State:</span> {fighter.city}, {fighter.state}
              </p>

              {/* Instead of a read-only gym, let's allow an override */}
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Gym (editable if changed):</label>
                <input
                  type="text"
                  className="border px-2 py-1 rounded"
                  value={redGymOverride !== null ? redGymOverride : fighter.gym}
                  onChange={(e) => setRedGymOverride(e.target.value)}
                  placeholder="Update gym name..."
                />
                <small className="text-gray-500 text-xs">
                  Current Gym ID: {fighter.gym_id}
                </small>
              </div>

              <p>
                <span className="font-semibold">Record (MT):</span> {fighter.mt_win}-{fighter.mt_loss}
              </p>
              <p>
                <span className="font-semibold">Record (Boxing):</span> {fighter.boxing_win}-
                {fighter.boxing_loss}
              </p>
              <p>
                <span className="font-semibold">Record (MMA):</span> {fighter.mma_win}-{fighter.mma_loss}
              </p>
              {/* Add as many fields as you want */}
            </div>
          ) : (
            <p className="text-sm text-gray-600">No Red Corner fighter data available.</p>
          )}
        </div>

        {/* ---------- OPPONENT (BLUE CORNER) SEARCH ---------- */}
        <div className="md:col-span-2 p-4 border border-[#d4c5b1] rounded-lg bg-[#f8f5f0]">
          <div className="flex justify-start items-center mb-3">
            <h3 className="font-medium">Opponent (Blue Corner)</h3>
          </div>
          <FighterSearch
            onFighterSelect={(fighter: FullContactFighter) =>
              handleOpponentSelect({
                ...fighter,
                result: 'L', // Default value for result
                weighin: 0, // Default value for weighin
                payment_info: {
                  paymentIntentId: '',
                  paymentAmount: 0,
                  paymentCurrency: '',
                }, // Default value for payment_info
              })
            }
            showCard={true}
            cardTitle="Search Opponent (Blue Corner)"
            cardDescription="Look up returning athletes or add a new one"
          />
          {selectedOpponent && (
            <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm font-medium">
                Selected: {selectedOpponent.first} {selectedOpponent.last}
              </p>
              <p className="text-xs text-gray-600">
                Fighter ID: {selectedOpponent.fighter_id}
              </p>
            </div>
          )}
        </div>

        {/* ---------- BLUE CORNER FIGHTER INFO ---------- */}
        {selectedOpponent && (
          <div className="p-4 border border-[#d4c5b1] rounded-lg bg-[#f8f5f0]">
            <h3 className="font-medium mb-2">Blue Corner Fighter Info</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <p>
                <span className="font-semibold">Name:</span> {selectedOpponent.first}{' '}
                {selectedOpponent.last}
              </p>
              <p>
                <span className="font-semibold">Fighter ID:</span>{' '}
                {selectedOpponent.fighter_id}
              </p>
              <p>
                <span className="font-semibold">Age:</span> {selectedOpponent.age}
              </p>
              <p>
                <span className="font-semibold">Gender:</span> {selectedOpponent.gender}
              </p>
             
            
              <p>
                <span className="font-semibold">City/State:</span> {selectedOpponent.city},{' '}
                {selectedOpponent.state}
              </p>
              <div className="flex flex-col">
                <label className="font-semibold mb-1">Gym (editable if changed):</label>
                <input
                  type="text"
                  className="border px-2 py-1 rounded"
                  value={blueGymOverride !== null ? blueGymOverride : selectedOpponent.gym}
                  onChange={(e) => setBlueGymOverride(e.target.value)}
                  placeholder="Update gym name..."
                />
                <small className="text-gray-500 text-xs">
                  Current Gym ID: {selectedOpponent.gym_id}
                </small>
              </div>
              <p>
                <span className="font-semibold">Record (MT):</span>{' '}
                {selectedOpponent.mt_win}-{selectedOpponent.mt_loss}
              </p>
              <p>
                <span className="font-semibold">Record (Boxing):</span>{' '}
                {selectedOpponent.boxing_win}-{selectedOpponent.boxing_loss}
              </p>
              <p>
                <span className="font-semibold">Record (MMA):</span>{' '}
                {selectedOpponent.mma_win}-{selectedOpponent.mma_loss}
              </p>
              {/* Add as many fields as you want */}
            </div>
          </div>
        )}

        {/* ---------- RED FIGHTER PHOTO (optional override) ---------- */}
        <div>
          <input
            type="url"
            value={redFighterPhoto}
            onChange={(e) => setRedFighterPhoto(e.target.value)}
            placeholder="Red Fighter Photo URL (optional)"
            className="w-full px-4 py-3 border border-[#d4c5b1] 
                       rounded-lg focus:ring-2 focus:ring-[#8B7355] 
                       focus:border-[#8B7355] bg-[#f8f5f0]"
          />
        </div>

        {/* ---------- VERIFY SCRAPER BUTTON ---------- */}
        <button
          onClick={handleSearchClick}
          disabled={
            isSearching ||
            !url ||
            !date ||
            (!selectedOpponent && (!opponentFirstName || !opponentLastName))
          }
          className="w-full px-6 py-3 bg-[#8B7355] text-white rounded-lg 
                     hover:bg-[#7a654b] disabled:bg-[#c4b5a1] 
                     disabled:cursor-not-allowed transition-colors"
        >
          {isSearching ? 'Searching...' : 'Verify Bout Data'}
        </button>

        {/* ---------- SCRAPER STATUS ---------- */}
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

        {/* If scraping done but no searchResults object, show messages */}
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
            {scrapeStatus.some((status) => status.includes('❌')) && (
              <div className="mt-3 text-center text-red-600 font-medium">
                Verification failed. Please check your inputs and try again.
              </div>
            )}
          </div>
        )}

        {/* ---------- Verification Checks ---------- */}
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

            {/* Verification Checks */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span>
                  Fighter Name ({fighter.first} {fighter.last})
                </span>
                {searchResults.fighterName ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>
                  Opponent Name ({opponentFirstName} {opponentLastName})
                </span>
                {searchResults.opponentName ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Date ({date})</span>
                {searchResults.date ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Promotion ({promotionName})</span>
                {searchResults.promotionName ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="flex items-center justify-between">
                <span>Sanctioning Body ({sanctioningBody})</span>
                {searchResults.sanctioningBody ? (
                  <CheckCircle className="text-green-500 w-5 h-5" />
                ) : (
                  <XCircle className="text-red-500 w-5 h-5" />
                )}
              </div>
              <div className="flex flex-col space-y-2">
                <div className="flex items-center justify-between">
                  <span>Fight Result ({redResult})</span>
                  {searchResults.resultVerified ? (
                    <CheckCircle className="text-green-500 w-5 h-5" />
                  ) : (
                    <XCircle className="text-red-500 w-5 h-5" />
                  )}
                </div>
                {searchResults.verificationReason && (
                  <div
                    className={`text-sm ${
                      searchResults.resultVerified ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {searchResults.verificationReason}
                  </div>
                )}
              </div>
            </div>

           
           
            {/* ---------- Buttons for Save or Create Match ---------- */}
            <div className="mt-4 space-y-2">
             
              <button
                onClick={handleCreateFinishedMatch}
                disabled={!selectedOpponent}
                className="w-full px-4 py-2 bg-blue-500 text-white rounded-lg 
                           hover:bg-blue-600 disabled:bg-blue-300 
                           disabled:cursor-not-allowed"
              >
                {isCreatingMatch ? 'Creating Match...' : 'Create Match in Roster'}
              </button>

              {saveMessage && (
                <div
                  className={`p-3 rounded-lg text-center ${
                    saveMessage.toLowerCase().includes('success')
                      ? 'bg-green-100 text-green-700'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {saveMessage}
                </div>
              )}
            </div>
          </div>
        )}



        {/* ---------- RESET FORM BUTTON ---------- */}
        <button
          onClick={resetForm}
          className="w-full px-4 py-2 bg-gray-300 rounded-lg hover:bg-gray-400"
        >
          Reset Form
        </button>
      </div>
    </GoogleMapsProvider>
  );
};

export default BoutSearch;
