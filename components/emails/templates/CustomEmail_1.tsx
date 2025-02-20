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
  const LOGO_MAPPING = {
    muaythaipurist: {
      src: '/logos/MTP_LOGO.png',
      size: 100
    },
    ikf: {
      src: '/logos/ikf_logo.png',
      size: 100
    },
    pmt: {
      src: '/logos/pmt_logo_2024_sm.png',
      size: 100
    }
  };

  const selectedLogo = LOGO_MAPPING[promotion as keyof typeof LOGO_MAPPING];

  const imageStyles = {
    display: 'block',
    width: `${selectedLogo.size}px`,
    height: `${selectedLogo.size}px`,
    maxWidth: `${selectedLogo.size}px`,
    maxHeight: `${selectedLogo.size}px`,
    margin: '0 auto',
    objectFit: 'contain' as const,
    lineHeight: '1'
  };

  return (
    <Html>
      <Head>
        <style>{`
          img {
            max-width: 100%;
            object-fit: contain;
          }
          .logo-container {
            width: ${selectedLogo.size}px !important;
            height: ${selectedLogo.size}px !important;
            display: block !important;
            margin: 0 auto !important;
          }
        `}</style>
      </Head>
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
          <Section style={{
            textAlign: 'center',
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            {selectedLogo && (
              <table 
                role="presentation" 
                cellPadding="0" 
                cellSpacing="0" 
                style={{ 
                  width: `${selectedLogo.size}px`,
                  height: `${selectedLogo.size}px`,
                  margin: '0 auto',
                  border: 'none'
                }}
              >
                <tr>
                  <td align="center" valign="middle" className="logo-container">
                    <Img
                      src={`${process.env.NEXT_PUBLIC_APP_URL}${selectedLogo.src}`}
                      width={selectedLogo.size}
                      height={selectedLogo.size}
                      alt={`${promotion.toUpperCase()} Logo`}
                      style={imageStyles}
                    />
                  </td>
                </tr>
              </table>
            )}
          </Section>

          {/* Content Section */}
          <Section style={{ padding: '32px' }}>
            <Heading style={{
              fontSize: '24px',
              fontWeight: 'bold',
              color: '#1f2937',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              {subject}
            </Heading>
            
            <Text style={{
              color: '#4b5563',
              fontSize: '16px',
              lineHeight: '1.5',
              textAlign: 'center',
              marginBottom: '24px'
            }}>
              {message}
            </Text>

            {buttonText && buttonUrl && (
              <table role="presentation" cellPadding="0" cellSpacing="0" style={{ margin: '0 auto' }}>
                <tr>
                  <td align="center">
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
                  </td>
                </tr>
              </table>
            )}
          </Section>

          {/* Footer Section */}
          <Section style={{
            textAlign: 'center',
            padding: '5px',
            backgroundColor: '#f9fafb',
            borderTop: '1px solid #e5e7eb',
            borderBottomLeftRadius: '8px',
            borderBottomRightRadius: '8px',
            marginTop: '24px'
          }}>
            <Text style={{
              color: '#6b7280',
              fontSize: '10px',
              marginBottom: '4px'
            }}>
              Powered by
            </Text>
            <table 
              role="presentation" 
              cellPadding="0" 
              cellSpacing="0" 
              style={{ margin: '0 auto' }}
            >
              <tr>
                <td>
                  <Img
                    src={`${process.env.NEXT_PUBLIC_APP_URL}/logos/techboutslogoFlat.png`}
                    width={100}
                    height={20}
                    alt="TechBouts Logo"
                    style={{
                      display: 'block',
                      maxWidth: '100px',
                      width: '100%',
                      height: 'auto',
                      margin: '0 auto'
                    }}
                  />
                </td>
              </tr>
            </table>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

export default CustomEmail;