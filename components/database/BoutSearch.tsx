'use client';

import React, { useState } from 'react';
import { CheckCircle, XCircle } from 'lucide-react';
import { 

  updateDoc, 
  doc,
  getDoc,

} from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';

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

interface ScrapeContext {
  content: string;
  tag: string;
}

interface BoutData {
  url: string;
  namePresent: boolean;
  date: string;
  datePresent: boolean;
  promotionName: string;
  promotionPresent: boolean;
  sanctioningBody: string;
  sanctioningPresent: boolean;
  opponentName: string;
  opponentPresent: boolean;
  timestamp: string;
  inputDate: string;
  inputOpponentFirst: string;
  inputOpponentLast: string;
  result: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW';  // Just keep this one
}

const BoutSearch: React.FC<BoutSearchProps> = ({ firstName, lastName, fighterId }) => {
  const [url, setUrl] = useState('');
  const [date, setDate] = useState('');
  const [opponentFirstName, setOpponentFirstName] = useState('');
  const [opponentLastName, setOpponentLastName] = useState('');
  const [promotionName, setPromotionName] = useState('');
  const [sanctioningBody, setSanctioningBody] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [result, setResult] = useState<'W' | 'L' | 'NC' | 'DQ' | 'DRAW'>('W');
const [searchResults, setSearchResults] = useState<FightVerification | null>(null);
const fullName = `${firstName} ${lastName}`.toLowerCase();






const verifyFightResult = (
  contexts: ScrapeContext[], 
  fighterName: string, 
  opponentName: string,
  expectedResult: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW'
): { verified: boolean; reason: string; } => {
  let verified = false;
  let reason = "No matching result pattern found";
  
  const fighterRegex = new RegExp(fighterName.replace(/\s+/g, '\\s+'), 'i');
  const opponentRegex = new RegExp(opponentName.replace(/\s+/g, '\\s+'), 'i');
  
  for (const ctx of contexts) {
    const content = ctx.content;
    const lines = content.split('\n').map(line => line.trim());
    
    // Only process contexts that have both names
    if (fighterRegex.test(content) && opponentRegex.test(content)) {
      
      // Case 1: Standard Tapology Format (W/L above fighter name)
      // Example: "W\n\nAlberto Montano\nvs.\nJorge Aquino"
      const resultLineIndex = lines.findIndex(line => /^[WL]$/.test(line));
      if (resultLineIndex !== -1) {
        const resultLine = lines[resultLineIndex];
        const relevantLines = lines.slice(resultLineIndex).filter(line => line.length > 0);
        const vsIndex = relevantLines.findIndex(l => l.includes('vs.'));
        
        if (vsIndex !== -1) {
          switch (expectedResult) {
            case 'W':
              if (resultLine === 'W' && 
                  relevantLines.slice(0, vsIndex).some(line => fighterRegex.test(line))) {
                verified = true;
                reason = "Found win pattern: W followed by fighter name before vs.";
                return { verified, reason };
              }
              break;
            
            case 'L':
              if (resultLine === 'L' && 
                  relevantLines.slice(0, vsIndex).some(line => fighterRegex.test(line))) {
                verified = true;
                reason = "Found loss pattern: L followed by fighter name before vs.";
                return { verified, reason };
              }
              break;
          }
        }
      }
      
      // Case 2: Results with Method
      // Example: "Decision · Unanimous"
      if (lines.some(line => /decision|submission|knockout|tko|ko/i.test(line))) {
        const methodLine = lines.find(line => 
          /decision|submission|knockout|tko|ko/i.test(line)
        );
        
        // Check if winner is mentioned before method
        const methodIndex = lines.findIndex(line => line === methodLine);
        const precedingLines = lines.slice(0, methodIndex);
        
        switch (expectedResult) {
          case 'W':
            if (precedingLines.some(line => fighterRegex.test(line))) {
              verified = true;
              reason = `Found win pattern: Fighter name before "${methodLine}"`;
              return { verified, reason };
            }
            break;
            
          case 'L':
            if (precedingLines.some(line => opponentRegex.test(line))) {
              verified = true;
              reason = `Found loss pattern: Opponent name before "${methodLine}"`;
              return { verified, reason };
            }
            break;
        }
      }
      
      // Case 3: Draw Specific Pattern
      if (expectedResult === 'DRAW') {
        const drawPatterns = [
          /^draw$/i,
          /ends in draw/i,
          /scored as draw/i,
          /declared draw/i
        ];
        
        if (lines.some(line => drawPatterns.some(pattern => pattern.test(line)))) {
          verified = true;
          reason = "Found explicit draw declaration";
          return { verified, reason };
        }
      }
      
      // Case 4: No Contest Pattern
      if (expectedResult === 'NC') {
        const ncPatterns = [
          /^no contest$/i,
          /ruled no contest/i,
          /^nc$/i,
          /overturned to nc/i
        ];
        
        if (lines.some(line => ncPatterns.some(pattern => pattern.test(line)))) {
          verified = true;
          reason = "Found no contest declaration";
          return { verified, reason };
        }
      }
      
      // Case 5: Disqualification Pattern
      if (expectedResult === 'DQ') {
        const dqPatterns = [
          /^dq$/i,
          /disqualification/i,
          /disqualified/i,
          /dq win/i,
          /dq loss/i
        ];
        
        if (lines.some(line => dqPatterns.some(pattern => pattern.test(line)))) {
          const dqLine = lines.find(line => 
            dqPatterns.some(pattern => pattern.test(line))
          );
          verified = true;
          reason = `Found disqualification: "${dqLine}"`;
          return { verified, reason };
        }
      }
      
      // Case 6: Fighter vs Fighter with Result Structure
      // Example: "Alberto Montano (W) vs Jorge Aquino (L)"
      const vsLine = lines.find(line => line.includes('vs.'));
      if (vsLine) {
        const [firstFighter, secondFighter] = vsLine.split(/\s*vs\.\s*/);
        const hasResult = /[WL]/.test(firstFighter + secondFighter);
        
        if (hasResult) {
          switch (expectedResult) {
            case 'W':
              if (fighterRegex.test(firstFighter) && /W/.test(firstFighter)) {
                verified = true;
                reason = "Found win in fighter vs. opponent structure";
                return { verified, reason };
              }
              break;
              
            case 'L':
              if (fighterRegex.test(firstFighter) && /L/.test(firstFighter)) {
                verified = true;
                reason = "Found loss in fighter vs. opponent structure";
                return { verified, reason };
              }
              break;
          }
        }
      }
    }
  }
  
  // If we haven't verified the result but found both fighters
  if (!verified && contexts.some(ctx => 
    fighterRegex.test(ctx.content) && 
    opponentRegex.test(ctx.content)
  )) {
    reason = "Found both fighters but couldn't verify result pattern";
  } else if (!verified) {
    reason = "Could not find both fighters in the same context";
  }
  
  return { verified, reason };
};



const saveBoutData = async (boutData: BoutData) => {
  setIsSaving(true);
  setSaveMessage(null);

  try {
    // Get the fighter document directly using the fighter_id as the document ID
    const docRef = doc(db, 'techbouts_fighters', fighterId);
    const docSnap = await getDoc(docRef);
    
    if (!docSnap.exists()) {
      throw new Error('Fighter not found in database');
    }

    // Get the current data
    const fighterData = docSnap.data();
    
    // Initialize bouts array if it doesn't exist
    const existingBouts = fighterData.bouts || [];
    
    // Add the new bout data
    const updatedBouts = [...existingBouts, boutData];
    
    // Update the document with the new bouts array
    await updateDoc(docRef, {
      bouts: updatedBouts
    });

    setSaveMessage('Bout data saved successfully!');
    
    // Clear form after successful save
    setUrl('');
    setDate('');
    setOpponentFirstName('');
    setOpponentLastName('');
    setPromotionName('');
    setSanctioningBody('');
    setSearchResults(null);
    setResult('W');
    
  } catch (error) {
    console.error('Error saving bout data:', error);
    setSaveMessage('Error saving bout data. Please try again.');
  } finally {
    setIsSaving(false);
  }
};


  const constructBoutData = (
    url: string,
    searchResults: SearchResults,
    inputDate: string,
    inputOpponentFirst: string,
    inputOpponentLast: string,
    inputPromotionName: string,
    inputSanctioningBody: string,
    result: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW'
  ): BoutData => {
    return {
      url: url,
      namePresent: searchResults.fighterName,
      date: inputDate,
      datePresent: searchResults.date,
      promotionName: inputPromotionName,
      promotionPresent: searchResults.promotionName,
      sanctioningBody: inputSanctioningBody,
      sanctioningPresent: searchResults.sanctioningBody,
      opponentName: `${inputOpponentFirst} ${inputOpponentLast}`,
      opponentPresent: searchResults.opponentName,
      timestamp: new Date().toISOString(),
      inputDate: inputDate,
      inputOpponentFirst: inputOpponentFirst,
      inputOpponentLast: inputOpponentLast,
      result: result  // Just assign directly
    };
  };


  const handleSearch = async () => {
    setIsSearching(true);
    setSearchResults(null);
  
    try {
      const response = await fetch('/api/scrape', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });
  
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
  
      const data = await response.json();
      


      interface ContextResult {
        context: string;
        tag: string;
      }
      
      const fighterContexts = data.contexts.filter((ctx: ScrapeContext) => 
        ctx.content.toLowerCase().includes(fullName)
      ).map((ctx: ScrapeContext): ContextResult => {
        const content = ctx.content;
        const index = content.toLowerCase().indexOf(fullName);
        const start = Math.max(0, index - 100);
        const end = Math.min(content.length, index + 100);
        return {
          context: content.slice(start, end),
          tag: ctx.tag
        };
      });
      
      console.log('Fighter name contexts:', fighterContexts);
      const nameFound = fighterContexts.length > 0;

  
      // Search for opponent name
      const fullOpponentName = `${opponentFirstName} ${opponentLastName}`.toLowerCase();
      const opponentFound = data.contexts.some((ctx: ScrapeContext) => 
        ctx.content.toLowerCase().includes(fullOpponentName)
      );
  
      // Search for date
      const inputDateObj = new Date(date);
      const dateFormats = [
        inputDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        inputDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
        date
      ];
      
      const dateFound = data.contexts.some((ctx: ScrapeContext) => 
        dateFormats.some(format => 
          ctx.content.toLowerCase().includes(format.toLowerCase())
        )
      );
  
      // Search for promotion name
      const promotionFound = promotionName ? data.contexts.some((ctx: ScrapeContext) => 
        ctx.content.toLowerCase().includes(promotionName.toLowerCase())
      ) : false;
  
      // Search for sanctioning body
      const sanctioningFound = sanctioningBody ? data.contexts.some((ctx: ScrapeContext) => 
        ctx.content.toLowerCase().includes(sanctioningBody.toLowerCase())
      ) : false;
  
      // Initial verification results
      const initialResults: SearchResults = {
        fighterName: nameFound,
        opponentName: opponentFound,
        date: dateFound,
        promotionName: promotionFound,
        sanctioningBody: sanctioningFound
      };
  
      // Fight result verification
      const { verified, reason } = verifyFightResult(
        data.contexts,
        `${firstName} ${lastName}`,
        `${opponentFirstName} ${opponentLastName}`,
        result
      );
      
      // Combine all results
      const finalResults: FightVerification = {
        ...initialResults,
        resultVerified: verified,
        verificationReason: reason
      };
  
      setSearchResults(finalResults);
      console.log('Search Results:', finalResults);
  
      const boutData = constructBoutData(
        url,
        finalResults,
        date,
        opponentFirstName,
        opponentLastName,
        promotionName,
        sanctioningBody,
        result
      );
  
      console.log('Bout Data:', boutData);
  
    } catch (error) {
      console.error('Error in search:', error);
      setSearchResults(null);
    } finally {
      setIsSearching(false);
    }
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
          value={result}
          onChange={(e) => setResult(e.target.value as 'W' | 'L' | 'NC' | 'DQ' | 'DRAW')}
          className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
          required
        >
          <option value="W">Win</option>
          <option value="L">Loss</option>
          <option value="NC">No Contest</option>
          <option value="DQ">Disqualification</option>
          <option value="DRAW">Draw</option>
        </select>
  
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
  
        <div>
          <input
            type="text"
            value={promotionName}
            onChange={(e) => setPromotionName(e.target.value)}
            placeholder="Promotion Name"
            className="w-full px-4 py-3 border border-[#d4c5b1] rounded-lg focus:ring-2 focus:ring-[#8B7355] focus:border-[#8B7355] bg-[#f8f5f0]"
            required
          />
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
      </div>
  
      <button
        onClick={handleSearch}
        disabled={isSearching || !url || !date || !opponentFirstName || !opponentLastName}
        className="w-full px-6 py-3 bg-[#8B7355] text-white rounded-lg hover:bg-[#7a654b] disabled:bg-[#c4b5a1] disabled:cursor-not-allowed transition-colors"
      >
        {isSearching ? 'Searching...' : 'Verify Bout Data'}
      </button>

      {searchResults && (
        <div className="mt-4 p-4 bg-white rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-3">Search Results</h3>
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
    <span>Fight Result ({result})</span>
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
              const boutData = constructBoutData(
                url,
                searchResults,
                date,
                opponentFirstName,
                opponentLastName,
                promotionName,
                sanctioningBody,
                result
              );
              saveBoutData(boutData);
            }}
              disabled={isSaving}
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