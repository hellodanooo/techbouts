import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { FighterPageContent } from './PageContent';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import { FighterProfile } from '@/utils/types';

type Props = {
  params: Promise<{ fighterId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

// Generate metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const resolvedParams = await params; // Resolve the params promise
  const fighter = await getFighterData(resolvedParams.fighterId);

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

  return {
    title: `${fighter.first} ${fighter.last} - Fighter Profile`,
    description: `View ${fighter.first} ${fighter.last}'s fighter profile. ${fighter.win}-${fighter.loss} record, representing ${fighter.gym} in the ${fighter.weightclass}lb weight class.`,
    openGraph: {
      title: `${fighter.first} ${fighter.last} - Fighter Profile`,
      description: `${fighter.gym} fighter with a record of ${fighter.win}-${fighter.loss}`,
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 800,
          alt: `${fighter.first} ${fighter.last} - Fighter Profile`,
        },
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: `${fighter.first} ${fighter.last} - Fighter Profile`,
        },
      ],
      type: 'profile',
    },
    twitter: {
      card: 'summary',
      title: `${fighter.first} ${fighter.last} - Fighter Profile`,
      description: `${fighter.gym} fighter with a record of ${fighter.win}-${fighter.loss}`,
      images: [imageUrl],
    },
  };
}

// Fetch fighter data from Firestore
async function getFighterData(fighterId: string): Promise<FighterProfile | null> {
  try {
    const fightersRef = collection(db, 'fighters_database');
    const fightersSnapshot = await getDocs(fightersRef);

    let fighterData: FighterProfile | null = null;

    for (const doc of fightersSnapshot.docs) {
      const data = doc.data();
      if (data.fighters) {
        const fighter = data.fighters.find((f: FighterProfile) =>
          f.fighter_id === fighterId || f.mtp_id === fighterId
        );
        if (fighter) {
          fighterData = fighter;
          break;
        }
      }
    }

    return fighterData;
  } catch (error) {
    console.error('Error fetching fighter data:', error);
    return null;
  }
}

// Page component
export default async function FighterPage({ params }: Props) {
  const resolvedParams = await params; // Resolve the params promise
  const fighter = await getFighterData(resolvedParams.fighterId);

  if (!fighter) {
    notFound();
  }

  return (
    <main>
      <FighterPageContent fighter={fighter} />
    </main>
  );
}

// Generate static paths for static generation (optional)
export async function generateStaticParams() {
  try {
    const fightersRef = collection(db, 'fighters_database');
    const fightersSnapshot = await getDocs(fightersRef);

    const fighterIds: string[] = [];

    fightersSnapshot.forEach((doc) => {
      const data = doc.data();
      if (data.fighters) {
        data.fighters.forEach((fighter: FighterProfile) => {
          if (fighter.fighter_id) {
            fighterIds.push(fighter.fighter_id);
          }
        });
      }
    });

    return fighterIds.map((id) => ({
      fighterId: id,
    }));
  } catch (error) {
    console.error('Error generating static params:', error);
    return [];
  }
}
