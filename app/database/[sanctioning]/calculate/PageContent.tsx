// app/database/[sanctioning]/calculate/CalculateRecordsClient.tsx
'use client';

// CURRENTLY YOU HAVE TO DISABLE AUTH IN ORDER TO CALCULATE RECORDS

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { calculateAndStoreRecords as calculatePMTRecords } from '@/utils/pmt/calculateRecords';
import { calculateAndStoreRecords as calculateIKFRecords } from '@/utils/pmt/calculateRecords';

// import AuthDisplay from '@/components/ui/AuthDisplay';
// import { useAuth } from '@/context/AuthContext';



interface CalculateRecordsClientProps {
  sanctioning: string;
}

export default function CalculateRecordsClient({ sanctioning }: CalculateRecordsClientProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Default to a recent year (adjust as needed)
  const [selectedYear, setSelectedYear] = useState<string>('2024');
//  const { user, isAdmin, isNewUser } = useAuth();

  // if (!isAdmin) {
  //   return (
  //     <div className="container mx-auto py-6">
  //       <Card>
  //         <CardContent>
  //           <p className="text-center py-4">Please login to access this feature.</p>
  //         </CardContent>
  //       </Card>
  //     </div>
  //   );
  // }



  const handleCalculate = async () => {
    setLoading(true);
    setError(null);
    setProgress([]);

    try {
      let result;
      if (sanctioning === 'ikf') {
        result = await calculateIKFRecords(selectedYear, (message) =>
          setProgress((prev) => [...prev, message])
        );
      } else  if (sanctioning.toLowerCase() === 'pmt') {
        result = await calculatePMTRecords(selectedYear, (message) =>
          setProgress((prev) => [...prev, message])
        );
      } else {
        throw new Error('Invalid sanctioning body specified');
      }

      setProgress((prev) => [...prev, result.message]);
    } catch (error) {
      setError('Error calculating records. Check console for details.');
      console.error('Calculate records error:', error);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div className="container mx-auto py-6 space-y-6">
        {/* <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isNewUser={isNewUser}
      /> */}
      <Card>
        <CardHeader>
          <CardTitle>
            Calculate {sanctioning.toUpperCase()} Fighter Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label htmlFor="year-select" className="block text-sm font-medium text-gray-700">
                Select Year
              </label>
              <select
                id="year-select"
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              >
                <option value="2025">2025</option>
                <option value="2024">2024</option>
                <option value="2023">2023</option>
                <option value="2022">2022</option>
            
              </select>
            </div>
            <Button onClick={handleCalculate} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Calculate Records
            </Button>

            {error && (
              <div className="text-red-500 mt-4 p-3 bg-red-50 rounded-md">{error}</div>
            )}

            {progress.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-md max-h-96 overflow-y-auto space-y-2">
                {progress.map((message, index) => (
                  <div key={index} className="text-sm">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
