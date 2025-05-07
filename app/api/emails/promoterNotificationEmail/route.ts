// app/api/emails/promoterNotificationEmail/route.ts
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
  console.log("Api Request received for promoter notification email");
  try {
    const body = await request.json();
    const { 
      email, // This will be the promoter's email
      promoterId,
      firstName, 
      lastName, 
      gym, 
      gender, 
      age, 
      dob, 
      weightClass, 
      eventName, 
      eventId,
      heightFoot, 
      heightInch, 
      phone, 
      coach, 
      coach_phone,
      locale,
      sanctioning // Added sanctioning parameter
    } = body;

    const emailHTML_EN = `
    <html>
      <body>
        <div style="font-family: Arial, sans-serif; font-size: 16px;">
          <h2 style="color: #333;">New Fighter Registration</h2>

          <p>A new fighter has registered for your event: <strong>${eventName}</strong></p>
          <a href="https://www.techbouts.com/events/${promoterId}/${eventId}" 
             style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
            View Event Page
          </a>


          <h3>Fighter Details:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Name:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.email.toLowerCase()}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Gym:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${gym}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Gender:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${gender}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Age:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${age}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Date of Birth:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${dob}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Weight Class:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${weightClass}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Height:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${heightFoot}ft ${heightInch}inches</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Coach:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${coach}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Coach Phone:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${coach_phone}</td>
            </tr>
          </table>
          <p>You can view all registrations in your event dashboard.</p>
          <p>This is an automated notification. Please do not reply to this email.</p>
        </div>
      </body>
    </html>
    `;
    
    const emailHTML_ES = `
    <html>
      <body>
        <div style="font-family: Arial, sans-serif; font-size: 16px;">
          <h2 style="color: #333;">Nuevo Registro de Peleador</h2>
          <p>Un nuevo peleador se ha registrado para tu evento: <strong>${eventName}</strong></p>
          <a href="https://www.techbouts.com/events/${promoterId}/${eventId}" 
             style="display: inline-block; padding: 10px 20px; margin: 10px 0; font-size: 16px; color: #fff; background-color: #007bff; text-decoration: none; border-radius: 5px;">
            Ver Página del Evento
          </a>
          <h3>Detalles del Peleador:</h3>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Nombre:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Email:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${body.email.toLowerCase()}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Gimnasio:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${gym}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Género:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${gender}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Edad:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${age}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Fecha de nacimiento:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${dob}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Categoría de peso:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${weightClass}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Altura:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${heightFoot} pies ${heightInch} pulgadas</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Teléfono:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${phone}</td>
            </tr>
            <tr>
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Entrenador:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${coach}</td>
            </tr>
            <tr style="background-color: #f2f2f2;">
              <td style="padding: 8px; border: 1px solid #ddd;"><strong>Tel. del entrenador:</strong></td>
              <td style="padding: 8px; border: 1px solid #ddd;">${coach_phone}</td>
            </tr>
          </table>
          <p>Puedes ver todos los registros en el panel de control de tu evento.</p>
          <p>Esta es una notificación automática. Por favor no responda a este correo.</p>
        </div>
      </body>
    </html>
    `;

    // Choose the email template based on locale
    const emailHTML = locale === 'es' ? emailHTML_ES : emailHTML_EN;
    
    // Choose subject based on locale
    const subject = locale === 'es' 
      ? `Nuevo Registro: ${firstName} ${lastName} - ${eventName}` 
      : `New Registration: ${firstName} ${lastName} - ${eventName}`;
    
    // Set the email source based on sanctioning body
    let emailSource = '"Muay Thai Purist" <info@muaythaipurist.com>'; // Default source
    


    if (sanctioning === 'PBSC') {
      emailSource = '"Born To Win CSC" <borntowincsc@gmail.com>';
    } else if (sanctioning === 'PMT') {
      emailSource = '"Muay Thai Purist" <info@pointmuaythaica.com>';
    } else if (sanctioning === 'IKF') {
      emailSource = '"Muay Thai Purist" <info@muaythaipurist.com>';
    }

console.log("Email Source:", emailSource);

    const command = new SendEmailCommand({
      Source: emailSource,
      Destination: {
        ToAddresses: [email], // This is the promoter's email
      },
      Message: {
        Subject: {
          Data: subject,
          Charset: 'UTF-8',
        },
        Body: {
          Text: {
            Data: `New Fighter Registration\n\nEvent: ${eventName}\nName: ${firstName} ${lastName}\nGym: ${gym}\nGender: ${gender}\nAge: ${age}\nDOB: ${dob}\nWeight Class: ${weightClass}\nPhone: ${phone}\nCoach: ${coach}\nCoach Phone: ${coach_phone}`,
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
    return NextResponse.json({ message: 'Promoter notification email sent successfully' }, { status: 200 });
    
  } catch (error) {
    console.error("Error sending promoter notification email:", error);
    return NextResponse.json(
      { message: 'Failed to send promoter notification email', error: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}