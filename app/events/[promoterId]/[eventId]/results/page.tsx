import { notFound } from 'next/navigation';
import PageClient from './PageContent';
import { fetchPmtResults } from '@/utils/apiFunctions/fetchPmtResults';



interface PageProps {
  params: Promise<{
    promoterId: string;
    eventId: string;
  }>;
}

export default async function ResultsPage({ params }: PageProps) {
  const { promoterId, eventId } = await params;

  if (!promoterId || !eventId) {
    console.error('Missing promoterId or eventId');
    notFound();
  }

  const { fighters, completed } = await fetchPmtResults(eventId);

  return <PageClient fighters={fighters} completed={completed} />;
}
