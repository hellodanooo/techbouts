// app/api/emails/route.ts
import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { db } from '@/lib/firebase_techbouts/config';
import { doc, setDoc } from 'firebase/firestore';

const sesClient = new SESClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

function generateTrackingPixels(campaignId: string, promotion: string, email: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techbouts.app';
  const encodedEmail = encodeURIComponent(email);
  
  // Generate multiple tracking elements
  const pixelTracker = `<img src="${baseUrl}/api/emails/tracking?campaignId=${campaignId}&promotion=${promotion}&email=${encodedEmail}&type=pixel" width="1" height="1" style="display:none"/>`;
  
  const cssTracker = `
    <div style="background-image: url('${baseUrl}/api/emails/tracking?campaignId=${campaignId}&promotion=${promotion}&email=${encodedEmail}&type=css'); width: 1px; height: 1px; display: none;"></div>
  `;

  return { pixelTracker, cssTracker };
}

function wrapLinksWithTracking(html: string, campaignId: string, promotion: string, email: string) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://techbouts.app';
  
  return html.replace(
    /<a\s+(?:[^>]*?\s+)?href="([^"]*)"([^>]*)>/g,
    (match, url, rest) => {
      const trackingUrl = `${baseUrl}/api/emails/tracking?campaignId=${campaignId}&promotion=${promotion}&email=${encodeURIComponent(email)}&type=link&url=${encodeURIComponent(url)}`;
      return `<a href="${trackingUrl}"${rest}>`;
    }
  );
}

export async function POST(request: Request) {
  try {
    const { message, subject, emails, campaignId, source, promotion } = await request.json();

    if (!emails?.length || !message) {
      return NextResponse.json({ message: 'Missing emails or message' }, { status: 400 });
    }

    if (!source?.name || !source?.email) {
      return NextResponse.json({ message: 'Invalid email source configuration' }, { status: 400 });
    }

    // Initialize campaign in Firestore
    const campaignRef = doc(db, 'email_campaigns', promotion, 'campaigns', campaignId);
    await setDoc(campaignRef, {
      id: campaignId,
      promotion,
      subject,
      sentAt: new Date().toISOString(),
      totalSent: emails.length,
      totalOpened: 0,
      sentEmails: emails,
      openedEmails: [],
      engagement: {},
      linkClicks: {},
    });

    // Send emails with enhanced tracking
    await Promise.all(
      emails.map(async (email: string) => {
        // Generate tracking elements
        const { pixelTracker, cssTracker } = generateTrackingPixels(campaignId, promotion, email);
        
        // Process HTML content
        let emailHTML = message;
        emailHTML = wrapLinksWithTracking(emailHTML, campaignId, promotion, email);
        
        // Add tracking elements at both top and bottom
        emailHTML = `
          ${pixelTracker}
          ${cssTracker}
          ${emailHTML}
          ${pixelTracker}
          ${cssTracker}
        `;

        const command = new SendEmailCommand({
          Source: `"${source.name}" <${source.email}>`,
          Destination: { ToAddresses: [email] },
          Message: {
            Subject: { Data: subject, Charset: 'UTF-8' },
            Body: { Html: { Data: emailHTML, Charset: 'UTF-8' } },
          },
        });

        return sesClient.send(command);
      })
    );

    return NextResponse.json({ 
      message: 'Emails sent successfully', 
      campaignId 
    });
  } catch (error) {
    console.error('Error sending emails:', error);
    return NextResponse.json({ message: 'Failed to send emails' }, { status: 500 });
  }
}