import React from 'react';
import Image from 'next/image';

const SanctioningBanner = () => {
  
    const containerStyle = {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: '-1rem',
  };

  const logoStyle = {
    transition: 'transform 0.3s ease',
    marginLeft: '1rem',
    marginRight: '1rem',
  };


  

  return (

    <div className='containerDivider'>



<div style={{ position: 'relative' }}>
  <div className="goldTitle">
    <span className="goldTitleText">Sanctioned By</span>
  </div>
</div>



    <div style={containerStyle}>
      
      

      <div
      style={{
        fontSize: 'clamp(10px, 3vw, 16px)',
        marginRight: '-1rem',
        width: '20%',
      }}
      >
        Intrnational Kickboxing Federation
      </div>
      
      <a
        href="https://www.ikffightsports.com"
        target="_blank"
        rel="noopener noreferrer"
        className="logoleft"
        style={logoStyle}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        <Image
          src="/images/ikf_logo.png"
          alt="IKF Logo"
          width={100}
          height={100}
          style={{ 
            objectFit: 'contain' }}
        />
      </a>
      <a
        href="https://boxing.nv.gov/"
        target="_blank"
        rel="noopener noreferrer"
        className="logoright"
        style={logoStyle}
        onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
        onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
      >
        


        <Image
          src="/images/ca_ath.png"
          alt="California Athletic Commission Logo"
          width={100}
          height={100}
          style={{ 
            marginLeft: '-1rem',
            objectFit: 'contain' }}

        />
      </a>

      <div
       style={{
        fontSize: 'clamp(10px, 3vw, 16px)',
        marginLeft: '-1rem',
        width: '20%',

      }}
      >
        Califonrnia State Athletic Commission
      </div>

    </div>
    </div>
  );
};

export default SanctioningBanner;