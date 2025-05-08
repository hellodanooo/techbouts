"use client";

import React, { useState } from "react";
import Image from "next/image";
import Header from "@/components/headers/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import { AlertTriangle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getFunctions, httpsCallable } from "firebase/functions";
import { collection, getDocs,getDoc, doc, setDoc, getFirestore } from "firebase/firestore";
import { Progress } from "@/components/ui/progress";

// Import Firebase from your PMT config
import { app } from "@/lib/firebase_pmt/config";

// Initialize Firebase Functions and Firestore
const functions = getFunctions(app);
const db = getFirestore(app);

export default function FighterDatabase() {
  const { isAdmin } = useAuth();

  // ✅ State for Year Selection and Response Handling
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);


 // State for merging process
 const [merging, setMerging] = useState(false);
 const [mergeMessage, setMergeMessage] = useState<string | null>(null);
 const [progress, setProgress] = useState(0);
 const [progressDetail, setProgressDetail] = useState<string>("");


  const handleProcessRecords = async () => {
    if (!selectedYear) {
      setResponseMessage("Please select a year.");
      return;
    }
  
    setLoading(true);
    setResponseMessage(null);
  
    try {
      const calcPmtRecordsYear = httpsCallable<{ year: number }, { totalFighters: number }>(
        functions,
        "calc_pmt_records_year"
      );
      
      const response = await calcPmtRecordsYear({ year: selectedYear });
  
      const data = response.data as { totalFighters: number };
  
      setResponseMessage(`✅ Success: Processed ${data.totalFighters} fighters.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setResponseMessage(`❌ Error: ${error.message}`);
      } else {
        setResponseMessage("❌ An unknown error occurred.");
      }
    }
  
    setLoading(false);
  };
  





const handleOptimizedMergeRecords = async () => {
  setMerging(true);
  setMergeMessage("Starting optimized merge process...");
  setProgress(0);
  setProgressDetail("");
  
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    const historicalYears = [];
    const currentCollection = `pmt_records_current`;
    
    // STEP 1: Check if we need to update the baseline (beginning of year or new setup)
    const metadataRef = doc(db, "records_metadata", "current_metadata");
    const metadataSnap = await getDoc(metadataRef);
    const metadata = metadataSnap.exists() ? metadataSnap.data() : null;
    
    // If no metadata exists or lastBaselineUpdate is from previous year, we need to rebuild baseline
    const needsBaselineUpdate = !metadata || 
      (metadata.lastBaselineUpdate && new Date(metadata.lastBaselineUpdate).getFullYear() < currentYear);
    
    if (needsBaselineUpdate) {
      setProgressDetail("Creating new baseline from historical data...");
      
      // Find all historical collections
      for (let year = 2022; year < currentYear; year++) {
        const collectionName = `pmt_records_${year}`;
        try {
          const testQuery = await getDocs(collection(db, collectionName));
          if (!testQuery.empty) {
            historicalYears.push(year);
          }
        } catch (error) {
          console.log(`Collection ${collectionName} doesn't exist or is empty:`, error);
        }
      }
      
      if (historicalYears.length === 0) {
        setMergeMessage("❌ No historical collections found to merge.");
        setMerging(false);
        return;
      }
      
      // Sort years numerically
      historicalYears.sort((a, b) => a - b);
      
      // STEP 2: Create/update the merged baseline
      setProgressDetail(`Building baseline from years: ${historicalYears.join(", ")}...`);
      setProgress(10);
      
      // Map to store merged records
      const baselineFighters = new Map();
      let totalProcessedBaseline = 0;
      
      // Process each historical year
      for (let i = 0; i < historicalYears.length; i++) {
        const year = historicalYears[i];
        const yearCollection = `pmt_records_${year}`;
        setProgressDetail(`Processing ${yearCollection} for baseline...`);
        
        const yearSnapshot = await getDocs(collection(db, yearCollection));
        
        if (yearSnapshot.empty) {
          setProgressDetail(`${yearCollection} is empty, skipping.`);
          continue;
        }
        
        // Process all fighters from this year
        yearSnapshot.forEach(doc => {
          // Skip metadata and error documents
          if (doc.id === "metadata" || doc.id === "errors") return;
          
          const fighterData = doc.data();
          const fighterId = fighterData.pmt_id;
          
          if (!fighterId) {
            console.warn(`Skipping document ${doc.id} in ${yearCollection} (missing pmt_id)`);
            return;
          }
          
          // First time seeing this fighter
          if (!baselineFighters.has(fighterId)) {
            // Initialize fighter data
            baselineFighters.set(fighterId, {
              ...fighterData,
              historical_years: [year],
              lastBaselineUpdate: new Date().toISOString()
            });
          } 
          // Merge with existing record
          else {
            const existing = baselineFighters.get(fighterId);
            
            // Merge stats
            existing.win = (existing.win || 0) + (fighterData.win || 0);
            existing.loss = (existing.loss || 0) + (fighterData.loss || 0);
            existing.nc = (existing.nc || 0) + (fighterData.nc || 0);
            existing.dq = (existing.dq || 0) + (fighterData.dq || 0);
            
            // Merge individual stats
            existing.bodykick = (existing.bodykick || 0) + (fighterData.bodykick || 0);
            existing.boxing = (existing.boxing || 0) + (fighterData.boxing || 0);
            existing.clinch = (existing.clinch || 0) + (fighterData.clinch || 0);
            existing.defense = (existing.defense || 0) + (fighterData.defense || 0);
            existing.footwork = (existing.footwork || 0) + (fighterData.footwork || 0);
            existing.headkick = (existing.headkick || 0) + (fighterData.headkick || 0);
            existing.kicks = (existing.kicks || 0) + (fighterData.kicks || 0);
            existing.knees = (existing.knees || 0) + (fighterData.knees || 0);
            existing.legkick = (existing.legkick || 0) + (fighterData.legkick || 0);
            existing.ringawareness = (existing.ringawareness || 0) + (fighterData.ringawareness || 0);
            
            // Merge fights arrays
            existing.fights = [...(existing.fights || []), ...(fighterData.fights || [])];
            
            // Merge weightclasses (unique)
            existing.weightclasses = [...new Set([
              ...(existing.weightclasses || []), 
              ...(fighterData.weightclasses || [])
            ])];
            
            // Merge events_participated arrays
            existing.events_participated = [...new Set([
              ...(existing.events_participated || []), 
              ...(fighterData.events_participated || [])
            ])];
            
            // Update historical years
            if (!existing.historical_years.includes(year)) {
              existing.historical_years.push(year);
              existing.historical_years.sort();
            }
            
            // Update lastBaselineUpdate
            existing.lastBaselineUpdate = new Date().toISOString();
            
            // Update the Map
            baselineFighters.set(fighterId, existing);
          }
          
          totalProcessedBaseline++;
        });
        
        // Update progress
        setProgress(10 + Math.round((i + 1) / historicalYears.length * 30));
        setProgressDetail(`Processed ${yearCollection}: ${totalProcessedBaseline} fighters in baseline`);
      }
      
      // STEP 3: Write baseline to current_records collection
      setProgressDetail(`Writing ${baselineFighters.size} baseline records to ${currentCollection}...`);
      
      // Convert Map to array for Firestore
      const baselineArray = Array.from(baselineFighters.entries()).map(([id, record]) => ({
        id,
        ...record,
        lastBaselineUpdate: new Date().toISOString()
      }));
      
      // Use batches to write records
      const MAX_BATCH_SIZE = 350;
      let batchCount = 0;
      
      for (let i = 0; i < baselineArray.length; i += MAX_BATCH_SIZE) {
        const chunk = baselineArray.slice(i, i + MAX_BATCH_SIZE);
        setProgressDetail(`Writing baseline batch ${batchCount + 1} (${chunk.length} records)...`);
        
        const writePromises = chunk.map(record => {
          const docRef = doc(db, currentCollection, record.pmt_id);
          return setDoc(docRef, record, { merge: true });
        });
        
        await Promise.all(writePromises);
        batchCount++;
        
        // Update progress
        setProgress(40 + Math.round((i + chunk.length) / baselineArray.length * 30));
        setProgressDetail(`Baseline batch ${batchCount} committed: ${chunk.length} records`);
      }
      
      // Update metadata with the new baseline information
      await setDoc(doc(db, "records_metadata", "current_metadata"), {
        baselineFighters: baselineArray.length,
        baselineYears: historicalYears,
        lastBaselineUpdate: new Date().toISOString()
      }, { merge: true });
      
      setProgressDetail(`Baseline updated with ${baselineArray.length} fighters from years ${historicalYears.join(", ")}`);
    } else {
      setProgressDetail("Baseline is up-to-date, skipping historical merge.");
      setProgress(50);
    }
    
    // STEP 4: Now merge current year data on top of the baseline
    const currentYearCollection = `pmt_records_${currentYear}`;
    setProgressDetail(`Merging current year records from ${currentYearCollection}...`);
    
    try {
      // Check if current year collection exists
      const currentYearQuery = await getDocs(collection(db, currentYearCollection));
      
      if (currentYearQuery.empty) {
        setProgressDetail(`No records found for current year ${currentYear}, baseline is complete.`);
        setProgress(100);
        setMergeMessage(`✅ Optimized merge complete. Baseline is updated with all historical data.`);
        setMerging(false);
        return;
      }
      
      // Process current year records
      let totalCurrentFighters = 0;
      const modifiedFighters = new Set();
      
      currentYearQuery.forEach(doc => {
        if (doc.id === "metadata" || doc.id === "errors") return;
        
        const fighterData = doc.data();
        const fighterId = fighterData.pmt_id;
        
        if (fighterId) {
          modifiedFighters.add(fighterId);
          totalCurrentFighters++;
        }
      });
      
      setProgressDetail(`Found ${totalCurrentFighters} fighters in current year ${currentYear}.`);
      
      // Batch update current fighters with current year data
      const MAX_BATCH_SIZE = 400;
      let batchCount = 0;
      let processedFighters = 0;
      
      // Process in batches of fighter IDs
      const fighterIds = Array.from(modifiedFighters);
      
      for (let i = 0; i < fighterIds.length; i += MAX_BATCH_SIZE) {
        const chunk = fighterIds.slice(i, i + MAX_BATCH_SIZE);
        setProgressDetail(`Processing current year batch ${batchCount + 1} (${chunk.length} fighters)...`);
        
        // For each fighter in this batch
        const updatePromises = chunk.map(async (fighterId) => {
          // Get current year record
          const currentYearDoc = await getDoc(doc(db, currentYearCollection, fighterId as string));
          
          if (!currentYearDoc.exists()) return null;
          
          const currentYearData = currentYearDoc.data();
          
          // Get current record from baseline/current collection
          const currentRecordDoc = await getDoc(doc(db, currentCollection, fighterId as string));
          
          let updatedRecord;
          
          if (currentRecordDoc.exists()) {
            // Merge current year data with baseline
            const baselineRecord = currentRecordDoc.data();
            
            // Start with baseline
            updatedRecord = {
              ...baselineRecord,
              
              // Add current year stats
              win: (baselineRecord.win || 0) + (currentYearData.win || 0),
              loss: (baselineRecord.loss || 0) + (currentYearData.loss || 0),
              nc: (baselineRecord.nc || 0) + (currentYearData.nc || 0),
              dq: (baselineRecord.dq || 0) + (currentYearData.dq || 0),
              
              // Add current year skill stats
              bodykick: (baselineRecord.bodykick || 0) + (currentYearData.bodykick || 0),
              boxing: (baselineRecord.boxing || 0) + (currentYearData.boxing || 0),
              clinch: (baselineRecord.clinch || 0) + (currentYearData.clinch || 0),
              defense: (baselineRecord.defense || 0) + (currentYearData.defense || 0),
              footwork: (baselineRecord.footwork || 0) + (currentYearData.footwork || 0),
              headkick: (baselineRecord.headkick || 0) + (currentYearData.headkick || 0),
              kicks: (baselineRecord.kicks || 0) + (currentYearData.kicks || 0),
              knees: (baselineRecord.knees || 0) + (currentYearData.knees || 0),
              legkick: (baselineRecord.legkick || 0) + (currentYearData.legkick || 0),
              ringawareness: (baselineRecord.ringawareness || 0) + (currentYearData.ringawareness || 0),
              
              // Merge fights arrays
              fights: [...(baselineRecord.fights || []), ...(currentYearData.fights || [])],
              
              // Merge weightclasses (unique)
              weightclasses: [...new Set([
                ...(baselineRecord.weightclasses || []), 
                ...(currentYearData.weightclasses || [])
              ])],
              
              // Merge events_participated arrays
              events_participated: [...new Set([
                ...(baselineRecord.events_participated || []), 
                ...(currentYearData.events_participated || [])
              ])],
              
              // Track years
              current_year: currentYear,
              
              // Update timestamp
              lastUpdated: new Date().toISOString()
            };
          } else {
            // This is a new fighter not in the baseline
            updatedRecord = {
              ...currentYearData,
              first_appearance_year: currentYear,
              current_year: currentYear,
              lastUpdated: new Date().toISOString()
            };
          }
          
          // Write the merged record back to current collection
          return setDoc(doc(db, currentCollection, fighterId as string), updatedRecord, { merge: true });
        });
        
        await Promise.all(updatePromises.filter(Boolean));
        batchCount++;
        processedFighters += chunk.length;
        
        // Update progress
        setProgress(70 + Math.round(processedFighters / totalCurrentFighters * 30));
        setProgressDetail(`Current year batch ${batchCount} committed: ${chunk.length} fighters (${processedFighters}/${totalCurrentFighters})`);
      }
      
      // Update metadata with the current year information
      await setDoc(doc(db, "records_metadata", "current_metadata"), {
        currentYearFighters: totalCurrentFighters,
        currentYear: currentYear,
        lastCurrentUpdate: new Date().toISOString()
      }, { merge: true });
      
    } catch (error) {
      console.error("Error processing current year records:", error);
      setProgressDetail(`Error processing current year: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
    
    setProgress(100);
    setMergeMessage(`✅ Optimized merge complete. Current records now reflect all historical data and ${currentYear} updates.`);
    
  } catch (error) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Merge error:", error);
    }
    setMergeMessage(`❌ Optimized Merge Failed: ${errorMessage}`);
  } finally {
    setMerging(false);
  }
};
  
  




  // ✅ If user is not admin, show access denied
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-8">
        <Header />
        <div className="max-w-4xl mx-auto mt-8">
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Access Denied</AlertTitle>
            <AlertDescription>You do not have permission to access this page.</AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6">
      <Header />

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">TechBouts Fighter Database Administration</h1>
        <Image src="/logos/techboutslogoFlat.png" alt="TechBouts Database" width={125} height={62.5} className="rounded-lg" />
      </div>

      {/* ✅ Year Selection & Process Button */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Process PMT Fighter Records</CardTitle>
          <CardDescription>Select a year and process fighter records</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            {/* ✅ Dropdown to Select Year */}
            <Select onValueChange={(value) => setSelectedYear(Number(value))}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Select Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2022">2022</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2025">2025</SelectItem>
              </SelectContent>
            </Select>


            <Button onClick={handleProcessRecords} disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Process Records"}
            </Button>
          </div>


          {responseMessage && (
            <div className={`mt-4 text-sm ${responseMessage.includes("Error") ? "text-red-500" : "text-green-500"}`}>
              {responseMessage}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ✅ Merge Historical Records Button */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Merge Previous Years Records</CardTitle>
          <CardDescription>Merge all PMT records from previous years</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={handleOptimizedMergeRecords} disabled={merging}>
              {merging ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Merge Records"}
            </Button>
          </div>

          {/* ✅ Merge Response Message */}
          {mergeMessage && (
            <div className={`mt-4 text-sm ${mergeMessage.includes("Error") ? "text-red-500" : "text-green-500"}`}>
              {mergeMessage}
            </div>
          )}
          {merging && (
  <div className="mt-4">
    <Progress value={progress} className="h-2" />
    <p className="text-xs text-muted-foreground mt-1">{progressDetail}</p>
  </div>
)}
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">TechBouts Database Administration • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
