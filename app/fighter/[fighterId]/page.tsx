// app/fighter/[fighterId]/page.tsx
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { FighterPageContent } from './PageContent';
import { getFighterData } from './utils';

// Updated for Next.js 15
export async function generateMetadata(props: { 
  params: Promise<{ fighterId: string }>;
}): Promise<Metadata> {
  const { fighterId } = await props.params;
  const fighter = await getFighterData(fighterId);

  if (!fighter) {
    return {
      title: 'Fighter Not Found',
      description: 'The requested fighter profile could not be found.',
      openGraph: {
        images: ['/images/default-fighter.jpg'],
      },
    };
  }

  const defaultImage = '/images/default-fighter.jpg';
  const imageUrl = fighter.photo || defaultImage;
  
  // Calculate total record
  const wins = fighter.mt_win + fighter.boxing_win + fighter.mma_win + fighter.pmt_win;
  const losses = fighter.mt_loss + fighter.boxing_loss + fighter.mma_loss + fighter.pmt_loss;

  return {
    title: `${fighter.first} ${fighter.last} - Fighter Profile`,
    description: `View ${fighter.first} ${fighter.last}'s fighter profile. ${wins}-${losses} record, representing ${fighter.gym}.`,
    openGraph: {
      title: `${fighter.first} ${fighter.last} - Fighter Profile`,
      description: `${fighter.gym} fighter with a record of ${wins}-${losses}`,
      images: [{ url: imageUrl, width: 800, height: 800, alt: `${fighter.first} ${fighter.last} - Fighter Profile` }],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${fighter.first} ${fighter.last} - Fighter Profile`,
      description: `${fighter.gym} fighter with a record of ${wins}-${losses}`,
      images: [imageUrl],
    },
  };
}

// Updated for Next.js 15
export default async function FighterPage(props: {
  params: Promise<{ fighterId: string }>;
}) {
  const { fighterId } = await props.params;
  const fighter = await getFighterData(fighterId);

  if (!fighter) {
    notFound();
  }

  return (
    <main>
      <FighterPageContent fighter={fighter} />
    </main>
  );
}