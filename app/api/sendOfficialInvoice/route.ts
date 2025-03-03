// app/api/sendOfficialInvoice/route.ts
import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Define interfaces for the payload structure
interface PayDetailItem {
  label: string;
  value: string;
}

interface PayDetail {
  title: string;
  items: PayDetailItem[];
}

interface InvoicePayload {
  email: string;
  first: string;
  last: string;
  position?: string;
  location?: string;
  eventName: string;
  eventDate: string;
  totalPay: number;
  payDetails: PayDetail[];
  travelDistance: number;
  travelPay: number;
}

const ses = new SESClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json() as InvoicePayload;
    const { 
      email,
      first,
      last,
      position,
      location,
      eventName,
      eventDate,
      totalPay,
      payDetails,
      travelDistance,
      travelPay
    } = body;

    if (!email) {
      return NextResponse.json({ message: 'Email is required' }, { status: 400 });
    }

    const emailHTML = `
    <html>
        <body>
            <div style="font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; max-width: 600px; margin: 0 auto;">
                
                <div style="background-color: #f7e4c8; border-radius: 5px; padding: 20px; text-align: center; margin-bottom: 20px;">
                  <img src="https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/images%2FPMT_Logo_2021.png?alt=media&token=d2cabb31-cabc-4cb6-ba18-4a8802349b18" alt="PMT Logo" style="max-width: 200px; margin: auto;">
                  <h1 style="margin-top: 15px;">Official Payment Invoice</h1>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <p><strong>Event:</strong> ${eventName}</p>
                  <p><strong>Date:</strong> ${eventDate}</p>
                </div>
                
                <div style="margin-bottom: 20px;">
                  <p><strong>Dear ${first} ${last},</strong></p>
                  <p>Thank you for your service as an official${position ? ` in the role of ${position}` : ''}${location ? ` at location ${location}` : ''}. Below is your payment invoice for the event.</p>
                </div>
                
                <div style="border: 1px solid #ddd; border-radius: 5px; padding: 20px; margin-bottom: 20px;">
                  <h2 style="margin-top: 0;">Payment Details</h2>
                  
                  ${payDetails.map((detail: PayDetail) => `
                    <div style="margin-bottom: 15px;">
                      <h3 style="margin-bottom: 5px;">${detail.title}</h3>
                      ${detail.items.map((item: PayDetailItem) => `
                        <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                          <span>${item.label}</span>
                          <span>${item.value}</span>
                        </div>
                      `).join('')}
                    </div>
                  `).join('')}
                  
                  ${travelDistance > 0 ? `
                    <div style="margin-bottom: 15px;">
                      <h3 style="margin-bottom: 5px;">Travel</h3>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Distance</span>
                        <span>${travelDistance} miles</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Rate</span>
                        <span>$0.55/mile</span>
                      </div>
                      <div style="display: flex; justify-content: space-between; margin-bottom: 5px;">
                        <span>Travel Pay</span>
                        <span>$${travelPay.toFixed(2)}</span>
                      </div>
                    </div>
                  ` : ''}
                  
                  <div style="border-top: 2px solid #333; margin-top: 15px; padding-top: 15px;">
                    <div style="display: flex; justify-content: space-between; font-size: 20px; font-weight: bold;">
                      <span>Total</span>
                      <span>$${totalPay.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                
                <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                  <p>Payment will be processed according to our standard payment schedule. If you have any questions about this invoice, please contact us.</p>
                </div>
                
                <div style="text-align: center; color: #666; font-size: 14px;">
                  <p>Point Muay Thai West</p>
                  <p>This is an automated email. Please do not reply directly.</p>
                </div>
            </div>
        </body>
    </html>
    `;

    const plainText = `
    Official Payment Invoice
    
    Event: ${eventName}
    Date: ${eventDate}
    
    Dear ${first} ${last},
    
    Thank you for your service as an official${position ? ` in the role of ${position}` : ''}${location ? ` at location ${location}` : ''}. Below is your payment invoice for the event.
    
    Payment Details:
    ${payDetails.map((detail: PayDetail) => `
    ${detail.title}
    ${detail.items.map((item: PayDetailItem) => `${item.label}: ${item.value}`).join('\n')}
    `).join('\n')}
    
    ${travelDistance > 0 ? `
    Travel:
    Distance: ${travelDistance} miles
    Rate: $0.55/mile
    Travel Pay: $${travelPay.toFixed(2)}
    ` : ''}
    
    Total: $${totalPay.toFixed(2)}
    
    Payment will be processed according to our standard payment schedule. If you have any questions about this invoice, please contact us.
    
    Point Muay Thai West
    This is an automated email. Please do not reply directly.
    `;

    const command = new SendEmailCommand({
      Source: '"Point Muay Thai West" <info@pointmuaythaica.com>',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `Official Payment Invoice: ${eventName}`,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: plainText,
            Charset: 'UTF-8',
          },
          Html: {
            Data: emailHTML,
            Charset: 'UTF-8',
          },
        },
      },
    });

    await ses.send(command);
    return NextResponse.json({ message: 'Invoice email sent successfully' }, { status: 200 });
    
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return NextResponse.json(
      { message: 'Failed to send invoice email', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}