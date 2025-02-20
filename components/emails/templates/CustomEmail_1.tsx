// app/emails/[promotion]/CustomEmail_1.tsx
// CustomEmail.tsx
import React from 'react';
import { Html, Head, Body, Container, Text, Heading, Button, Img, Section } from "@react-email/components";

interface CustomEmailProps {
  subject: string;
  message: string;
  buttonText?: string;
  buttonUrl?: string;
  promotion: string;
}

const CustomEmail = ({ 
  subject, 
  message, 
  buttonText, 
  buttonUrl, 
  promotion 
}: CustomEmailProps) => {
  // Define logo mapping with proper public folder paths
  const LOGO_MAPPING = {
    muaythaipurist: {
      src: '/logos/MTP_LOGO.png',
      width: 200,
      height: 80
    },
    ikf: {
      src: '/logos/ikf_logo.png',
      width: 180,
      height: 70
    },
    pmt: {
      src: '/logos/pmt_logo_2024_sm.png',
      width: 220,
      height: 90
    }
  };

  // Get the selected logo based on promotion
  const selectedLogo = LOGO_MAPPING[promotion as keyof typeof LOGO_MAPPING];

  return (
    <Html>
      <Head />
      <Body style={{ 
        backgroundColor: '#f3f4f6',
        margin: '0',
        padding: '16px'
      }}>
        <Container style={{
          maxWidth: '600px',
          margin: '0 auto',
          backgroundColor: '#ffffff',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)'
        }}>
          {/* Header with Dynamic Logo */}
          <Section style={{
            textAlign: 'center',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {selectedLogo && (
              <Img
                src={`${process.env.NEXT_PUBLIC_APP_URL}${selectedLogo.src}`}
                width={selectedLogo.width}
                height={selectedLogo.height}
                alt={`${promotion.toUpperCase()} Logo`}
                style={{ margin: '0 auto' }}
              />
            )}
          </Section>

          {/* Content Section */}
          <Section style={{ padding: '32px' }}>
            <Heading style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              marginBottom: '24px'
            }}>
              {subject}
            </Heading>
            
            <Text style={{
              color: '#4b5563',
              fontSize: '16px',
              lineHeight: '1.5',
              marginBottom: '32px'
            }}>
              {message}
            </Text>

            {buttonText && buttonUrl && (
              <Button 
                href={buttonUrl}
                style={{
                  backgroundColor: '#e11d48',
                  color: '#ffffff',
                  padding: '12px 32px',
                  borderRadius: '6px',
                  fontWeight: '500',
                  textDecoration: 'none',
                  display: 'inline-block'
                }}
              >
                {buttonText}
              </Button>
            )}
          </Section>

          {/* Footer with TechBouts Logo */}
          <Section style={{
            textAlign: 'center',
            padding: '24px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px'
          }}>
            <Text style={{
              color: '#6b7280',
              fontSize: '14px',
              marginBottom: '12px'
            }}>
              Powered by
            </Text>
            <Img
              src={`${process.env.NEXT_PUBLIC_APP_URL}/logos/techboutslogoFlat.png`}
              width={150}
              height={40}
              alt="TechBouts Logo"
              style={{ margin: '0 auto' }}
            />
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CustomEmail;