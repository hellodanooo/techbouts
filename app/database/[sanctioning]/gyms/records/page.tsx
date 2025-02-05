// app/database/[sanctioning]/gyms/records/page.tsx
import { Suspense } from 'react';
import GymRecordsClient from './PageContent';

type Props = {
  params: Promise<{ sanctioning: string }>;
};

export default async function GymRecordsPage({ params }: Props) {
  const { sanctioning } = await params;

  if (!['pmt', 'ikf'].includes(sanctioning.toLowerCase())) {
    return <div>Invalid sanctioning body specified</div>;
  }

  return (
    <Suspense fallback={<div>Loading...</div>}>
      <GymRecordsClient sanctioning={sanctioning.toLowerCase()} />
    </Suspense>
  );
}