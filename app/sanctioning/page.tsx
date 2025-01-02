import { db } from '../../utils/firebase'; // Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import Dashboard from './Dashboard';

// Interface for the raw sanctioning body data from Firestore
interface RawSanctioningBody {
  name: string;
  email: string;
  website: string;
  region: string;
}

// Interface for the transformed sanctioning body data
interface SanctioningBody {
  id: string;
  name: string;
  email: string;
  website: string;
  region: string;
}

export default async function SanctioningBodiesPage() {
  let sanctioningBodies: SanctioningBody[] = [];

  try {
    const jsonDocRef = doc(db, 'techbouts_sanctioning_bodies', 'sanctioning_json');
    const jsonDocSnap = await getDoc(jsonDocRef);

    if (jsonDocSnap.exists()) {
      const jsonData = jsonDocSnap.data();
      sanctioningBodies = jsonData.sanctioning_bodies.map((body: RawSanctioningBody, index: number) => ({
        id: `${body.name.replace(/\s+/g, '_')}_${body.region.replace(/\s+/g, '_')}_${index}`,
        name: body.name,
        email: body.email,
        website: body.website,
        region: body.region,
      }));
    } else {
      console.log('No sanctioning bodies found in JSON');
    }

    console.log('Sanctioning bodies fetched:', sanctioningBodies);
  } catch (error) {
    console.error('Failed to fetch sanctioning bodies:', error);
  }

  return <Dashboard sanctioningBodies={sanctioningBodies} />;
}