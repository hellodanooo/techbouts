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

export async function POST(request: Request) {
  try {
    const { message, subject, emails, campaignId, source, promotion} = await request.json();

    if (!emails || emails.length === 0 || !message) {
      return NextResponse.json({ message: 'Missing emails or message' }, { status: 400 });
    }

    if (!source || !source.name || !source.email) {
      return NextResponse.json({ message: 'Invalid email source configuration' }, { status: 400 });
    }


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
    
    });



      // Send emails with tracking pixel
      await Promise.all(
        emails.map(async (email: string) => {
          const trackingPixelUrl = `https://techbouts.app/api/emails/tracking?campaignId=${campaignId}&promotion=${promotion}&email=${encodeURIComponent(email)}`;
          const emailHTML = message.replace('</body>', `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;"/></body>`);
  
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
  
      return NextResponse.json({ message: 'Emails sent successfully', campaignId });
    } catch (error) {
      console.error('Error sending emails:', error);
      return NextResponse.json({ message: 'Failed to send emails' }, { status: 500 });
    }
  }