// utils/pmt/addMergePmtRecords.ts
import { 
    collection, 
    getDocs, 
    doc, 
    writeBatch, 
    query, 
    limit, 
    where, 
    Firestore,
    getDoc,
    setDoc,
    DocumentData
  } from 'firebase/firestore';
  
  // Import the FighterRecord interface from the shared location
  import { FighterRecord, computeKeywords, ProcessedEvent } from './calculateRecordsAll';
  
  /**
   * Generates a formatted fighter ID in the format firstlastDDMMYYYY
   * 
   * @param record FighterRecord to generate ID for
   * @returns Formatted fighter ID
   */
  function generateFighterId(record: FighterRecord): string {
    // Extract first name and last name (uppercase, no spaces)
    const firstName = record.first.toUpperCase().replace(/\s+/g, '');
    const lastName = record.last.toUpperCase().replace(/\s+/g, '');
    
    // Get date of birth in DDMMYYYY format
    let dateString = '';
    if (record.dob) {
      try {
        // Try to parse date - handle different formats
        const date = new Date(record.dob);
        if (!isNaN(date.getTime())) {
          // Format as DDMMYYYY
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear().toString();
          dateString = `${day}${month}${year}`;
        }
      } catch (e) {
        console.warn(`Could not parse date: ${record.dob}`);
      }
    }
    
    // If we couldn't get a date, use a random number
    if (!dateString) {
      const randomNum = Math.floor(Math.random() * 100000).toString().padStart(6, '0');
      dateString = `000000${randomNum}`.slice(-8);
    }
    
    return `${firstName}${lastName}${dateString}`;
  }
  
  /**
   * Merges or adds PMT records to TechBouts fighters
   * 
   * @param techboutsDb - Firestore instance for TechBouts database
   * @param pmtRecords - Map of PMT fighter IDs to their records
   * @param progressCallback - (Optional) callback to report progress messages
   */
  export async function addMergePmtRecords(
    techboutsDb: Firestore,
    pmtRecords: Map<string, FighterRecord>,
    progressCallback?: (message: string) => void,
    processedEvents: ProcessedEvent[] = []

  ): Promise<{ success: boolean; updated: number; created: number; message: string }> {
    const BATCH_SIZE = 500;
    let batch = writeBatch(techboutsDb);
    let operationCount = 0;
    let updatedCount = 0;
    let createdCount = 0;
  
    try {
      progressCallback?.(`Starting to merge PMT records with TechBouts data...`);
      const pmtRecordsArray = Array.from(pmtRecords.entries());
      const totalRecords = pmtRecordsArray.length;
      
      for (let i = 0; i < pmtRecordsArray.length; i++) {
        const [pmtId, record] = pmtRecordsArray[i];
        
        // Generate a fighter_id in the format firstlastDDMMYYYY
        const formattedFighterId = generateFighterId(record);
        
        // Try to find the fighter in techbouts_fighters collection by pmt_id
        const pmtIdQuery = query(
          collection(techboutsDb, 'techbouts_fighters'),
          where('pmt_id', '==', pmtId),
          limit(1)
        );
        
        let fighterSnapshot = await getDocs(pmtIdQuery);
        
        // If not found with pmt_id, try with fighter_id
        if (fighterSnapshot.empty) {
          const fighterIdQuery = query(
            collection(techboutsDb, 'techbouts_fighters'),
            where('fighter_id', '==', formattedFighterId),
            limit(1)
          );
          fighterSnapshot = await getDocs(fighterIdQuery);
        }
        
        if (!fighterSnapshot.empty) {
          // Fighter exists, update their record with all PMT details
          const fighterDoc = fighterSnapshot.docs[0];
          const fighterData = fighterDoc.data();
          
          // Create an update object with proper typing
          const updateData: Record<string, any> = {
            // Store the PMT ID
            pmt_id: pmtId,
            
            // Basic fight record stats
            pmt_win: record.wins,
            pmt_loss: record.losses,
            pmt_nc: record.nc, // No contests
            pmt_dq: record.dq, // Disqualifications
            
            // Tournament stats
            pmt_tournament_wins: record.tournament_wins,
            pmt_tournament_losses: record.tournament_losses,
            
            // Skill ratings
            pmt_bodykick: record.bodykick,
            pmt_boxing: record.boxing,
            pmt_clinch: record.clinch,
            pmt_defense: record.defense,
            pmt_footwork: record.footwork,
            pmt_headkick: record.headkick,
            pmt_kicks: record.kicks,
            pmt_knees: record.knees,
            pmt_legkick: record.legkick,
            pmt_ringawareness: record.ringawareness,
            
            // Additional data
            pmt_weightclasses: record.weightclasses,
            pmt_fights: record.fights,
            
            // Metadata
            pmt_lastUpdated: record.lastUpdated,
            pmt_searchKeywords: record.searchKeywords,
            
            // Update timestamp
            updated_at: new Date().toISOString()
          };
          
          // If TechBouts record has no email but PMT does, add it
          if ((!fighterData.email || fighterData.email === '') && record.email && record.email !== '') {
            updateData.email = record.email;
          }
          
          // Update the fighter in the database
          batch.update(doc(techboutsDb, 'techbouts_fighters', fighterDoc.id), updateData);
          
          updatedCount++;
        } else {
          // Fighter doesn't exist, create a new record with the specific document ID
          batch.set(doc(techboutsDb, 'techbouts_fighters', formattedFighterId), {
            // Basic fighter info
            first: record.first,
            last: record.last,
            gym: record.gym,
            pmt_id: pmtId,
            fighter_id: formattedFighterId, // Use the formatted ID
            docId: formattedFighterId,  // Also set docId to match fighter_id
            email: record.email || '',  // Ensure email field exists even if empty
            gender: record.gender || '',
            
            // Basic fight record stats
            pmt_win: record.wins,
            pmt_loss: record.losses,
            pmt_nc: record.nc,
            pmt_dq: record.dq,
            
            // Tournament stats
            pmt_tournament_wins: record.tournament_wins,
            pmt_tournament_losses: record.tournament_losses,
            
            // Skill ratings
            pmt_bodykick: record.bodykick,
            pmt_boxing: record.boxing,
            pmt_clinch: record.clinch,
            pmt_defense: record.defense,
            pmt_footwork: record.footwork,
            pmt_headkick: record.headkick,
            pmt_kicks: record.kicks,
            pmt_knees: record.knees,
            pmt_legkick: record.legkick,
            pmt_ringawareness: record.ringawareness,
            
            // Additional data
            pmt_weightclasses: record.weightclasses,
            pmt_fights: record.fights,
            
            // Set default values for other fields to avoid errors
            mt_win: 0,
            mt_loss: 0,
            win: 0,
            loss: 0,
            mma_win: 0,
            mma_loss: 0,
            
            // Metadata
            pmt_lastUpdated: record.lastUpdated,
            pmt_searchKeywords: record.searchKeywords,
            age: record.age || 0,
            dob: record.dob || '',
            
            // Empty strings for other fields
            city: "",
            state: "",
            coach: "",
            coach_email: "",
            coach_phone: "",
            phone: "",
            height: "",
            
            // Timestamps
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
          
          createdCount++;
        }
        
        operationCount++;
        
        // Calculate and report progress percentage
        const progressPercentage = Math.round(((i + 1) / totalRecords) * 100);
        if (i % 10 === 0 || i === pmtRecordsArray.length - 1) {
          progressCallback?.(`Processing fighter ${i + 1} of ${totalRecords} (${progressPercentage}%)`);
        }
        
        if (operationCount >= BATCH_SIZE) {
          progressCallback?.(`Committing batch of ${operationCount} operations... (${progressPercentage}%)`);
          await batch.commit();
          batch = writeBatch(techboutsDb);
          operationCount = 0;
        }
      }
      
      // Commit any remaining operations
      if (operationCount > 0) {
        progressCallback?.(`Committing final batch of ${operationCount} operations... (100%)`);
        await batch.commit();
      }
      

      if (processedEvents.length > 0) {
        progressCallback?.(`Saving ${processedEvents.length} processed events to Firestore...`);
        
        // Save the processed events to a document in the system_metadata collection
        await setDoc(doc(techboutsDb, 'system_metadata', 'processedPmtEventsJson'), {
          events: processedEvents,
          lastUpdated: new Date().toISOString()
        });
        
        progressCallback?.(`Successfully saved processed events to Firestore.`);
      }


      return {
        success: true,
        updated: updatedCount,
        created: createdCount,
        message: `Successfully processed ${updatedCount + createdCount} fighter records. Updated: ${updatedCount}, Created: ${createdCount}`
      };
      
    } catch (error) {
      console.error('Error merging PMT records with TechBouts:', error);
      throw error;
    }

// here can the processed events be saved to firestore


  }