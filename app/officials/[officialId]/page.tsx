// app/officials/[officialId]/page.tsx
import OfficialDetailsClient from './PageClient';
import { Metadata, ResolvingMetadata } from 'next';
import { collection, doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { Official } from '@/utils/types';

// Define generateMetadata function to create dynamic metadata
export async function generateMetadata(
  props: { params: Promise<{ officialId: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  // Get the officialId from params - await the Promise
  const { officialId } = await props.params;
  
  // Fetch the official data
  try {
    const officialsRef = collection(db, 'officials');
    const officialsDoc = doc(officialsRef, 'officials_json');
    const docSnap = await getDoc(officialsDoc);
    
    let official: Official | null = null;
    
    if (docSnap.exists()) {
      const officialsData = docSnap.data();
      official = officialsData.data.find(
        (off: Official) => off.officialId === officialId || off.id === officialId
      ) || null;
    }
    
    // Get parent metadata
    const previousImages = (await parent).openGraph?.images || [];
    
    if (!official) {
      return {
        title: 'Official Not Found',
        description: 'The requested official could not be found.',
      };
    }
    
    const title = `${official.first} ${official.last} - ${official.position || 'Official'} | TechBouts`;
    const description = `View profile for ${official.first} ${official.last}, a ${official.position || 'official'} from ${official.city}, ${official.state}. Experience: ${official.muayThaiExperience || 'Not specified'}`;
    
    return {
      title,
      description,
      openGraph: {
        title,
        description,
        images: official.photo 
          ? [official.photo, ...previousImages]
          : previousImages,
        // Changed from 'profile' to a standard type
        type: 'website',
        siteName: 'TechBouts',
        locale: 'en_US',
        // Remove the profile object which was causing the error
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: official.photo ? [official.photo] : [],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Official Details',
      description: 'View details about this official.',
    };
  }
}

export default async function OfficialPage(props: { params: Promise<{ officialId: string }> }) {
  // Await the params Promise before accessing officialId
  const { officialId } = await props.params;

  return (
    <main className="min-h-screen p-6">
      <h1 className="text-2xl font-bold mb-6">Official Details</h1>
      <OfficialDetailsClient officialId={officialId} />
    </main>
  );
}