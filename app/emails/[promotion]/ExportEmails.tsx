// app/emails/[promotion]/ExportEmails.tsx
'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { exportEmails as exportPMTEmails } from '@/utils/pmt/emailExport';
import { useAuth } from '@/context/AuthContext';

interface ExportEmailsClientProps {
  promotion: string;
}

export default function ExportEmailsClient({ promotion }: ExportEmailsClientProps) {
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedYear, setSelectedYear] = useState<string>('2024');
  const { user, isAdmin } = useAuth();
  
  const handleExport = async () => {
    setLoading(true);
    setError(null);
    setProgress([]);

    try {
      let result: { message: string } | null = null;
    
      if (promotion.toLowerCase() === 'pmt') {
        result = await exportPMTEmails(
          selectedYear,
          { user, isAdmin },  // Pass auth info
          (message) => setProgress((prev) => [...prev, message])
        );
      }
    
      if (result) {
        setProgress((prev) => [...prev, result.message]);
      }
    } catch (error) {
      setError('Error exporting emails. Check console for details.');
      console.error('Export emails error:', error);
    } finally {
      setLoading(false);
    }
};



  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Export {promotion.toUpperCase()} Fighter Emails
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
            <Button onClick={handleExport} disabled={loading} className="w-full sm:w-auto">
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Export Emails
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