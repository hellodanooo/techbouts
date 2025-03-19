// app/database/[sanctioning]/gyms/PageContent.tsx
'use client';

import CalculateGymRecordsClient from './CalculateGymRecordsClient';

interface PageContentProps {
  sanctioning: string;
}

export default function PageContent({ sanctioning }: PageContentProps) {
  return (
    <main>
      <CalculateGymRecordsClient sanctioning={sanctioning} />
    </main>
  );
}