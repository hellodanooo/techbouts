import { FighterPageContent } from './PageContent';
import { FighterProfile } from '@/utils/types';

interface Props {
  params: Promise<{ fighterId: string }>; // params is a Promise
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>; // searchParams is also a Promise
}

export default async function FighterPage({ params, searchParams }: Props) {
  try {
    // Await the resolution of both params and searchParams
    const resolvedParams = await params;
    const resolvedSearchParams = await searchParams;

    console.log('Resolved params:', resolvedParams);
    console.log('Resolved searchParams:', resolvedSearchParams);

    const response = await fetch(`/api/fighters/${resolvedParams.fighterId}`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error('Failed to fetch fighter');
    }

    const fighter: FighterProfile = await response.json();
    return <FighterPageContent fighter={fighter} />;
  } catch (error) {
    console.error('Error fetching fighter:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#f5f0e6]">
        <h1 className="text-2xl font-bold text-red-600">Fighter not found</h1>
      </div>
    );
  }
}
