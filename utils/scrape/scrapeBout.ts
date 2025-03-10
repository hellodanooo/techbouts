// src/utils/boutSearchUtils.ts


interface SearchParams {
  url: string;
  firstName: string;
  lastName: string;
  opponentFirstName: string;
  opponentLastName: string;
  date: string;
  promotionName: string;
  sanctioningBody: string;
  result: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW';
}
interface FightVerification extends SearchResults {
    resultVerified: boolean;
    verificationReason?: string;
    detectedResult?: {
      winner?: string;
      method?: string;
    };
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

interface SearchCallbacks {
  setIsSearching: (isSearching: boolean) => void;
  setSearchResults: (results: FightVerification | null) => void;
  addScrapeStatus: (message: string) => void;
}

export const verifyFightResult = (
  contexts: ScrapeContext[],
  fighterName: string,
  opponentName: string,
  expectedResult: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW'
): { verified: boolean; reason: string } => {
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

export const handleSearch = async (
  params: SearchParams,
  callbacks: SearchCallbacks
) => {
  const { 
    url, 
    firstName, 
    lastName, 
    opponentFirstName, 
    opponentLastName, 
    date, 
    promotionName, 
    sanctioningBody, 
    result 
  } = params;
  
  const { 
    setIsSearching, 
    setSearchResults, 
    addScrapeStatus 
  } = callbacks;

  setIsSearching(true);
  setSearchResults(null);
  addScrapeStatus("Starting scraper...");
  
  try {
    addScrapeStatus(`Fetching content from URL: ${url}`);
    
    const response = await fetch('/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    });

    if (!response.ok) {
      addScrapeStatus("❌ Failed to fetch data from URL");
      throw new Error('Failed to fetch data');
    }

    addScrapeStatus("✅ Successfully fetched page content");
    const data = await response.json();
    addScrapeStatus(`Retrieved ${data.contexts.length} content blocks from page`);

    // Check fighter name
    addScrapeStatus(`Checking fighter name: "${firstName} ${lastName}"`);
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    
    const fighterContexts = data.contexts.filter((ctx: ScrapeContext) => 
      ctx.content.toLowerCase().includes(fullName)
    );
    
    const nameFound = fighterContexts.length > 0;
    addScrapeStatus(nameFound 
      ? `✅ Fighter name found in ${fighterContexts.length} places` 
      : "❌ Fighter name not found on page");

    // Check opponent name
    addScrapeStatus(`Checking opponent name: "${opponentFirstName} ${opponentLastName}"`);
    const fullOpponentName = `${opponentFirstName} ${opponentLastName}`.toLowerCase();
    const opponentContexts = data.contexts.filter((ctx: ScrapeContext) => 
      ctx.content.toLowerCase().includes(fullOpponentName)
    );
    
    const opponentFound = opponentContexts.length > 0;
    addScrapeStatus(opponentFound 
      ? `✅ Opponent name found in ${opponentContexts.length} places` 
      : "❌ Opponent name not found on page");

    // Date verification with detailed messaging
    addScrapeStatus(`Checking date: "${date}"`);
    function getOrdinalDay(day: number): string {
      if (day > 3 && day < 21) return day + 'th';
      switch (day % 10) {
        case 1: return day + 'st';
        case 2: return day + 'nd';
        case 3: return day + 'rd';
        default: return day + 'th';
      }
    }
    
    const inputDateObj = new Date(date);
    
    // Format 1: Full dates with ordinals
    addScrapeStatus("Checking for full date with ordinal (e.g., 'January 16th, 2011')");
    const fullDateWithOrdinal = `${inputDateObj.toLocaleDateString('en-US', { month: 'long' })} ${getOrdinalDay(inputDateObj.getDate())}, ${inputDateObj.getFullYear()}`;
    const fullDateWithOrdinalNoComma = `${inputDateObj.toLocaleDateString('en-US', { month: 'long' })} ${getOrdinalDay(inputDateObj.getDate())} ${inputDateObj.getFullYear()}`;
    
    // Format 2: Location formats
    addScrapeStatus("Checking for date with location (e.g., 'January 16th, 2011 - Sacramento')");
    const locationFormat = `${inputDateObj.toLocaleDateString('en-US', { month: 'long' })} ${getOrdinalDay(inputDateObj.getDate())}, ${inputDateObj.getFullYear()} -`;
    
    // Format 3: Standard dates
    addScrapeStatus("Checking for standard date formats");
    const standardDate = inputDateObj.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const shortDate = inputDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    
    // Format 4: Numeric formats
    addScrapeStatus("Checking for numeric date formats (MM/DD/YYYY, YYYY-MM-DD)");
    
    // Function to normalize text for comparison
    function normalizeText(text: string): string {
      return text.toLowerCase().replace(/\s+/g, ' ').trim();
    }
    
    let dateFound = false;
    let dateFoundFormat = "";
    
    // First attempt: Direct string matching
    for (const ctx of data.contexts) {
      const content = normalizeText(ctx.content);
      
      if (content.includes(normalizeText(fullDateWithOrdinal))) {
        dateFound = true;
        dateFoundFormat = fullDateWithOrdinal;
        addScrapeStatus(`✅ Found date in format: "${fullDateWithOrdinal}"`);
        break;
      }
      
      if (content.includes(normalizeText(fullDateWithOrdinalNoComma))) {
        dateFound = true;
        dateFoundFormat = fullDateWithOrdinalNoComma;
        addScrapeStatus(`✅ Found date in format: "${fullDateWithOrdinalNoComma}"`);
        break;
      }
      
      if (content.includes(normalizeText(locationFormat))) {
        dateFound = true;
        dateFoundFormat = locationFormat;
        addScrapeStatus(`✅ Found date with location: "${locationFormat}"`);
        break;
      }
      
      if (content.includes(normalizeText(standardDate))) {
        dateFound = true;
        dateFoundFormat = standardDate;
        addScrapeStatus(`✅ Found standard date: "${standardDate}"`);
        break;
      }
      
      if (content.includes(normalizeText(shortDate))) {
        dateFound = true;
        dateFoundFormat = shortDate;
        addScrapeStatus(`✅ Found short date: "${shortDate}"`);
        break;
      }
    }
    
    // Second attempt: Component matching
    if (!dateFound) {
      addScrapeStatus("Date not found in standard formats, checking for date components...");
      
      const year = inputDateObj.getFullYear().toString();
      const month = inputDateObj.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
      const shortMonth = inputDateObj.toLocaleDateString('en-US', { month: 'short' }).toLowerCase().replace('.', '');
      const day = inputDateObj.getDate().toString();
      const dayWithOrdinal = getOrdinalDay(inputDateObj.getDate());
      
      for (const ctx of data.contexts) {
        const content = normalizeText(ctx.content);
        
        // Check for month, day with ordinal, and year appearing together
        if (
          (content.includes(month) || content.includes(shortMonth)) && 
          content.includes(dayWithOrdinal.toLowerCase()) && 
          content.includes(year)
        ) {
          dateFound = true;
          addScrapeStatus(`✅ Found date components: Month "${month}", Day "${dayWithOrdinal}", Year "${year}"`);
          break;
        }
        
        // Check for any combination of month, day, and year
        const hasMonth = content.includes(month) || content.includes(shortMonth);
        const hasDay = content.includes(day) || 
                      content.includes(day + 'st') || 
                      content.includes(day + 'nd') || 
                      content.includes(day + 'rd') || 
                      content.includes(day + 'th');
        const hasYear = content.includes(year);
        
        if (hasMonth && hasDay && hasYear) {
          dateFound = true;
          addScrapeStatus(`✅ Found loose date components: ${hasMonth ? 'Month' : ''} ${hasDay ? 'Day' : ''} ${hasYear ? 'Year' : ''}`);
          break;
        }
      }
    }
    
    // Third attempt: URL pattern matching
    if (!dateFound) {
      addScrapeStatus("Date not found in content, checking URL for date pattern...");
      
      const urlLower = url.toLowerCase();
      const dayStr = inputDateObj.getDate().toString().padStart(2, '0');
      const monthStr = (inputDateObj.getMonth() + 1).toString().padStart(2, '0');
      const yearStr = inputDateObj.getFullYear().toString();
      
      // Common date formats in URLs
      if (urlLower.includes(yearStr + monthStr + dayStr)) { // 20110116
        dateFound = true;
        addScrapeStatus(`✅ Found date in URL as YYYYMMDD: "${yearStr}${monthStr}${dayStr}"`);
      } 
      else if (urlLower.includes(yearStr + '-' + monthStr + '-' + dayStr)) { // 2011-01-16
        dateFound = true;
        addScrapeStatus(`✅ Found date in URL as YYYY-MM-DD: "${yearStr}-${monthStr}-${dayStr}"`);
      }
      else if (urlLower.includes(dayStr + monthStr + yearStr)) { // 16012011
        dateFound = true;
        addScrapeStatus(`✅ Found date in URL as DDMMYYYY: "${dayStr}${monthStr}${yearStr}"`);
      }
      else if (urlLower.includes(monthStr + dayStr + yearStr)) { // 01162011
        dateFound = true;
        addScrapeStatus(`✅ Found date in URL as MMDDYYYY: "${monthStr}${dayStr}${yearStr}"`);
      }
      else if (urlLower.includes(yearStr.slice(2) + monthStr + dayStr)) { // 110116
        dateFound = true;
        addScrapeStatus(`✅ Found date in URL as YYMMDD: "${yearStr.slice(2)}${monthStr}${dayStr}"`);
      }
      else {
        addScrapeStatus("❌ Could not find date pattern in URL");
      }
    }
    
    if (!dateFound) {
      addScrapeStatus("❌ Date not found in any expected format");
    }

    // Search for promotion name
    addScrapeStatus(`Checking promotion name: "${promotionName}"`);
    const promotionFound = promotionName ? data.contexts.some((ctx: ScrapeContext) => 
      ctx.content.toLowerCase().includes(promotionName.toLowerCase())
    ) : false;
    
    addScrapeStatus(promotionFound 
      ? `✅ Promotion name found: "${promotionName}"` 
      : `❌ Promotion name not found: "${promotionName}"`);

    // Search for sanctioning body
    addScrapeStatus(`Checking sanctioning body: "${sanctioningBody}"`);
    const sanctioningFound = sanctioningBody ? data.contexts.some((ctx: ScrapeContext) => 
      ctx.content.toLowerCase().includes(sanctioningBody.toLowerCase())
    ) : false;
    
    addScrapeStatus(sanctioningFound 
      ? `✅ Sanctioning body found: "${sanctioningBody}"` 
      : `❌ Sanctioning body not found: "${sanctioningBody}"`);

    // Verify fight result
    addScrapeStatus(`Verifying fight result: "${result}"`);
    const { verified, reason } = verifyFightResult(
      data.contexts,
      `${firstName} ${lastName}`,
      `${opponentFirstName} ${opponentLastName}`,
      result
    );
    
    addScrapeStatus(verified 
      ? `✅ Result verified: ${reason}` 
      : `❌ Could not verify result: ${reason}`);

    // Create final verification results
    const initialResults: SearchResults = {
      fighterName: nameFound,
      opponentName: opponentFound,
      date: dateFound,
      promotionName: promotionFound,
      sanctioningBody: sanctioningFound
    };
    
    const finalResults: FightVerification = {
      ...initialResults,
      resultVerified: verified,
      verificationReason: reason
    };

    setSearchResults(finalResults);
    addScrapeStatus("Scrape completed! See detailed results below.");

  } catch (error) {
    console.error('Error in search:', error);
    addScrapeStatus(`❌ Error occurred: ${error instanceof Error ? error.message : 'Unknown error'}`);
    setSearchResults(null);
  } finally {
    setIsSearching(false);
  }
};