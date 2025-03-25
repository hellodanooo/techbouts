// app/gyms/[gymId]/page.tsx

import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import GymProfileContent from './GymProfileContent';
import { fetchGymById } from '@/utils/gyms/fetchGymById'; 


type PageProps = {
  params: Promise<{ gymId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};

type GenerateMetadataProps = {
  params: Promise<{ gymId: string }>;
  searchParams?: Promise<{ [key: string]: string | string[] | undefined }>;
};



export async function generateMetadata(
  { params }: GenerateMetadataProps,
): Promise<Metadata> {
  const { gymId } = await params; // Resolve the params promise

  if (!gymId) {
    return {
      title: 'Gym Not Found',
      description: 'The requested gym profile could not be found.',
    };
  }

  try {
    const { gymProfile, logoUrl } = await fetchGymById(gymId);

    if (!gymProfile) {
      return {
        title: 'Gym Not Found',
        description: 'The requested gym profile could not be found.',
      };
    }

    const pageTitle = `${gymProfile.name} - Muay Thai Gym Profile`;
    const pageDescription = `${gymProfile.name} has a total of ${
      gymProfile.win || 0
    } wins and ${gymProfile.loss || 0} losses. Located in ${
      gymProfile.city || 'Unknown City'
    }, ${gymProfile.state || 'Unknown State'}, it offers top-notch training facilities.`;

    return {
      title: pageTitle,
      description: pageDescription,
      openGraph: {
        title: pageTitle,
        description: pageDescription,
        images: [{ url: logoUrl || '/default-gym-logo.png' }],
      },
      twitter: {
        card: 'summary_large_image',
        title: pageTitle,
        description: pageDescription,
        images: [logoUrl || '/default-gym-logo.png'],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Error',
      description: 'An error occurred while loading the gym profile.',
    };
  }
}

export default async function GymProfilePage({ params, searchParams }: PageProps) {
  const { gymId } = await params; // Resolve the params promise

  if (!gymId) {
    return notFound();
  }

  try {
    const resolvedSearchParams = searchParams ? await searchParams : undefined; // Await searchParams if provided
    console.log('Search Params:', resolvedSearchParams);

    const { gymProfile, logoUrl, success } = await fetchGymById(gymId);

    if (!success || !gymProfile) {
      console.log('Gym not found:', gymId);
      return notFound();
    }

    return (
      <GymProfileContent
        gymProfile={gymProfile}
        logoUrl={logoUrl}
        gymId={gymId}
      />
    );
  } catch (error) {
    console.error('Error in GymProfilePage:', error);
    return notFound(); // More user-friendly error handling
  }
}
