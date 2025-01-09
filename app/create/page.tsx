// app/create/page.tsx
import { db } from '../../lib/firebase_techbouts/config'; // Firestore instance
import { doc, getDoc } from 'firebase/firestore';
import Dashboard from './Dashboard';
import { Promoter } from '../../utils/types';
import HeaderHome from "@/components/ui/HeaderHome";




export default async function CreateEventPage() {
  let promoters: Promoter[] = [];
console.log('Begin Promoter Fetch' )
  try {
    const jsonDocRef = doc(db, 'promotions', 'promotions_json');
    const jsonDocSnap = await getDoc(jsonDocRef);

    if (jsonDocSnap.exists()) {
      const jsonData = jsonDocSnap.data();
      promoters = jsonData.promoters.map((promoter: Promoter) => ({
        promoterId: promoter.promoterId,
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

  return ( 
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">

    <HeaderHome />

  <Dashboard promoters={promoters} />;

</div>

  )
}