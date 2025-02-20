// app/api/emails/route.ts
import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const sesClient = new SESClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
  },
});

export async function POST(request: Request) {
  try {
    const { message, subject, emails, campaignId, source } = await request.json();

    if (!emails || emails.length === 0 || !message) {
      return NextResponse.json({ message: 'Missing emails or message' }, { status: 400 });
    }

    if (!source || !source.name || !source.email) {
      return NextResponse.json({ message: 'Invalid email source configuration' }, { status: 400 });
    }

    const trackingPixelUrl = `https://pmt-west.app/api/openedEmailCounter?campaignId=${campaignId}`;

    // Insert tracking pixel at the end of the message body, before closing body tag
    const emailHTML = message.replace('</body>', `
      <img src="${trackingPixelUrl}" width="1" height="1" style="display:none;"/>
      </body>
    `);

    // Send emails using AWS SDK v3
    await Promise.all(emails.map(async (email: string) => {
      const command = new SendEmailCommand({
        Source: `"${source.name}" <${source.email}>`,
        Destination: {
          ToAddresses: [email],
        },
        Message: {
          Subject: {
            Data: subject,
            Charset: 'UTF-8',
          },
          Body: {
            Html: {
              Data: emailHTML,
              Charset: 'UTF-8',
            },
          },
        },
      });

      return sesClient.send(command);
    }));

    return NextResponse.json({ message: 'Emails sent successfully' });
  } catch (error) {
    console.error("Error sending emails: ", error);
    return NextResponse.json({ message: 'Failed to send emails' }, { status: 500 });
  }
}