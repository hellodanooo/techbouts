// utils/pmt/createCurrentPmtRecordsFromHistCurrentYear.ts

import {
    collection,
    getDocs,
    getDoc,
    doc,
    setDoc,
    Firestore
  } from 'firebase/firestore';
  
  import { PmtFighterRecord } from '../types';
  import { ProcessedEvent } from './calculateRecordsAll';
  
  /**
   * Creates a current PMT records collection by merging historical records with the current year's records
   * 
   * @param db - Firestore database instance
   * @param progressCallback - (Optional) callback to report progress messages
   * @returns Object containing fighter records and processed events
   */
  export async function createCurrentPmtRecordsFromHistCurrentYear(
    db: Firestore,
    progressCallback?: (message: string) => void
  ): Promise<{
    fighterRecords: Map<string, PmtFighterRecord>;
    processedEvents: ProcessedEvent[];
  }> {
    const currentYear = new Date().getFullYear();
    const historicalCollection = findMostRecentHistoricalCollection(currentYear);
    const currentYearCollection = `pmt_records_${currentYear}`;
    const destinationCollection = `pmt_records_current`;
    
    const fighterRecords = new Map<string, PmtFighterRecord>();
    const processedEvents: ProcessedEvent[] = [];
    
    try {
      progressCallback?.(`Starting merge operation from ${historicalCollection} and ${currentYearCollection}...`);
      
      // Step 1: Load historical records
      progressCallback?.(`Loading historical records from ${historicalCollection}...`);
      
      // First check if the historical collection exists by checking its metadata
      const histMetadataRef = doc(db, historicalCollection, "metadata");
      const histMetadataSnap = await getDoc(histMetadataRef);
      
      if (!histMetadataSnap.exists()) {
        throw new Error(`Historical collection ${historicalCollection} does not exist or has no metadata`);
      }
      
      const histMetadata = histMetadataSnap.data();
      progressCallback?.(`Found historical collection with ${histMetadata.totalFighters || 'unknown'} fighters`);
      
      // Load historical records
      const histSnapshot = await getDocs(collection(db, historicalCollection));
      
      let histRecordsCount = 0;
      
      histSnapshot.forEach(docSnap => {
        // Skip metadata and other special documents
        if (docSnap.id === "metadata" || docSnap.id === "errors") return;
        
        const fighterData = docSnap.data() as PmtFighterRecord;
        
        // Ensure we have a valid PMT ID
        if (!fighterData.pmt_id) {
          console.warn(`Skipping historical record with missing PMT ID: ${docSnap.id}`);
          return;
        }
        
        // Add to our records map
        fighterRecords.set(fighterData.pmt_id, {
          ...fighterData,
          // Ensure arrays are initialized
          fights: fighterData.fights || [],
          weightclasses: fighterData.weightclasses || [],
          events_participated: fighterData.events_participated || [],
          searchKeywords: fighterData.searchKeywords || []
        });
        
        histRecordsCount++;
      });
      
      progressCallback?.(`Loaded ${histRecordsCount} historical fighter records`);
      
      // Step 2: Check if current year collection exists
      progressCallback?.(`Checking for current year collection ${currentYearCollection}...`);
      
      const currYearMetadataRef = doc(db, currentYearCollection, "metadata");
      const currYearMetadataSnap = await getDoc(currYearMetadataRef);
      
      let currentYearRecordsCount = 0;
      
      if (currYearMetadataSnap.exists()) {
        // Step 3: Load and merge current year records
        progressCallback?.(`Loading and merging current year records from ${currentYearCollection}...`);
        
        const currYearSnapshot = await getDocs(collection(db, currentYearCollection));
        
        currYearSnapshot.forEach(docSnap => {
          // Skip metadata and other special documents
          if (docSnap.id === "metadata" || docSnap.id === "errors") return;
          
          const fighterData = docSnap.data() as PmtFighterRecord;
          
          // Ensure we have a valid PMT ID
          if (!fighterData.pmt_id) {
            console.warn(`Skipping current year record with missing PMT ID: ${docSnap.id}`);
            return;
          }
          
          // Check if fighter already exists in our map
          if (fighterRecords.has(fighterData.pmt_id)) {
            // Merge with existing record
            const existingRecord = fighterRecords.get(fighterData.pmt_id)!;
            
            // Merge fight statistics
            existingRecord.win = (existingRecord.win || 0) + (fighterData.win || 0);
            existingRecord.loss = (existingRecord.loss || 0) + (fighterData.loss || 0);
            existingRecord.nc = (existingRecord.nc || 0) + (fighterData.nc || 0);
            existingRecord.dq = (existingRecord.dq || 0) + (fighterData.dq || 0);
            
            // Merge skill ratings
            existingRecord.bodykick = (existingRecord.bodykick || 0) + (fighterData.bodykick || 0);
            existingRecord.boxing = (existingRecord.boxing || 0) + (fighterData.boxing || 0);
            existingRecord.clinch = (existingRecord.clinch || 0) + (fighterData.clinch || 0);
            existingRecord.defense = (existingRecord.defense || 0) + (fighterData.defense || 0);
            existingRecord.footwork = (existingRecord.footwork || 0) + (fighterData.footwork || 0);
            existingRecord.headkick = (existingRecord.headkick || 0) + (fighterData.headkick || 0);
            existingRecord.kicks = (existingRecord.kicks || 0) + (fighterData.kicks || 0);
            existingRecord.knees = (existingRecord.knees || 0) + (fighterData.knees || 0);
            existingRecord.legkick = (existingRecord.legkick || 0) + (fighterData.legkick || 0);
            existingRecord.ringawareness = (existingRecord.ringawareness || 0) + (fighterData.ringawareness || 0);
            
            // Merge fights arrays
            existingRecord.fights = [
              ...(existingRecord.fights || []),
              ...(fighterData.fights || [])
            ];
            
            // Merge weightclasses (unique values)
            existingRecord.weightclasses = [...new Set([
              ...(existingRecord.weightclasses || []),
              ...(fighterData.weightclasses || [])
            ])].sort((a, b) => a - b);
            
            // Merge events_participated (ensuring unique event IDs)
            if (!existingRecord.events_participated) {
              existingRecord.events_participated = [];
            }
            
            if (fighterData.events_participated) {
              // Create a set of existing event IDs for quick lookup
              const existingEventIds = new Set(
                existingRecord.events_participated.map((event: any) => 
                  typeof event === 'string' ? event : event.eventId
                )
              );
              
              // Add only unique events
              (fighterData.events_participated || []).forEach((event: any) => {
                const eventId = typeof event === 'string' ? event : event.eventId;
                if (!existingEventIds.has(eventId)) {
                  existingRecord.events_participated.push(
                    typeof event === 'string' ? { eventId: event } : event
                  );
                }
              });
            }
            
            // Update lastUpdated timestamp
            existingRecord.lastUpdated = new Date().toISOString();
            
            // Update the fighter records map
            fighterRecords.set(fighterData.pmt_id, existingRecord);
            
          } else {
            // This is a new fighter - add to records map
            fighterRecords.set(fighterData.pmt_id, {
              ...fighterData,
              // Ensure arrays are initialized
              fights: fighterData.fights || [],
              weightclasses: fighterData.weightclasses || [],
              events_participated: fighterData.events_participated || [],
              searchKeywords: fighterData.searchKeywords || []
            });
          }
          
          currentYearRecordsCount++;
        });
        
        progressCallback?.(`Merged ${currentYearRecordsCount} current year records`);
        
        // Step 4: Collect processed events
        // First from historical collection
        const histEventsRef = doc(db, historicalCollection, "metadata");
        const histEventsSnap = await getDoc(histEventsRef);
        
        if (histEventsSnap.exists() && histEventsSnap.data().processedEvents) {
          processedEvents.push(...histEventsSnap.data().processedEvents);
        }
        
        // Then from current year collection
        const currYearEventsRef = doc(db, currentYearCollection, "metadata");
        const currYearEventsSnap = await getDoc(currYearEventsRef);
        
        if (currYearEventsSnap.exists() && currYearEventsSnap.data().processedEvents) {
          // Avoid duplicates by checking event IDs
          const existingEventIds = new Set(processedEvents.map(event => event.eventId));
          
          currYearEventsSnap.data().processedEvents.forEach((event: ProcessedEvent) => {
            if (!existingEventIds.has(event.eventId)) {
              processedEvents.push(event);
            }
          });
        }
        
      } else {
        progressCallback?.(`No current year collection found for ${currentYear}. Using only historical data.`);
      }
      
      // Step 5: Write to the destination collection
      progressCallback?.(`Writing ${fighterRecords.size} merged records to ${destinationCollection}...`);
      
      // Convert Map to array for Firestore
      const recordsArray = Array.from(fighterRecords.entries()).map(([id, record]) => ({
        id,
        ...record,
        lastUpdated: new Date().toISOString()
      }));
      
      // Use batches to write records (Firestore has a 500 document limit per batch)
      const MAX_BATCH_SIZE = 400; // Keep slightly below the 500 limit to be safe
      
      for (let i = 0; i < recordsArray.length; i += MAX_BATCH_SIZE) {
        const chunk = recordsArray.slice(i, i + MAX_BATCH_SIZE);
        const batchNumber = Math.floor(i / MAX_BATCH_SIZE) + 1;
        const totalBatches = Math.ceil(recordsArray.length / MAX_BATCH_SIZE);
        
        progressCallback?.(`Writing batch ${batchNumber}/${totalBatches} (${chunk.length} records)...`);
        
        // Write documents one by one
        const writePromises = chunk.map(record => {
          const docRef = doc(db, destinationCollection, record.pmt_id);
          return setDoc(docRef, record, { merge: true });
        });
        
        await Promise.all(writePromises);
        
        // Update progress
        const progress = Math.min(100, Math.round((i + chunk.length) / recordsArray.length * 100));
        progressCallback?.(`Progress: ${progress}%`);
      }
      
      // Create a metadata document
      await setDoc(doc(db, destinationCollection, "metadata"), {
        totalFighters: recordsArray.length,
        lastUpdated: new Date().toISOString(),
        sourceCollections: [historicalCollection, currentYearCollection],
        processedEvents: processedEvents
      });
      
      progressCallback?.(`Successfully created ${destinationCollection} with ${fighterRecords.size} total fighter records`);
      
      return {
        fighterRecords,
        processedEvents
      };
      
    } catch (error) {
      console.error('Error creating current PMT records:', error);
      throw error;
    }
  }
  
  /**
   * Helper function to find the most recent historical collection
   * Follows the naming pattern: pmt_records_hist_YYYY_YYYY_...
   */
  function findMostRecentHistoricalCollection(currentYear: number): string {
    // This is a simple implementation that follows the pattern you established
    // In a real application, you might want to query Firestore to find existing collections
    
    // For years 2022 to current year - 1
    const years = [];
    for (let year = 2022; year < currentYear; year++) {
      years.push(year);
    }
    
    return `pmt_records_hist_${years.join('_')}`;
  }