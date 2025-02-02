// app/scraper/page.tsx
import { Suspense } from 'react';
import PageContent from './PageContent';

export default function ScraperPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">IKF Legacy Content Scraper</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <PageContent />
      </Suspense>
    </div>
  );
}