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
import { collection, getDocs, doc, setDoc, getFirestore } from "firebase/firestore";
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
  





const handleMergeRecords = async () => {
  setMerging(true);
  setMergeMessage("Starting merge process...");
  setProgress(0);
  setProgressDetail("");
  
  try {
    // Get current year
    const currentYear = new Date().getFullYear();
    
    // Get all collections
    setProgressDetail("Scanning collections...");
    
    // We can't directly list collections in the client SDK, so we need to query known collections
    const yearCollections: string[] = [];
    
    // Check known year collections (assuming you have records for 2022-2025)
    for (let year = 2022; year < currentYear; year++) {
      const collectionName = `pmt_records_${year}`;
      // Check if collection exists by trying to get the metadata document
      try {
        const testQuery = await getDocs(collection(db, collectionName));
        if (!testQuery.empty) {
          yearCollections.push(collectionName);
        }
      } catch (error) {
        console.log(`Collection ${collectionName} doesn't exist or is empty:`, error);
      }
    }
    
    if (yearCollections.length === 0) {
      setMergeMessage("❌ No year collections found to merge.");
      setMerging(false);
      return;
    }
    
    setProgressDetail(`Found ${yearCollections.length} collections: ${yearCollections.join(", ")}`);
    setProgress(10);
    
    // Create a Map to store merged fighter records
    const fighterRecords = new Map();
    let totalProcessedFighters = 0;
    
    // Process each year collection
    for (let i = 0; i < yearCollections.length; i++) {
      const yearCollection = yearCollections[i];
      setProgressDetail(`Processing ${yearCollection}...`);
      
      // Get fighter documents from this collection
      const yearSnapshot = await getDocs(collection(db, yearCollection));
      
      if (yearSnapshot.empty) {
        setProgressDetail(`${yearCollection} is empty, skipping.`);
        continue;
      }
      
      // Process each fighter in this collection
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
        if (!fighterRecords.has(fighterId)) {
          // Initialize events_participated if needed
          let events_participated = [];
          
          // Handle different formats of events_participated
          if (fighterData.events_participated) {
            if (Array.isArray(fighterData.events_participated)) {
              // Check if it's an array of strings or objects
              if (fighterData.events_participated.length > 0) {
                if (typeof fighterData.events_participated[0] === 'string') {
                  // Convert array of strings to array of objects
                  events_participated = fighterData.events_participated.map(eventId => ({ eventId }));
                } else {
                  // It's already an array of objects
                  events_participated = fighterData.events_participated;
                }
              }
            }
          }
          
          fighterRecords.set(fighterId, {
            ...fighterData,
            events_participated: events_participated,
            years: [yearCollection.replace("pmt_records_", "")]
          });
        } 
        // Merge with existing record
        else {
          const existing = fighterRecords.get(fighterId);
          
          // Add stats
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
          
          // Merge events_participated arrays (ensuring unique event IDs)
          if (!existing.events_participated) {
            existing.events_participated = [];
          }
          
          if (fighterData.events_participated) {
            // Handle different formats of events_participated from the fighter data
            let newEvents = [];
            
            if (Array.isArray(fighterData.events_participated)) {
              if (fighterData.events_participated.length > 0) {
                if (typeof fighterData.events_participated[0] === 'string') {
                  // It's an array of strings
                  newEvents = fighterData.events_participated.map(eventId => ({ eventId }));
                } else {
                  // It's already an array of objects
                  newEvents = fighterData.events_participated;
                }
              }
            }
            
            // Create a set of existing event IDs for quick lookup
            interface EventParticipation {
              eventId: string;
            }

            type ExistingEvent = string | EventParticipation;

            const existingEventIds = new Set(
              existing.events_participated.map((event: ExistingEvent) => 
                typeof event === 'string' ? event : event.eventId
              )
            );
            
            // Add only unique events
            newEvents.forEach(event => {
              const eventId = typeof event === 'string' ? event : event.eventId;
              if (!existingEventIds.has(eventId)) {
                existing.events_participated.push(typeof event === 'string' ? { eventId: event } : event);
              }
            });
          }
          
          // Update lastUpdated
          existing.lastUpdated = new Date().toISOString();
          
          // Add year to years array if not already included
          const yearValue = yearCollection.replace("pmt_records_", "");
          if (!existing.years.includes(yearValue)) {
            existing.years.push(yearValue);
          }
          
          // Update the Map
          fighterRecords.set(fighterId, existing);
        }
        
        totalProcessedFighters++;
      });
      
      // Update progress after each collection
      setProgress(10 + Math.round((i + 1) / yearCollections.length * 40));
      setProgressDetail(`Processed ${yearCollection}: ${totalProcessedFighters} fighters so far`);
    }
    
    // Write merged records to historical collection
    const historicalCollection = "pmt_records_historical";
    setProgressDetail(`Writing ${fighterRecords.size} merged records to ${historicalCollection}...`);
    
    // Convert Map to array for Firestore
    const recordsArray = Array.from(fighterRecords.entries()).map(([id, record]) => ({
      id,
      ...record,
      lastUpdated: new Date().toISOString()
    }));
    
    // Use batches to write records (Firestore has a 500 document limit per batch)
    const MAX_BATCH_SIZE = 400; // Keep slightly below the 500 limit to be safe
    let batchCount = 0;
    
    for (let i = 0; i < recordsArray.length; i += MAX_BATCH_SIZE) {
      const chunk = recordsArray.slice(i, i + MAX_BATCH_SIZE);
      setProgressDetail(`Writing batch ${batchCount + 1} (${chunk.length} records)...`);
      
      // We have to write documents one by one since client SDK doesn't support batches the same way
      const writePromises = chunk.map(record => {
        const docRef = doc(db, historicalCollection, record.pmt_id);
        return setDoc(docRef, record, { merge: true });
      });
      
      await Promise.all(writePromises);
      batchCount++;
      
      // Update progress
      setProgress(50 + Math.round((i + chunk.length) / recordsArray.length * 50));
      setProgressDetail(`Batch ${batchCount} committed: ${chunk.length} records`);
    }
    
    setProgress(100);
    setMergeMessage(`✅ Successfully merged ${recordsArray.length} fighters into historical collection!`);
    
    // Create a metadata document
    await setDoc(doc(db, historicalCollection, "metadata"), {
      totalFighters: recordsArray.length,
      lastUpdated: new Date().toISOString(),
      sourceCollections: yearCollections,
    });
    
  } catch (error: unknown) {
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) {
      errorMessage = error.message;
      console.error("Merge error:", error);
    }
    setMergeMessage(`❌ Merge Failed: ${errorMessage}`);
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
          <CardTitle>Merge Historical Records</CardTitle>
          <CardDescription>Merge all PMT records into a historical dataset</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4">
            <Button onClick={handleMergeRecords} disabled={merging}>
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
