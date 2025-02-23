// app/api/emails/route.ts
import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { db } from '@/lib/firebase_techbouts/config';
import { doc, setDoc, updateDoc } from 'firebase/firestore';

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

// app/api/emails/route.ts
export async function POST(request: Request) {
  try {
    const { message, subject, emails, campaignId, source, promotion } = await request.json();

    if (!emails?.length || !message) {
      return NextResponse.json({ message: 'Missing emails or message' }, { status: 400 });
    }

    if (!source?.name || !source?.email) {
      return NextResponse.json({ message: 'Invalid email source configuration' }, { status: 400 });
    }

    // Keep track of successful and failed sends
    const sendResults = {
      successful: [] as string[],
      failed: [] as { email: string; error: string }[]
    };

    // Initialize campaign in Firestore with pending status
    const campaignRef = doc(db, 'email_campaigns', promotion, 'campaigns', campaignId);
    await setDoc(campaignRef, {
      id: campaignId,
      promotion,
      subject,
      sentAt: new Date().toISOString(),
      status: 'sending',
      totalAttempted: emails.length,
      totalSent: 0,
      totalFailed: 0,
      totalOpened: 0,
      sentEmails: [],
      failedEmails: [],
      openedEmails: [],
      engagement: {},
      linkClicks: {},
    });

    // Send emails and track results
    const sendPromises = emails.map(async (email: string) => {
      try {
        // Generate tracking elements
        const { pixelTracker, cssTracker } = generateTrackingPixels(campaignId, promotion, email);
        
        let emailHTML = message;
        emailHTML = wrapLinksWithTracking(emailHTML, campaignId, promotion, email);
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

        const result = await sesClient.send(command);
        
        if (result.$metadata.httpStatusCode === 200) {
          sendResults.successful.push(email);
        } else {
          sendResults.failed.push({ 
            email, 
            error: `SES returned status: ${result.$metadata.httpStatusCode}` 
          });
        }
      } catch (error) {
        console.error(`Failed to send email to ${email}:`, error);
        sendResults.failed.push({ 
          email, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
      }
    });

    // Wait for all sends to complete
    await Promise.all(sendPromises);

    // Update campaign with final results
    await updateDoc(campaignRef, {
      status: 'completed',
      totalSent: sendResults.successful.length,
      totalFailed: sendResults.failed.length,
      sentEmails: sendResults.successful,
      failedEmails: sendResults.failed,
      completedAt: new Date().toISOString()
    });

    // Return detailed results
    return NextResponse.json({ 
      message: 'Email campaign completed', 
      campaignId,
      results: {
        totalAttempted: emails.length,
        totalSent: sendResults.successful.length,
        totalFailed: sendResults.failed.length,
        failedEmails: sendResults.failed
      }
    });
  } catch (error) {
    console.error('Error in email campaign:', error);
    return NextResponse.json({ 
      message: 'Failed to complete email campaign',
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}