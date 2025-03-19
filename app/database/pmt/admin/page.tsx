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

// ✅ Import Firebase from your PMT config
import { app } from "@/lib/firebase_pmt/config";

// ✅ Initialize Firebase Functions
const functions = getFunctions(app);

export default function FighterDatabase() {
  const { isAdmin } = useAuth();

  // ✅ State for Year Selection and Response Handling
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [responseMessage, setResponseMessage] = useState<string | null>(null);

  const [merging, setMerging] = useState(false);
  const [mergeMessage, setMergeMessage] = useState<string | null>(null);

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
    setMergeMessage(null);
  
    try {
      const mergeRecords = httpsCallable<void, { success: boolean; totalMerged: number }>(
        functions,
        "merge_pmt_records_historical"
      );
      
      // ✅ Corrected function call with no arguments
      const response = await mergeRecords();
      const data = response.data;
  
      setMergeMessage(`✅ Successfully merged ${data.totalMerged} fighters.`);
    } catch (error: unknown) {
      if (error instanceof Error) {
        setMergeMessage(`❌ Merge Failed: ${error.message}`);
      } else {
        setMergeMessage("❌ An unknown error occurred.");
      }
    }
  
    setMerging(false);
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
              </SelectContent>
            </Select>

            {/* ✅ Process Button */}
            <Button onClick={handleProcessRecords} disabled={loading}>
              {loading ? <Loader2 className="animate-spin h-5 w-5 mr-2" /> : "Process Records"}
            </Button>
          </div>

          {/* ✅ Response Message */}
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
        </CardContent>
      </Card>

      <div className="text-center mt-8">
        <p className="text-sm text-muted-foreground">TechBouts Database Administration • {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
