// app/officials/[officialId]/OfficialDetailsClient.tsx
'use client';
import { useState, useEffect } from 'react';
import { Official } from '@/utils/types';

interface OfficialDetailsClientProps {
  officialId: string;
}

export default function OfficialDetailsClient({ officialId }: OfficialDetailsClientProps) {
  const [official, setOfficial] = useState<Official | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOfficialDetails();
  }, [officialId]);

  const fetchOfficialDetails = async () => {
    try {
      const [{ collection, doc, getDoc }, { db }] = await Promise.all([
        import('firebase/firestore'),
        import('@/lib/firebase_techbouts/config')
      ]);

      const officialsRef = collection(db, 'officials');
      const officialsDoc = doc(officialsRef, 'officials_json');
      const docSnap = await getDoc(officialsDoc);

      if (docSnap.exists()) {
        const officialsData = docSnap.data();
        const foundOfficial = officialsData.data.find(
          (off: Official) => off.officialId === officialId || off.officialId === officialId
        );

        if (foundOfficial) {
          setOfficial(foundOfficial);
        } else {
          setError('Official not found');
        }
      } else {
        setError('Officials data not found');
      }
    } catch (error) {
      console.error('Error fetching official details:', error);
      setError('Failed to fetch official details');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse text-center">Loading official details...</div>
    );
  }

  if (error || !official) {
    return (
      <div className="text-red-600 text-center">{error || 'Official not found'}</div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-3xl font-bold text-gray-900">
            {official.first} {official.last}
          </h2>
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
            official.position === 'pending' 
              ? 'bg-yellow-100 text-yellow-800' 
              : 'bg-green-100 text-green-800'
          }`}>
            {official.position?.toUpperCase()}
          </span>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Email:</span> {official.email}</p>
                <p><span className="font-medium">Phone:</span> {official.phone}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700">Location</h3>
              <div className="mt-2">
                <p>{official.city}, {official.state}</p>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-700">Experience</h3>
              <div className="mt-2">
                <p><span className="font-medium">Muay Thai Experience:</span></p>
                <p className="text-gray-600">{official.muayThaiExperience || 'Not specified'}</p>
                <p className="mt-2">
                  <span className="font-medium">Judged Before:</span>{' '}
                  {official.judgedBefore ? 'Yes' : 'No'}
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-gray-700">Statistics</h3>
              <div className="mt-2 space-y-2">
                <p><span className="font-medium">Bouts Judged:</span> {official.bouts_judged || 0}</p>
                <p><span className="font-medium">Bouts Reffed:</span> {official.bouts_reffed || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {official.quizScore !== undefined && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold text-gray-700">Application Quiz Score</h3>
            <p className="mt-2">
              Score: {official.quizScore}%
            </p>
          </div>
        )}

        <div className="mt-6 pt-6 border-t">
          <button
            onClick={() => window.history.back()}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
          >
            Back to Officials List
          </button>
        </div>
      </div>
    </div>
  );
}