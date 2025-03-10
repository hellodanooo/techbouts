// app/gyms/page.tsx
import { Suspense } from 'react';
import GymsPageClient from './PageClient';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Top Performing Gyms',
  description: 'View the top performing gyms across all events, sorted by most wins',
};

export const dynamic = 'force-dynamic';

export default function GymsPage() {
  return (
    <main className="container mx-auto py-6 px-4">
      <h1 className="text-3xl font-bold mb-6">Top Performing Gyms</h1>
      <Suspense fallback={<GymsLoadingFallback />}>
        <GymsPageClient />
      </Suspense>
    </main>
  );
}

function GymsLoadingFallback() {
  return (
    <div className="space-y-4">
      <div className="h-12 bg-muted animate-pulse rounded-md mb-6" />
      {Array.from({ length: 10 }).map((_, i) => (
        <div key={i} className="bg-muted animate-pulse rounded-md h-24" />
      ))}
    </div>
  );
}