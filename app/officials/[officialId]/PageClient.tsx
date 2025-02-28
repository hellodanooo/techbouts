// app/officials/[officialId]/OfficialDetailsClient.tsx
'use client';
import { useState, useEffect } from 'react';
import { Official } from '@/utils/types';
import Image from 'next/image';

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
          (off: Official) => off.officialId === officialId || off.id === officialId
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
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          {/* Official Photo */}
          <div className="flex-shrink-0">
            {official.photo ? (
              <div className="relative w-36 h-36 md:w-48 md:h-48 overflow-hidden rounded-lg border border-gray-200">
<Image                  src={official.photo} 
                  alt={`${official.first} ${official.last}`}
                  className="object-cover w-full h-full"
                />
              </div>
            ) : (
              <div className="w-36 h-36 md:w-48 md:h-48 rounded-lg bg-gray-200 flex items-center justify-center text-gray-500 text-4xl font-bold">
                {official.first?.charAt(0)}{official.last?.charAt(0)}
              </div>
            )}
          </div>
          
          {/* Name and Position */}
          <div className="flex flex-col justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">
                {official.first} {official.last}
              </h2>
              <span className={`mt-2 inline-block px-3 py-1 rounded-full text-sm font-semibold ${
                official.position?.toLowerCase() === 'pending' 
                  ? 'bg-yellow-100 text-yellow-800' 
                  : 'bg-green-100 text-green-800'
              }`}>
                {official.position?.toUpperCase()}
              </span>
              
              {official.facebookUrl && (
                <a 
                  href={official.facebookUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="mt-3 inline-flex items-center text-blue-600 hover:text-blue-800"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className="h-5 w-5 mr-1" 
                    viewBox="0 0 24 24" 
                    fill="currentColor"
                  >
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                  Social Media
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6 mt-8">
          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold text-gray-700">Contact Information</h3>
              <div className="mt-2 space-y-2">
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <span className="font-medium">Email:</span> {official.email}
                </p>
                <p className="flex items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                  <span className="font-medium">Phone:</span> {official.phone}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold text-gray-700">Location</h3>
              <div className="mt-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <p>{official.city}, {official.state}</p>
              </div>
            </div>
            
            {(official.payment || official.paymentType || official.paymentId) && (
              <div className="bg-gray-50 p-4 rounded">
                <h3 className="text-lg font-semibold text-gray-700">Payment Information</h3>
                <div className="mt-2 space-y-2">
                  {official.paymentType && (
                    <p><span className="font-medium">Payment Type:</span> {official.paymentType}</p>
                  )}
                  {official.paymentId && (
                    <p><span className="font-medium">Payment ID/Email:</span> {official.paymentId}</p>
                  )}
                  {official.payment && (
                    <p><span className="font-medium">Payment Note:</span> {official.payment}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold text-gray-700">Experience</h3>
              <div className="mt-2">
                <p><span className="font-medium">Muay Thai Experience:</span></p>
                <p className="text-gray-600 mt-1">{official.muayThaiExperience || 'Not specified'}</p>
                <p className="mt-3 flex items-center">
                  <span className="font-medium mr-1">Judged Before:</span>
                  {official.judgedBefore ? (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                  ) : (
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  )}
                </p>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded">
              <h3 className="text-lg font-semibold text-gray-700">Statistics</h3>
              <div className="mt-2 space-y-3">
                <div className="flex items-center justify-between">
                  <p><span className="font-medium">Bouts Judged:</span></p>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {official.bouts_judged || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <p><span className="font-medium">Bouts Refereed:</span></p>
                  <span className="px-2.5 py-0.5 bg-blue-100 text-blue-800 rounded-full">
                    {official.bouts_reffed || 0}
                  </span>
                </div>
            
              </div>
            </div>
          </div>
        </div>

        {official.quizScore !== undefined && (
          <div className="mt-6 p-4 bg-gray-50 rounded">
            <h3 className="text-lg font-semibold text-gray-700">Application Quiz Score</h3>
            <div className="mt-2">
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className={`h-2.5 rounded-full ${
                    official.quizScore >= 80 ? 'bg-green-600' : 
                    official.quizScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`} 
                  style={{ width: `${official.quizScore}%` }}
                ></div>
              </div>
              <p className="mt-1 text-right font-medium">{official.quizScore}%</p>
            </div>
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