// components/tables/FighterSearchTable.tsx
// this page has the ability to send the fighters to techbouts database

'use client';

import React, { useState, useEffect } from 'react';
import FighterTable from '@/components/tables/FightersTable';
import { Input } from "@/components/ui/input";


// import { db } from '@/lib/firebase_techbouts/config';
// import { 
//   collection, 
//   doc, 
//   getDoc, 
//   setDoc, 
//   writeBatch,
//   query,
//   getDocs
// } from 'firebase/firestore';

import { Fighter } from '@/utils/records/fetchFighters';

interface MultiTermSearchProps {
  initialFighters: Fighter[];
  sanctioning: string;
  year: string;
}

const FighterSearchTable: React.FC<MultiTermSearchProps> = ({ initialFighters, sanctioning, year }) => {
  const [searchInput, setSearchInput] = useState('');
  const [terms, setTerms] = useState<string[]>([]);
  const [fighters, setFighters] = useState<Fighter[]>(initialFighters);
  const [loading, setLoading] = useState(false);
 
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Convert input to search terms
    const newTerms = value
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);
    
    setTerms(newTerms);
  };

  // When the search terms change, call the API to search for matching fighters.
  useEffect(() => {
    const fetchSearchResults = async () => {
      setLoading(true);
      try {
        if (terms.length > 0) {
          // Build a comma-separated string of terms
          const queryParam = terms.join(',');
          const res = await fetch(
            `/api/${sanctioning}/fighters/searchFighters?year=${year}&terms=${encodeURIComponent(queryParam)}`
          );
          
          const data = await res.json();
          if (res.ok) {
            setFighters(data.fighters);
          } else {
            console.error(data.error);
          }
        } else {
          // Reset to initial fighters if no search terms
          setFighters(initialFighters);
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setLoading(false);
      }
    };

    // Add a small delay to prevent too many API calls while typing
    const timeoutId = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [terms, initialFighters, sanctioning, year]);


  // const SendFightersToTechBouts = async (fighters: Fighter[]) => {
  //   try {
  //     const batch = writeBatch(db);
  //     const fightersCollection = collection(db, 'techbouts_fighters');
  //     let addedCount = 0;
  //     let existingCount = 0;
  //     let errorCount = 0;
  
  //     // Process fighters in chunks to avoid batch size limits
  //     const chunkSize = 500;
  //     for (let i = 0; i < fighters.length; i += chunkSize) {
  //       const chunk = fighters.slice(i, i + chunkSize);
        
  //       // Check each fighter in the chunk
  //       for (const fighter of chunk) {
  //         try {
  //           // Use the existing fighter_id
  //           const fighterRef = doc(fightersCollection, fighter.fighter_id);
  //           const fighterDoc = await getDoc(fighterRef);
  
  //           if (!fighterDoc.exists()) {
  //             // Prepare fighter data
  //             const fighterData = {
  //               ...fighter,
  //               docId: fighter.fighter_id, // Ensure docId matches fighter_id
  //               updated_at: new Date().toISOString(),
  //               created_at: new Date().toISOString()
  //             };
  
  //             // Add to batch
  //             batch.set(fighterRef, fighterData);
  //             addedCount++;
  //           } else {
  //             existingCount++;
  //           }
  //         } catch (error) {
  //           console.error('Error processing fighter:', error);
  //           errorCount++;
  //         }
  //       }
  
  //       // Commit batch for this chunk
  //       try {
  //         await batch.commit();
  //         console.log(`Batch committed successfully: ${i + chunk.length}/${fighters.length} fighters processed`);
  //       } catch (error) {
  //         console.error('Error committing batch:', error);
  //         throw error;
  //       }
  //     }
  
  //     // Final status
  //     console.log(`Upload complete:
  //       Added: ${addedCount}
  //       Already existed: ${existingCount}
  //       Errors: ${errorCount}
  //       Total processed: ${fighters.length}
  //     `);
  
  //     return {
  //       success: true,
  //       addedCount,
  //       existingCount,
  //       errorCount,
  //       totalProcessed: fighters.length
  //     };
  
  //   } catch (error) {
  //     console.error('Error in SendFightersToTechBouts:', error);
  //     return {
  //       success: false,
  //       error: error instanceof Error ? error.message : 'Unknown error'
  //     };
  //   }
  // };
  



  
  // const handleSendToTechBouts = async () => {
  //   setUploadStatus({ isUploading: true, message: 'Starting upload...' });
  //   try {
  //     const result = await SendFightersToTechBouts(fighters);
      
  //     if (result.success) {
  //       setUploadStatus({
  //         isUploading: false,
  //         message: `Upload complete! Added: ${result.addedCount}, Already existed: ${result.existingCount}, Errors: ${result.errorCount}`
  //       });
  //     } else {
  //       setUploadStatus({
  //         isUploading: false,
  //         message: `Upload failed: ${result.error}`
  //       });
  //     }
  //   } catch (error) {
  //     setUploadStatus({
  //       isUploading: false,
  //       message: `Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`
  //     });
  //   }
  // };


  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <div>
          
          {/* <div className="mb-4">
            <button
              onClick={handleSendToTechBouts}
              disabled={uploadStatus.isUploading}
              className={`px-4 py-2 rounded text-white ${
                uploadStatus.isUploading 
                  ? 'bg-gray-400' 
                  : 'bg-blue-500 hover:bg-blue-600'
              }`}
            >
              {uploadStatus.isUploading ? 'Uploading...' : 'Send To TechBouts Firebase'}
            </button>
            
            {uploadStatus.message && (
              <div className={`mt-2 p-2 rounded ${
                uploadStatus.message.includes('failed') 
                  ? 'bg-red-100 text-red-700' 
                  : 'bg-green-100 text-green-700'
              }`}>
                {uploadStatus.message}
              </div>
            )}
          </div> */}


 <div className="mb-4">
            <Input
              placeholder="Search fighters..."
              value={searchInput}
              onChange={handleSearchChange}
              className="w-full"
            />
          </div>
          <FighterTable fighters={fighters} />
        </div>
      )}
    </div>
  );
};

export default FighterSearchTable;