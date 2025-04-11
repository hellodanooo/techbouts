import React from 'react';

// Define a type for waiver content
export type WaiverContent = {
  title: string;
  content: React.ReactNode;
}

// Object to store all waivers by sanctioning body
export const waivers: Record<string, WaiverContent | Record<string, WaiverContent>> = {
  'PMT': {
    en: {
    title: 'Waiver and Release Agreement - Point Muay Thai',
    content: (
      <div className="space-y-4 text-sm">
        <p>
          I, the competitor named below, and/or the legal guardian of the competitor, by submitting this application, acknowledge, understand, and agree to the following:
        </p>

        <p>
          <strong>1. Assumption of Risk & Liability Release</strong><br />
          I voluntarily participate in events organized by <strong>Muay Thai Purist</strong> <strong>IKF Point Muay Thai</strong> and <strong>Point Boxing Sparring Circuit</strong>, hosted on <strong>pmt-west.app</strong> and <strong>pmtwest.org</strong>, operated by <strong>Ryan Hodges, and Rafael Mendoza, and Daniel Hodges</strong> and originally founded by <strong>Johnny Davis Enterprises DBA (AK Promotions)</strong> and recognize the continued involvement of various promoters, officials, and organizations.
        </p>

        <p>
          I fully understand and accept that participation in Muay Thai/Kickboxing and combat sports involves inherent risks, including but not limited to,
          <strong>serious injury, permanent disability, paralysis, or death</strong>. I hereby release and discharge all individuals and entities listed above from any liability, claims, or demands arising from my participation in any event.
        </p>

        <p>
          <strong>2. Data Usage & Digital Consent</strong><br />
          I acknowledge that my personal information, fight records, and participation details may be stored on <strong>PMT-West.app</strong>, <strong>TechBouts.com</strong> and <strong>ikffightplatform.com</strong> for event management, matchmaking, and competition records.
        </p>

        <p>
          <strong>3. Media Release & Publicity Consent</strong><br />
          I grant <strong>IKF Point Muay Thai League, PMT-West.app, TechBouts.com</strong> full rights to use any photographs, videos, live streams, and digital media recorded at any event.
        </p>

        <p>
          <strong>4. Agreement to Rules & Conduct Policy</strong><br />
          I agree to abide by all <strong>official Muay Thai League rules and regulations</strong>. I acknowledge that any misconduct may result in penalties, disqualification, or suspension from future events.
        </p>

        <p>
          <strong>5. Medical & Insurance Responsibility</strong><br />
          I affirm that I am <strong>physically and mentally fit</strong> to participate and have adequate medical insurance coverage.
        </p>

        <p>
          <strong>6. Identification & Eligibility</strong><br />
          I understand that a valid birth certificate or government-issued ID may be required to compete.
        </p>

        <p>
          <strong>7. Refund Policy</strong><br />
          I agree that any registration fees or ticket sales are <strong>non-refundable</strong>, unless the event is canceled.
        </p>

        <p>
          <strong>8. Parent/Guardian Consent for Minors</strong><br />
          If the competitor is under the age of 18, a <strong>parent or legal guardian must sign this waiver</strong> on their behalf.
          By checking the box below and submitting this form, the parent or legal guardian acknowledges that they have read, understood, and agreed to all terms stated in this waiver
          and accept full responsibility for the minors participation in the event.
        </p>
      </div>
    )
  },
  es: {
    title: 'Acuerdo de Exención de Responsabilidad - PBSC',
    content: (
      <div className="space-y-4 text-sm">
        <p><strong>1. Asunción de Riesgo y Exención de Responsabilidad</strong><br />
        Participo voluntariamente en eventos organizados por IKF Point Muay Thai y Point Boxing Sparring Circuit, alojados en pmt-west.app y pmtwest.org, operados por Ryan Hodges, Rafael Mendoza y Daniel Hodges...</p>

        <p><strong>2. Uso de Datos y Consentimiento Digital</strong><br />
        Reconozco que mi información personal, historial de peleas y detalles de participación...</p>

        <p><strong>3. Autorización de Imagen y Consentimiento para Publicidad</strong><br />
        Autorizo a IKF Point Muay Thai League, PMT-West.app y TechBouts.com el uso completo...</p>

        <p><strong>4. Acuerdo con el Reglamento y la Política de Conducta</strong><br />
        Acepto cumplir con todas las reglas y regulaciones oficiales de la Muay Thai League...</p>

        <p><strong>5. Responsabilidad Médica y de Seguro</strong><br />
        Declaro estar en condiciones físicas y mentales adecuadas...</p>

        <p><strong>6. Identificación y Elegibilidad</strong><br />
        Entiendo que se puede requerir una acta de nacimiento válida...</p>

        <p><strong>7. Política de Reembolsos</strong><br />
        Acepto que las tarifas de inscripción o ventas de boletos no son reembolsables...</p>

        <p><strong>8. Consentimiento de Padres/Tutores para Menores de Edad</strong><br />
        Si el competidor es menor de 18 años, un padre o tutor legal debe firmar esta exención...</p>
      </div>
    )
  }

},
  
  'PBSC': {
    en: {
    title: 'Waiver and Release of Liability - PBSC Point Boxing Sparring Circuit',
    content: (
      <div className="space-y-4 text-sm">
        <p>
          I, the competitor named below, and/or the legal guardian of the competitor, by submitting this application, acknowledge, understand, and agree to the following:
        </p>

        <p>
          <strong>Assumption of Risk & Liability Release</strong><br />
          I voluntarily participate in events organized by <strong>IKF Point Muay Thai and Point Boxing Sparring Circuit</strong>, hosted on <strong>PBSCUSA.com</strong> and operated by <strong>Rafael Mendoza, Ryan Hodges, and Daniel Hodges</strong>, originally founded by <strong>Johnny Davis Enterprises DBA (AK Promotions)</strong>. I recognize the continued involvement of various promoters, officials, and organizations.
        </p>

        <p>
          I fully understand and accept that participation in Muay Thai/Kickboxing, boxing, and combat sports involves inherent risks, including but not limited to <strong>serious injury, permanent disability, paralysis, or death</strong>. I hereby release and discharge all individuals and entities listed above from any liability, claims, or demands arising from my participation in any event.
        </p>

        <p>
          <strong>Data Usage & Digital Consent</strong><br />
          I acknowledge that my personal information, fight records, and participation details may be stored on <strong>PBSCUSA.com, TechBouts.com, and ikffightplatform.com</strong> for event management, matchmaking, and competition records.
        </p>

        <p>
          <strong>Media Release & Publicity Consent</strong><br />
          I grant <strong>PBSC, IKF Point Muay Thai League, and their affiliates</strong> full rights to use any photographs, videos, live streams, and digital media recorded at any event for promotional purposes.
        </p>

        <p>
          <strong>Agreement to Rules & Conduct Policy</strong><br />
          I agree to abide by all <strong>official rules and regulations of the PBSC Point Boxing Sparring Circuit and IKF Point Muay Thai</strong>. I acknowledge that any misconduct may result in penalties, disqualification, or suspension from future events.
        </p>

        <p>
          <strong>Medical & Insurance Responsibility</strong><br />
          I affirm that I am <strong>physically and mentally fit</strong> to participate and have adequate medical insurance coverage. I consent to receive medical treatment deemed necessary if an injury occurs and agree that PBSC and its affiliates are not responsible for medical costs incurred.
        </p>

        <p>
          <strong>Identification & Eligibility</strong><br />
          I understand that a valid birth certificate or government-issued ID may be required to compete.
        </p>

        <p>
          <strong>Refund Policy</strong><br />
          I agree that any registration fees or ticket sales are <strong>non-refundable</strong> unless the event is canceled.
        </p>

        <p>
          <strong>Parent/Guardian Consent for Minors</strong><br />
          If the competitor is under the age of 18, a <strong>parent or legal guardian must sign this waiver</strong> on their behalf.
          By checking the box below and submitting this form, the parent or legal guardian acknowledges that they have read, understood, and agreed to all terms stated in this waiver
          and accept full responsibility for the minors participation in the event.
        </p>
        
        <p>
          By clicking I Acknowledge, I confirm that I have read, understood, and agree to the terms and conditions of this waiver.
        </p>
      </div>
    )
  },
  es: {
    title: 'Acuerdo de Exención de Responsabilidad - PBSC',
    content: (
      <div className="space-y-4 text-sm">
        <p><strong>1. Asunción de Riesgo y Exención de Responsabilidad</strong><br />
        Participo voluntariamente en eventos organizados por IKF Point Muay Thai y Point Boxing Sparring Circuit, alojados en pmt-west.app y pmtwest.org, operados por Ryan Hodges, Rafael Mendoza y Daniel Hodges...</p>

        <p><strong>2. Uso de Datos y Consentimiento Digital</strong><br />
        Reconozco que mi información personal, historial de peleas y detalles de participación...</p>

        <p><strong>3. Autorización de Imagen y Consentimiento para Publicidad</strong><br />
        Autorizo a IKF Point Muay Thai League, PMT-West.app y TechBouts.com el uso completo...</p>

        <p><strong>4. Acuerdo con el Reglamento y la Política de Conducta</strong><br />
        Acepto cumplir con todas las reglas y regulaciones oficiales de la Muay Thai League...</p>

        <p><strong>5. Responsabilidad Médica y de Seguro</strong><br />
        Declaro estar en condiciones físicas y mentales adecuadas...</p>

        <p><strong>6. Identificación y Elegibilidad</strong><br />
        Entiendo que se puede requerir una acta de nacimiento válida...</p>

        <p><strong>7. Política de Reembolsos</strong><br />
        Acepto que las tarifas de inscripción o ventas de boletos no son reembolsables...</p>

        <p><strong>8. Consentimiento de Padres/Tutores para Menores de Edad</strong><br />
        Si el competidor es menor de 18 años, un padre o tutor legal debe firmar esta exención...</p>
      </div>
    )
  }
},

  'IKF': {
    title: 'Waiver and Release Agreement - International Kickboxing Federation',
    content: (
      <div className="space-y-4 text-sm">
        <p>
          I, the competitor named below, and/or the legal guardian of the competitor, by submitting this application, acknowledge, understand, and agree to the following:
        </p>

        <p>
          <strong>1. Assumption of Risk & Liability Release</strong><br />
          I voluntarily participate in events organized by <strong>International Kickboxing Federation (IKF)</strong>, hosted on <strong>ikf.com</strong> and <strong>techbouts.com</strong>, and recognize the continued involvement of various promoters, officials, and organizations.
        </p>

        {/* Additional IKF specific waiver content would go here */}
        
        <p>
          <strong>8. Parent/Guardian Consent for Minors</strong><br />
          If the competitor is under the age of 18, a <strong>parent or legal guardian must sign this waiver</strong> on their behalf.
          By checking the box below and submitting this form, the parent or legal guardian acknowledges that they have read, understood, and agreed to all terms stated in this waiver
          and accept full responsibility for the minors participation in the event.
        </p>
      </div>
    )
  }
};

// Helper function to get waiver with fallback to PMT
export const getWaiver = (sanctioning: string, locale: string): WaiverContent => {
  const waiver = waivers[sanctioning];

  if (typeof waiver === 'object' && 'en' in waiver) {
    return (waiver as Record<string, WaiverContent>)[locale] || (waiver as Record<string, WaiverContent>)['en'];
  }

  return waiver as WaiverContent || waivers['PMT'];
};