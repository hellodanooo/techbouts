// app/api/sendConfirmationEmail/route.ts
import { NextResponse } from 'next/server';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

const ses = new SESClient({
  region: "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  }
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      email, 
      firstName, 
      lastName, 
      gym, 
      gender, 
      age, 
      dob, 
      weightClass, 
      eventName, 
     // eventId, 
      heightFoot, 
      heightInch, 
      phone, 
      coach, 
      coach_phone 
    } = body;

    const emailHTML = `
    <html>
        <body>
            <div style="text-align: center; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px;">
                
            <div style="background-color: #f7e4c8; border-radius: 5px;">
            <img src="https://www.techbouts.com/logos/MTP_LOGO.png" alt="MTP Logo" style="max-width: 200px; margin: auto;">
            </div>  
            <p><b>Hello ${firstName} ${lastName},</b><br><br>Your registration has been successfully processed.</p>
            <p><b>Event:</b> ${eventName}</p>
            <p><b>You must Review All Rules Prior to Competition</b><br><br>
             <a href="https://muaythaipurist.com/rules" style="background-color: transparent; color: black; text-decoration: none; border: 2px solid black; padding: 10px 20px; display: inline-block; font-family: Arial, 'Helvetica Neue', Helvetica, sans-serif; font-size: 16px; margin: auto;">competition rules</a>
            </p>

            <p>No Need to notify us of any weightclass changes, Official weighin will determine your weight class</p>

            <p>Here are the details you provided:</p>
            <ul style="list-style-type: none; padding: 0;">
                <li>Gym: ${gym}</li>
                <li>Gender: ${gender}</li>
                <li>Age: ${age}</li>
                <li>Date of Birth: ${dob}</li>
                <li>Weight Class: ${weightClass}</li>
                <li>Height: ${heightFoot}ft ${heightInch}inches</li>
                <li>Phone: ${phone}</li>
                <li>Coach: ${coach}</li>
                <li>Coach Phone: ${coach_phone}</li>
            </ul>

            </div>
        </body>
    </html>
    `;

    const command = new SendEmailCommand({
      Source: '"Muay Thai Purist" <info@muaythaipurist.com>',
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: `Registration Confirmation: ${eventName}`,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: `Hello ${firstName} ${lastName},\n\nYour registration has been successfully processed.\n\nDetails:\nGym: ${gym}\nGender: ${gender}\nAge: ${age}\nDOB: ${dob}\nWeight Class: ${weightClass}`,
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
    return NextResponse.json({ message: 'Email sent successfully' }, { status: 200 });
    
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json(
      { message: 'Failed to send email', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}