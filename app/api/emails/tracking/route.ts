import { db } from '@/lib/firebase_techbouts/config';
import { doc, updateDoc, arrayUnion, increment } from 'firebase/firestore';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const promotion = searchParams.get('promotion');
    const email = searchParams.get('email');
  
    if (!campaignId || !promotion || !email) {
      return new Response('Missing parameters', { status: 400 });
    }
  
    try {
      const campaignRef = doc(db, 'email_campaigns', promotion, 'campaigns', campaignId);
      await updateDoc(campaignRef, {
        openedEmails: arrayUnion(email),
        totalOpened: increment(1)
      });
  
      // Return a 1x1 transparent GIF
      return new Response(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'), {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    } catch (error) {
      console.error('Error tracking email:', error);
      return new Response('Error tracking email', { status: 500 });
    }
  }