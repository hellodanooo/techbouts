import { Suspense } from 'react';
import { PageContent } from './PageContent';

export default function ExportCSVPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Export Event Roster to CSV</h1>
      <Suspense fallback={<div>Loading...</div>}>
        <PageContent />
      </Suspense>
    </div>
  );
}