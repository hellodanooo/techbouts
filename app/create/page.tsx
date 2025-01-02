import { db } from '../../utils/firebase'; // Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import Dashboard from './Dashboard';

// Interface for the raw promoter data from Firestore
interface RawPromoterData {
  name: string;
  email: string;
  promotion: string;
  sanctioning: string;
  city: string;
}

// Interface for the transformed promoter data
interface Promoter {
  id: string;
  name: string;
  email: string;
  promotion: string;
  sanctioning: string;
}

export default async function CreateEventPage() {
  let promoters: Promoter[] = [];

  try {
    const jsonDocRef = doc(db, 'techbouts_promotions', 'promotions_json');
    const jsonDocSnap = await getDoc(jsonDocRef);

    if (jsonDocSnap.exists()) {
      const jsonData = jsonDocSnap.data();
      promoters = jsonData.promoters.map((promoter: RawPromoterData, index: number) => ({
        id: `${promoter.promotion.replace(/\s+/g, '_')}_${promoter.city.replace(/\s+/g, '_')}_${index}`,
        name: promoter.name,
        email: promoter.email,
        promotion: promoter.promotion,
        sanctioning: promoter.sanctioning,
      }));
    } else {
      console.log('No promotions found in JSON');
    }

    console.log('Promoters fetched:', promoters);
  } catch (error) {
    console.error('Failed to fetch promoters:', error);
  }

  return <Dashboard promoters={promoters} />;
}