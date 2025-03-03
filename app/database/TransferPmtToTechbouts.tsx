"use client";

import { useState, useEffect } from 'react';
import { calculateRecordsAll, FighterRecord } from '@/utils/pmt/calculateRecordsAll';
import { addMergePmtRecords } from '@/utils/pmt/addMergePmtRecords';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Loader2, Check, AlertTriangle } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useAuth } from '@/context/AuthContext';

export default function TransferPmtToTechbouts() {
  const [pmtRecords, setPmtRecords] = useState<Map<string, FighterRecord>>(new Map());
  const [filteredRecords, setFilteredRecords] = useState<[string, FighterRecord][]>([]);
  const [isCalculating, setIsCalculating] = useState(false);
  const [isMerging, setIsMerging] = useState(false);
  const [progressMessage, setProgressMessage] = useState('');
  const [progressPercentage, setProgressPercentage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAdmin } = useAuth();

  const [mergeResults, setMergeResults] = useState<{
    success?: boolean;
    updated?: number;
    created?: number;
    message?: string;
  }>({});
  const [error, setError] = useState<string | null>(null);

  // Update filtered records whenever PMT records or search term changes
  useEffect(() => {
    if (pmtRecords.size === 0) {
      setFilteredRecords([]);
      return;
    }

    const recordsArray = Array.from(pmtRecords.entries());
    
    if (!searchTerm) {
      // Show first 100 records if no search term
      setFilteredRecords(recordsArray.slice(0, 100));
      return;
    }

    const lowerSearchTerm = searchTerm.toLowerCase();
    const filtered = recordsArray.filter(([, record]) => {
      return (
        record.first.toLowerCase().includes(lowerSearchTerm) ||
        record.last.toLowerCase().includes(lowerSearchTerm) ||
        record.gym.toLowerCase().includes(lowerSearchTerm) ||
        record.pmt_id.toLowerCase().includes(lowerSearchTerm)
      );
    });

    setFilteredRecords(filtered.slice(0, 100)); // Limit to 100 results for performance
  }, [pmtRecords, searchTerm]);

  const handleCalculateRecords = async () => {
    setIsCalculating(true);
    setError(null);
    setProgressMessage('Starting calculation...');
    setProgressPercentage(0);
    
    try {
      // Custom progress callback to update UI
      const progressCallback = (message: string) => {
        setProgressMessage(message);
        
        // Extract percentage if available in the message
        const percentMatch = message.match(/(\d+)%/);
        if (percentMatch) {
          setProgressPercentage(parseInt(percentMatch[1]));
        }
      };
      
      const recordsMap = await calculateRecordsAll(progressCallback);
      setPmtRecords(recordsMap);
      setProgressMessage(`Completed! Found ${recordsMap.size} fighter records.`);
      setProgressPercentage(100);
    } catch (err) {
      console.error('Error calculating PMT records:', err);
      setError(`Failed to calculate PMT records: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsCalculating(false);
    }
  };

  const handleMergeToTechbouts = async () => {
    if (pmtRecords.size === 0) {
      setError('No PMT records to merge. Please calculate records first.');
      return;
    }
    
    setIsMerging(true);
    setError(null);
    setProgressMessage('Starting merge operation...');
    setProgressPercentage(0);
    setMergeResults({});
    
    try {
      // Custom progress callback for merge operation
      const mergeProgressCallback = (message: string) => {
        setProgressMessage(message);
        
        // Extract percentage if available
        const percentMatch = message.match(/(\d+)%/);
        if (percentMatch) {
          setProgressPercentage(parseInt(percentMatch[1]));
        }
      };
      
      const results = await addMergePmtRecords(
        techboutsDb,
        pmtRecords,
        mergeProgressCallback
      );
      
      setMergeResults(results);
      setProgressMessage(`Merge completed! Updated: ${results.updated}, Created: ${results.created}`);
      setProgressPercentage(100);
    } catch (err) {
      console.error('Error merging to TechBouts:', err);
      setError(`Failed to merge to TechBouts: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setIsMerging(false);
    }
  };

  // If user is not an admin, show access denied message
  if (!isAdmin) {
    return (
      <div className="container mx-auto py-16 flex flex-col items-center justify-center min-h-[60vh]">
        <Alert variant="destructive" className="max-w-md">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Access Denied</AlertTitle>
          <AlertDescription>
            You dont have permission to access this page. Admin privileges are required.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Transfer PMT Records to TechBouts</h1>
      
      {/* Control Panel */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        {/* Calculate Records Card */}
        <Card>
          <CardHeader>
            <CardTitle>Step 1: Calculate PMT Records</CardTitle>
            <CardDescription>
              Retrieve and calculate all fighter records from the PMT database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleCalculateRecords} 
              disabled={isCalculating}
              className="w-full"
            >
              {isCalculating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Calculating...
                </>
              ) : (
                'Calculate PMT Records'
              )}
            </Button>
          </CardContent>
          <CardFooter>
            {pmtRecords.size > 0 && (
              <Badge variant="outline" className="ml-auto">
                {pmtRecords.size} Records Found
              </Badge>
            )}
          </CardFooter>
        </Card>

        {/* Merge Records Card */}
        <Card>
          <CardHeader>
            <CardTitle>Step 2: Merge to TechBouts</CardTitle>
            <CardDescription>
              Merge PMT records into the TechBouts database.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={handleMergeToTechbouts} 
              disabled={isMerging || pmtRecords.size === 0}
              className="w-full"
              variant="secondary"
            >
              {isMerging ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Merging...
                </>
              ) : (
                'Merge to TechBouts'
              )}
            </Button>
          </CardContent>
          <CardFooter>
            {mergeResults.success && (
              <div className="flex items-center ml-auto">
                <Check className="h-4 w-4 text-green-500 mr-2" />
                <span className="text-sm">
                  Updated: {mergeResults.updated}, Created: {mergeResults.created}
                </span>
              </div>
            )}
          </CardFooter>
        </Card>
      </div>

      {/* Progress Indicator */}
      {(isCalculating || isMerging) && (
        <Card className="mb-8">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Operation Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <Progress value={progressPercentage} className="mb-2" />
            <p className="text-sm text-muted-foreground">{progressMessage}</p>
          </CardContent>
        </Card>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive" className="mb-8">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Results Display */}
      {pmtRecords.size > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>PMT Fighter Records</CardTitle>
            <CardDescription>
              Showing {filteredRecords.length} of {pmtRecords.size} total records
            </CardDescription>
            <Input
              placeholder="Search by name, gym, or ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>PMT ID</TableHead>
                    <TableHead>Gym</TableHead>
                    <TableHead className="text-right">Record</TableHead>
                    <TableHead className="text-right">Weight Classes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.length > 0 ? (
                    filteredRecords.map(([id, fighter]) => (
                      <TableRow key={id}>
                        <TableCell className="font-medium">
                          {fighter.first} {fighter.last}
                        </TableCell>
                        <TableCell>{fighter.pmt_id}</TableCell>
                        <TableCell>{fighter.gym}</TableCell>
                        <TableCell className="text-right">
                          {fighter.wins}-{fighter.losses}
                          {fighter.nc > 0 && `-${fighter.nc}NC`}
                          {fighter.dq > 0 && `-${fighter.dq}DQ`}
                        </TableCell>
                        <TableCell className="text-right">
                          {fighter.weightclasses.join(', ')}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                        {searchTerm ? 'No matching records found.' : 'No records available.'}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}