// pages/gyms/GymProfileImage.tsx
import React, { useRef, useEffect, useState } from 'react';
import html2canvas from 'html2canvas';
import { QRCodeSVG } from 'qrcode.react';
import { GymProfile, ResultsFighter } from '../../utils/types';

interface GymProfileCardProps {
  gymProfile: GymProfile;
  logoUrl: string | null;
}

const GymProfileCard: React.FC<GymProfileCardProps> = ({ gymProfile, logoUrl }) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const currentUrl = typeof window !== 'undefined' ? window.location.href : '';
  const [logoDataUrl, setLogoDataUrl] = useState<string>('');

  useEffect(() => {
    const loadImage = async () => {
      if (logoUrl) {
        try {
          const response = await fetch(logoUrl);
          const blob = await response.blob();
          const reader = new FileReader();
          
          reader.onloadend = () => {
            const base64data = reader.result as string;
            setLogoDataUrl(base64data);
          };
          
          reader.readAsDataURL(blob);
        } catch (error) {
          console.error('Error loading image:', error);
          setLogoDataUrl('/default-gym-logo.png');
        }
      } else {
        setLogoDataUrl('/default-gym-logo.png');
      }
    };

    loadImage();
  }, [logoUrl]);

 const handleDownload = async () => {
    if (cardRef.current) {
      try {
        // Wait a bit to ensure the image is loaded
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const canvas = await html2canvas(cardRef.current, {
          scale: 2,
          backgroundColor: '#ffffff',
          useCORS: true,
          allowTaint: true,
          logging: true
        });
        
        const image = canvas.toDataURL('image/png', 1.0);
        const link = document.createElement('a');
        link.href = image;
        link.download = `${gymProfile.gym || ''}-profile.png`;
        link.click();
      } catch (err) {
        console.error('Error generating image:', err);
      }
    }
  };



  const sortedAthletes = [...(gymProfile.athletes || [])].sort((a, b) => 
    (b.win || 0) - (a.win || 0)
  );


  return (
    <div
    style={{
      width: '700px',
      overflowX: 'auto',
    }}
    >
      <button 
        onClick={handleDownload}
        style={{
          padding: '8px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          marginBottom: '16px',
          display: 'block',
          margin: '5px auto',
          alignItems: 'center',
          gap: '8px'

        }}
      >
        <svg 
          width="26" 
          height="26" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2"
        >
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
          <polyline points="7 10 12 15 17 10" />
          <line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Download Gym Card
      </button>

      
      
      
      <div
        ref={cardRef}
        style={{
          width: '600px',
          backgroundColor: 'white',
          padding: '10 24px 0px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          overflowX: 'auto',
          color: '#111827'
        }}
      >
      



        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          marginBottom: '24px',
          borderBottom: '2px solid #f3f4f6',
          paddingBottom: '16px'
        }}>
          {logoDataUrl && (
            <img 
              src={logoDataUrl}
              alt={`${gymProfile.gym || ''} logo`}
              style={{
                width: '100px',
                height: '100px',
                objectFit: 'contain',
                borderRadius: '8px'
              }}
              crossOrigin="anonymous"
            />
          )}
          
          <div>
            <h2 style={{
              fontSize: '24px',
              fontWeight: 'bold',
              margin: '0 0 8px 0',
              color: '#111827'
            }}>
              {gymProfile.gym || 'Gym Name'}
            </h2>
            <p style={{
              fontSize: '16px',
              color: '#6b7280',
              margin: 0
            }}>
              Total Record: {gymProfile.win}W - {gymProfile.loss}L
            </p>
          </div>
          <div style={{
            marginLeft: 'auto',
            backgroundColor: '#f9fafb',
            padding: '12px',
            borderRadius: '8px'
          }}>
            <QRCodeSVG 
              value={currentUrl}
              size={80}
              level="H"
              includeMargin={true}
            /><div
            style={{
              fontSize: '12px',
              color: '#6b7280'
            }}
            >
            Gym Profile
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: '16px',
          marginBottom: '24px'
        }}>
          {[
            { label: 'Boys Wins', value: gymProfile.boysWin },
            { label: 'Girls Wins', value: gymProfile.girlsWin },
            { label: 'Men Wins', value: gymProfile.menWin },
            { label: 'Women Wins', value: gymProfile.womanWin }
          ].map((stat, index) => (
            <div
              key={index}
              style={{
                backgroundColor: '#f3f4f6',
                padding: '12px',
                borderRadius: '8px',
                textAlign: 'center'
              }}
            >
              <div style={{ fontSize: '14px', color: '#4b5563' }}>{stat.label}</div>
              <div style={{ fontSize: '18px', fontWeight: 'bold', color: '#111827' }}>{stat.value || 0}</div>
            </div>
          ))}
        </div>

        {/* Athletes Section */}
        <div>
          <h3 style={{
            fontSize: '18px',
            fontWeight: 'bold',
            marginBottom: '12px',
            color: '#111827'
          }}>
            Top Athletes
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, 1fr)',
            gap: '12px'
          }}>
            {sortedAthletes.slice(0, 6).map((athlete: ResultsFighter, index: number) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#f3f4f6',
                  padding: '12px',
                  borderRadius: '8px'
                }}
              >
                <div style={{
                  fontSize: '16px',
                  fontWeight: '500',
                  color: '#111827'
                }}>
                  {athlete.first} {athlete.last}
                </div>
                <div style={{
                  fontSize: '14px',
                  color: '#6b7280'
                }}>
                  {athlete.weightclass} lbs  • {athlete.win} Win
                </div>
              </div>
            ))}
          </div>
        </div>
       
       
        <div
  style={{ 
    fontSize: '12px',
    opacity: '60%',
    width: '100%',
    borderTop: '2px solid grey',
    marginTop: '10px',
    padding: '20px 10px',
    display: 'grid',
    gridTemplateColumns: '45% 55%',
    gap: '10px'
  }}
>
  <div 
    style={{
      border: '1px solid black',
      padding: '10px',
      borderRadius: '5px',
      display: 'grid',
      gridTemplateColumns: 'auto 1fr',
      alignItems: 'center',
      gap: '15px',
      width: '260px'
    }}
  >
    <img 
      src='/images/NMF-donate-qr-code.png'
      alt='NMF Donation QR Code'
      style={{
        width: '80px',
        height: '80px',
        objectFit: 'contain'
      }}
    />
    <div style={{ fontSize: '10px', lineHeight: '1.4' }}>
      DONATE TO GLOBAL MUAY THAI COMMUNITY
    </div>
  </div>

  <div 
    style={{
      border: '1px solid black',
      padding: '10px',
      borderRadius: '5px',
      display: 'grid',
      gridTemplateColumns: '1fr auto',
      alignItems: 'center',
      gap: '10px',
      width: '260px'
    }}
  >
    <div style={{ fontSize: '10px', lineHeight: '1.2', width:'200px' }}>
      Point Muay Thai Gym Record 2023-{new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
      })} - 2 Year running total
      <br />
      Scan QR code above to see gym profile or visit www.pmt-west.app/gyms/{gymProfile.id}
    </div>
    <img 
      src="/PMT_Logo_2021.png"
      alt="Point Muay Thai Logo"
      style={{
        width: '50px',
        height: '50px',
        objectFit: 'contain'
      }}
    />
  </div>
</div>

      </div>
      
    </div>
  );
};

export default GymProfileCard;