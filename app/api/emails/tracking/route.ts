// app/api/emails/tracking/route.ts
import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase_techbouts/config';
import { doc, updateDoc, arrayUnion, increment, getDoc } from 'firebase/firestore';

// Helper function to detect email client from user agent
function detectEmailClient(userAgent: string) {
  if (userAgent.includes('Googlebot')) return 'Gmail';
  if (userAgent.includes('Outlook')) return 'Outlook';
  if (userAgent.includes('Yahoo')) return 'Yahoo';
  return 'Other';
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const campaignId = searchParams.get('campaignId');
  const promotion = searchParams.get('promotion');
  const email = searchParams.get('email');
  const trackingType = searchParams.get('type') || 'pixel'; // pixel, css, or link

  if (!campaignId || !promotion || !email) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });
  }

  try {
    const campaignRef = doc(db, 'email_campaigns', promotion, 'campaigns', campaignId);
    const emailClient = detectEmailClient(request.headers.get('user-agent') || '');
    
    // Get existing data
    const campaignDoc = await getDoc(campaignRef);
    if (!campaignDoc.exists()) {
      throw new Error('Campaign not found');
    }


    const now = new Date().toISOString();

    // Update engagement data
    await updateDoc(campaignRef, {
      openedEmails: arrayUnion(email),
      totalOpened: increment(1),
      [`engagement.${email}`]: {
        lastOpened: now,
        openCount: increment(1),
        emailClient,
        trackingType,
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || 'unknown'
      }
    });

    // Return appropriate response based on tracking type
    if (trackingType === 'css' || trackingType === 'pixel') {
      const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/gif',
          'Content-Length': String(buffer.length),
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
        },
      });
    }

    // For link tracking, redirect to the original URL
    const originalUrl = searchParams.get('url');
    if (trackingType === 'link' && originalUrl) {
      return NextResponse.redirect(originalUrl);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error tracking email:', error);
    
    // Still return the tracking pixel for pixel/css tracking
    if (trackingType === 'css' || trackingType === 'pixel') {
      const buffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      return new NextResponse(buffer, {
        headers: {
          'Content-Type': 'image/gif',
          'Cache-Control': 'no-store, no-cache',
        },
      });
    }
    
    return NextResponse.json({ error: 'Tracking failed' }, { status: 500 });
  }
}