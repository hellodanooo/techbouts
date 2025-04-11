
'use client';
import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { db } from '@/lib/firebase_techbouts/config';
import { Firestore, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import { format } from 'date-fns';
import { FullContactFighter, RosterFighter } from '@/utils/types';
// Shadcn UI Components
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Loader2, CheckCircle, AlertCircle, X } from "lucide-react";
// MAIN COMPONENTS
import FighterForm from './FighterForm';

interface RegisterProps {
  eventId: string;
  promoterId: string;
  locale: string;
  eventName: string;
  closeModal: () => void;
  registrationFee: number;
  user?: string;
  sanctioningLogoUrl?: string;
  promotionLogoUrl?: string;
  sanctioning: string;
  customWaiver?: string;
  payLaterEnabled: boolean;
}




const CARD_ELEMENT_OPTIONS = {
  style: {
    base: {
      color: "#32325d",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSmoothing: "antialiased",
      fontSize: "16px",
      "::placeholder": {
        color: "#9c9c9c"
      },
      padding: '10px 12px',
    },
    invalid: {
      color: "#fa755a",
      iconColor: "#fa755a"
    },
    complete: {
      color: "#00e676" // Example: green text for completed input
    }
  },
  hidePostalCode: true // Optionally hide the postal code field if not needed
};

interface ConvertedFees {
  amount: number;
  currency: string;
}

interface RegistrationError {
  message: string;
  code?: string;
  details?: unknown;
}

const RegistrationComponent: React.FC<RegisterProps> = ({ eventId, closeModal, registrationFee: baseRegistrationFee, eventName, locale, user, sanctioningLogoUrl, promotionLogoUrl, promoterId, sanctioning, customWaiver, payLaterEnabled }) => {

  const [fighterData, setFighterData] = useState<FullContactFighter | null>(null);
  const [creditCode, setCreditCode] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isCreditCodeValid, setIsCreditCodeValid] = useState<boolean | null>(null);
  const [creditCodeRedeemed, setCreditCodeRedeemed] = useState<boolean | null>(null);
  const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;
  const [showVerifyButton, setShowVerifyButton] = useState<boolean>(false);
  const [rosterCount, setRosterCount] = useState<number>(0);
  const [currentRegistrationFee, setCurrentRegistrationFee] = useState(baseRegistrationFee);
  const stripe = useStripe();
  const elements = useElements();
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isPayLater, setIsPayLater] = useState(false);

  const handlePayLaterChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsPayLater(e.target.checked);
  };

  useEffect(() => {
    // For Mexican events (locale === 'es'), always use base fee
    if (locale === 'es') {
      setCurrentRegistrationFee(baseRegistrationFee);
      return;
    }

    // For non-Mexican events, apply dynamic pricing
    let newFee = baseRegistrationFee;
    if (rosterCount > 140) {
      newFee = 95;
    } else if (rosterCount > 80) {
      newFee = 85;
    } else if (rosterCount > 50) {
      newFee = 75;
    }

    setCurrentRegistrationFee(newFee);
  }, [rosterCount, baseRegistrationFee, locale]);

  const [convertedFee, setConvertedFee] = useState<ConvertedFees>({
    amount: currentRegistrationFee,
    currency: 'USD'
  });

  const [formContent] = useState(() => {
    const en = {
      creditCodeLabel: 'Credit Code:',
      verifyButton: 'Verify',
      validCodeMessage: 'Credit code is valid. Registration will be free.',
      redeemedCodeMessage: 'This credit code has already been redeemed.',
      invalidCodeMessage: 'Invalid credit code. Please try again.',
      registrationFeeLabel: 'Registration Fee:',
      submitButton: 'Submit Registration',
      submittingButton: 'Submitting...',
      successMessage: 'Registration successful! Confirmation email sent to',
      emailErrorMessage: 'Registration successful but there was an error sending confirmation email. Please email info@pointmuaythaica.com for details.',
      paymentFailedMessage: 'Payment failed. Please try again.',
      generalErrorMessage: 'An error occurred. Please try again.',
      gymSuspendedMessage: 'This Team is suspended for {days} more days.',
      freeRegistrationTitle: 'Free Registration',
      freeRegistrationText: 'Your registration is free of charge.',
      statusTitle: 'Status Update',
      payLaterLabel: 'Pay at Weigh-ins',
      submittingOverlayMessage: 'Submitting...',

    };
  
    const es = {
      creditCodeLabel: 'Código de crédito:',
      verifyButton: 'Verificar',
      validCodeMessage: 'El código de crédito es válido. El registro será gratuito.',
      redeemedCodeMessage: 'Este código de crédito ya ha sido usado.',
      invalidCodeMessage: 'Código de crédito inválido. Inténtalo de nuevo.',
      registrationFeeLabel: 'Cuota de inscripción:',
      submitButton: 'Enviar registro',
      submittingButton: 'Enviando...',
      successMessage: '¡Registro exitoso! Correo de confirmación enviado a',
      emailErrorMessage: 'Registro exitoso, pero hubo un error al enviar el correo de confirmación. Por favor escribe a info@pointmuaythaica.com para más información.',
      paymentFailedMessage: 'El pago falló. Inténtalo de nuevo.',
      generalErrorMessage: 'Ocurrió un error. Inténtalo de nuevo.',
      gymSuspendedMessage: 'Este equipo está suspendido por {days} días más.',
      freeRegistrationTitle: 'Registro gratuito',
      freeRegistrationText: 'Tu inscripción no tiene costo.',
      statusTitle: 'Actualización de estado',
      payLaterLabel: 'Pagar en el pesaje',
      submittingOverlayMessage: 'Enviando...',

    };
  
    return locale === 'es' ? es : en;
  });




  /// NEEDS TO BE FIXED /////////////////////////////////////
  /////////////////////////////////////
  useEffect(() => {
    const fetchRosterCount = async () => {
      try {
        // Get a reference to the single roster_json document that contains all fighters
        const rosterJsonRef = doc(db, 'events', eventId, 'roster_json', 'fighters');
        const rosterDoc = await getDoc(rosterJsonRef);
        
        if (rosterDoc.exists()) {
          const data = rosterDoc.data();
          const fighters = data.fighters || [];
          setRosterCount(fighters.length);
        } else {
          setRosterCount(0);
        }
      } catch (error) {
        console.error('Error fetching roster count:', error);
        setRosterCount(0);
      }
    };
  
    fetchRosterCount();
  }, [eventId]);


  
  useEffect(() => {
    const fetchExchangeRate = async () => {
      if (locale === 'es') {
        try {
          const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
          const data = await response.json();
          const mxnRate = data.rates.MXN;

          // Calculate the initial converted amount
          const exactAmount = baseRegistrationFee * mxnRate;

          // Round up to the nearest 100 pesos
          const roundedAmount = Math.ceil(exactAmount / 100) * 100;

          setConvertedFee({
            amount: roundedAmount,
            currency: 'MXN'
          });
        } catch (error) {
          console.error('Error fetching exchange rate:', error);
          setConvertedFee({
            amount: baseRegistrationFee,
            currency: 'USD'
          });
        }
      } else {
        setConvertedFee({
          amount: currentRegistrationFee,
          currency: 'USD'
        });
      }
    };

    fetchExchangeRate();
  }, [locale, baseRegistrationFee, currentRegistrationFee]);

  const validateForm = (): string | null => {
    if (!fighterData) {
      return 'Fighter data is incomplete.';
    }

    // First and last name validation
    if (!fighterData.first) {
      return 'Please enter a first name.';
    }
    if (!fighterData.last) {
      return 'Please enter a last name.';
    }

    // Email validation
    if (!fighterData.email) {
      return 'Please enter an email address.';
    }
    if (!fighterData.email.includes('@')) {
      return 'Please enter a valid email address.';
    }

    // Date of birth validation
    if (!fighterData.dob) {
      return 'Please enter a date of birth.';
    }
    if (!dateRegex.test(fighterData.dob)) {
      return 'Birthday must be in MM/DD/YYYY format.';
    }

    if (fighterData.age < 2) {
      return 'Please Selecte your Birthday To Calculate Age: You might need to select another year and then choose date again';
    }

    // Gym validation
    if (!fighterData.gym) {
      return 'Please select a gym.';
    }

    // Weight class validation
    if (!fighterData.weightclass) {
      return 'Please select a weight class.';
    }

    // Gender validation
    if (!fighterData.gender) {
      return 'Please select a gender.';
    }

    // Phone number validation
    if (!fighterData.phone) {
      return 'Please enter a phone number.';
    }

    // Coach phone number validation
    if (!fighterData.coach_phone) {
      return 'Please enter a coach phone number.';
    }

    // Coach name validation
    if (!fighterData.coach_name) {
      return 'Please enter a coach name.';
    }

    // Height validation (additional for heightFoot and heightInch if needed)
    if (!fighterData.heightFoot) {
      return 'Please select foot for height.';
    }
    if (!fighterData.heightInch) {
      return 'Please select inches for height.';
    }

    return null; // No errors found
  };

  const validateCreditCode = async () => {
    if (!creditCode) {
      setIsCreditCodeValid(null);
      setCreditCodeRedeemed(null);
      return;
    }

    const creditCodeRef = doc(db, 'couponCodes', creditCode);
    const creditCodeDoc = await getDoc(creditCodeRef);

    if (creditCodeDoc.exists()) {
      const data = creditCodeDoc.data();
      if (data.redeemed) {
        setIsCreditCodeValid(false);
        setCreditCodeRedeemed(true);
      } else {
        setIsCreditCodeValid(true);
        setCreditCodeRedeemed(false);
      }
    } else {
      setIsCreditCodeValid(false);
      setCreditCodeRedeemed(false);
    }
  };

  const handleCreditCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreditCode(e.target.value);
    setShowVerifyButton(true); // Show the "Verify" button when the user starts typing
  };

  const sendConfirmationEmail = async (sanctioning: string, fighterData: FullContactFighter, eventName: string, eventId: string) => {
    
    if (sanctioning === 'PBSC') {
      try {
        const emailResponse = await axios.post('/api/emails/sendConfirmationEmailPBSC', {
          email: fighterData.email.toLowerCase(),
          firstName: fighterData.first,
          lastName: fighterData.last,
          weightClass: fighterData.weightclass,
          gym: fighterData.gym,
          gender: fighterData.gender,
          dob: fighterData.dob,
          age: fighterData.age,
          eventName,
          eventId,
          heightFoot: fighterData.heightFoot,
          heightInch: fighterData.heightInch,
          phone: fighterData.phone,
          coach: fighterData.coach_name,
          coach_phone: fighterData.coach_phone,
          locale
        });
        if (emailResponse.status === 200) {
          alert(`${formContent.successMessage} ${fighterData.email.toLowerCase()}`);
        }
      } catch (error) {
        console.error('Error sending confirmation email:', error);
        alert(formContent.emailErrorMessage);
      }
        
        } else if (sanctioning === 'PMT') {

          try {
            const emailResponse = await axios.post('/api/emails/sendConfirmationEmail', {
              email: fighterData.email.toLowerCase(),
              firstName: fighterData.first,
              lastName: fighterData.last,
              weightClass: fighterData.weightclass,
              gym: fighterData.gym,
              gender: fighterData.gender,
              dob: fighterData.dob,
              age: fighterData.age,
              eventName,
              eventId,
              heightFoot: fighterData.heightFoot,
              heightInch: fighterData.heightInch,
              phone: fighterData.phone,
              coach: fighterData.coach_name,
              coach_phone: fighterData.coach_phone,
              locale
            });
      
            if (emailResponse.status === 200) {
              alert(`${formContent.successMessage} ${fighterData.email.toLowerCase()}`);
            }
          } catch (error) {
            console.error('Error sending confirmation email:', error);
            alert(formContent.emailErrorMessage);
          }

        } else if (sanctioning === 'IKF') {

          try {
            const emailResponse = await axios.post('/api/emails/sendConfirmationEmailIKF', {
              email: fighterData.email.toLowerCase(),
              firstName: fighterData.first,
              lastName: fighterData.last,
              weightClass: fighterData.weightclass,
              gym: fighterData.gym,
              gender: fighterData.gender,
              dob: fighterData.dob,
              age: fighterData.age,
              eventName,
              eventId,
             
              heightFoot: fighterData.heightFoot,
              heightInch: fighterData.heightInch,
              phone: fighterData.phone,
              coach: fighterData.coach_name,
              coach_phone: fighterData.coach_phone
            });
      
            if (emailResponse.status === 200) {
              alert(`${formContent.successMessage} ${fighterData.email.toLowerCase()}`);
            }
          } catch (error) {
            console.error('Error sending confirmation email:', error);
            alert(formContent.emailErrorMessage);
          }

        }


  };

  async function saveFighterToFirestore(
    db: Firestore,
    eventId: string,
    fighterData: FullContactFighter & {
      paymentIntentId?: string;
      paymentAmount?: number;
      paymentCurrency?: string;
    },
    currentDate: string,
    promoterId: string

  ): Promise<boolean> {
    try {
      // Create payment info object, ensuring no undefined values
      const payment_info = {
        paymentIntentId: fighterData.paymentIntentId || "",
        paymentAmount: fighterData.paymentAmount || 0,
        paymentCurrency: fighterData.paymentCurrency || 'USD'
      };
      
      // Determine class based on experience and amateur status

      
      // Determine age_gender classification
      const ageGenderClassification = determineAgeGender(fighterData.age, fighterData.gender);
      
      // Prepare fighter data to match FullContactFighter interface
      const fullContactFighterData: Partial<RosterFighter> = {
        // Basic Information
        fighter_id: fighterData.fighter_id,
        first: fighterData.first,
        last: fighterData.last,
        dob: fighterData.dob,
        age: fighterData.age,
        gender: fighterData.gender,
        email: fighterData.email.toLowerCase(),
        
        // Gym Information
        gym: fighterData.gym,
        coach: fighterData.coach_name,
        coach_email: fighterData.coach_email || '',
        coach_name: fighterData.coach_name,
        coach_phone: fighterData.coach_phone,
        
        // Location Information
        state: fighterData.state || '',
        city: fighterData.city || '',
        
        // Physical Information
        weightclass: fighterData.weightclass,
    
        
        // Record
        mt_win: fighterData.mt_win || 0,
        mt_loss: fighterData.mt_loss || 0,
        boxing_win: fighterData.boxing_win || 0,
        boxing_loss: fighterData.boxing_loss || 0,
        mma_win: fighterData.mma_win || 0,
        mma_loss: fighterData.mma_loss || 0,
        pmt_win: fighterData.pmt_win || 0,
        pmt_loss: fighterData.pmt_loss || 0,
        
        // Experience & Classification
        years_exp: fighterData.years_exp || 0,
        age_gender: ageGenderClassification,
      
        // Documentation
        docId: fighterData.fighter_id,
        payment_info,
        
        // Additional data for tracking
      };
      
      // Reference to the roster_json document
      const rosterJsonRef = doc(db, 'events', 'promotions', promoterId,  eventId, 'roster_json', 'fighters');
      
      // Check if the document exists
      const rosterJsonDoc = await getDoc(rosterJsonRef);
      const batch = writeBatch(db);
      
      if (rosterJsonDoc.exists()) {
        // Document exists, get the current fighters array
        const data = rosterJsonDoc.data();
        const fighters = data.fighters || [];
        
        // Add the new fighter to the array
        fighters.push(fullContactFighterData);
        
        // Update the document with the new array
        batch.update(rosterJsonRef, { fighters: fighters });
      } else {
        // Document doesn't exist, create it with the fighter as the first item in the array
        batch.set(rosterJsonRef, { fighters: [fullContactFighterData] });
      }
      
 
      // Commit the batch
      await batch.commit();
      
      return true;
    } catch (error) {
      console.error('Error saving fighter data to Firestore:', error);
      throw new Error('Failed to save fighter data');
    }
  }
  
 
  
  // Helper function to determine age_gender classification
  function determineAgeGender(age: number, gender: string): 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS' {
    if (age >= 18) {
      return gender.toLowerCase() === 'male' ? 'MEN' : 'WOMEN';
    } else {
      return gender.toLowerCase() === 'male' ? 'BOYS' : 'GIRLS';
    }
  }

  function handleRegistrationError(error: unknown): RegistrationError {
    if (error instanceof Error) {
      return {
        message: error.message,
        details: error
      };
    }

    if (typeof error === 'string') {
      return {
        message: error
      };
    }

    return {
      message: 'An unexpected error occurred during registration',
      details: error
    };
  }

const handleRegistrationSubmit = async () => {
  if (isSubmitting) return;
  setIsSubmitting(true);
  setStatusMessage('');

  const formError = validateForm();
  if (formError) {
    alert(formError);
    setIsSubmitting(false);
    return;
  }

  if (!fighterData) {
    console.log('Fighter data is missing.');
    setIsSubmitting(false);
    return;
  }

  const currentDate = format(new Date(), 'yyyy-MM-dd');

  try {
    // Check if registration is free (valid credit code or registration fee is 0)
    const isFreeRegistration = isCreditCodeValid || currentRegistrationFee === 0;

    if (isFreeRegistration) {
      setStatusMessage('Submitting free registration data...');

      await saveFighterToFirestore(db, eventId, fighterData, currentDate, promoterId);
      setStatusMessage('Submitted Successfully.');

      // Update credit code as redeemed if using a credit code
      if (isCreditCodeValid && creditCode) {
        setStatusMessage('Marking Credit Code as redeemed...');

        await setDoc(doc(db, 'couponCodes', creditCode), {
          redeemed: true,
          redeemedBy: fighterData.email,
          redeemedAt: currentDate,
          eventId: eventId
        }, { merge: true });

        setStatusMessage('Code Marked Redeemed');
      }

      setStatusMessage('Sending confirmation email...');

      await sendConfirmationEmail(sanctioning,fighterData, eventName, eventId);

      setStatusMessage('Email Sent');
      closeModal();
    } else {
      // Handle paid registration
      setStatusMessage('Posting Payment...');

      if (!stripe || !elements) {
        throw new Error('Stripe.js not loaded');
      }

      let token;
if (!isPayLater) {
  const cardElement = elements.getElement(CardElement);
  if (!cardElement) {
    throw new Error('CardElement not found');
  }

  const { token: createdToken, error: stripeError } = await stripe.createToken(cardElement);
  if (stripeError) {
    console.error('Stripe error:', stripeError); // Debug log
    throw new Error(stripeError.message);
  }

  token = createdToken;
}

      const paymentResponse = await axios.post('/api/stripe', {
        token: token?.id,
        eventId,
        amount: convertedFee.amount,
        currency: convertedFee.currency,
        idempotencyKey: `reg-charge-${fighterData.fighter_id}-${Date.now()}`,
        fighter_id: fighterData.fighter_id,
        locale,
        sanctioning
      });

      if (paymentResponse.data.success && paymentResponse.data.paymentIntentId) {
        setStatusMessage('Payment Successful. Submitting registration data...');

        // Save fighter data with payment information
        const fighterDataWithPayment = {
          ...fighterData,
          paymentIntentId: paymentResponse.data.paymentIntentId,
          paymentAmount: convertedFee.amount,
          paymentCurrency: convertedFee.currency
        };

        await saveFighterToFirestore(db, eventId, fighterDataWithPayment, currentDate, promoterId);

        setStatusMessage('Submitted Successfully.');
        setStatusMessage('Sending confirmation email...');

        await sendConfirmationEmail(sanctioning, fighterData, eventName, eventId);
        
        setStatusMessage('Email Sent');
        setStatusMessage('Registration Successful');
setTimeout(() => {
  setFighterData(null);
  setCreditCode('');
  setIsCreditCodeValid(null);
  setCreditCodeRedeemed(null);
  setIsPayLater(false);
  setStatusMessage('');
  closeModal();
}, 2000);

      } else {
        setStatusMessage(formContent.paymentFailedMessage);
        throw new Error('Payment failed: Unable to process payment');
      }
    }
  } catch (error: unknown) {
    setStatusMessage('An error occurred. Please try again.');
    const handledError = handleRegistrationError(error);
    console.error('Error during registration:', handledError);
    alert(handledError.message || formContent.generalErrorMessage);
  } finally {
    setIsSubmitting(false);
  }
};


return (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
      <CardHeader className="space-y-4">
        <div className="flex justify-between items-center">
          <CardTitle className="text-2xl font-bold">Registration Form</CardTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={closeModal} 
            className="rounded-full"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <div className="flex justify-center items-center space-x-4">
          {sanctioningLogoUrl && (
            <div className="h-16 w-16 rounded-full border-2 border-gray-200 overflow-hidden bg-white flex items-center justify-center">
              <img 
                src={sanctioningLogoUrl} 
                alt="Sanctioning Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
          )}
          {promotionLogoUrl && (
            <div className="h-16 w-16 rounded-full border-2 border-gray-200 overflow-hidden bg-white flex items-center justify-center">
              <img 
                src={promotionLogoUrl} 
                alt="Promotion Logo" 
                className="h-full w-full object-contain" 
              />
            </div>
          )}
        </div>
        
        <CardDescription className="text-center">
          <Badge variant="outline" className="bg-black text-white py-1 px-4 text-base font-medium">
            {eventName}
          </Badge>
        </CardDescription>
        
        <Separator />
      </CardHeader>
      
      <CardContent className="space-y-6">
        <FighterForm
          onFormDataChange={setFighterData}
          locale={locale}
          user={user}
          sanctioning={sanctioning}
          customWaiver={customWaiver}
        />
        


      <div className="space-y-2">
  {payLaterEnabled && (
    <div className="border border-gray-300 rounded p-4 space-y-2 mt-4">
      <p className="font-medium">
        {locale === 'es'
          ? 'El Promotor ha habilitado a los Atletas para Pagar la Tarifa de Inscripción en el Pesaje'
          : 'The Promoter Has Enabled the Option for Athletes to Pay Registration Fee at Weigh-ins'}
      </p>
      <label className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="payLater"
          checked={isPayLater}
          onChange={handlePayLaterChange}
        />
        <span>
          {formContent.payLaterLabel ?? (locale === 'es' ? 'Pagar en el pesaje' : 'Pay at Weigh-ins')}
        </span>
      </label>
      <p className="text-sm text-gray-600">
      
      </p>
    </div>
  )}

  {!isPayLater && (
    <>
      <div className="flex items-end gap-2">
        <div className="w-full space-y-1">
          <Label htmlFor="creditCode">{formContent.creditCodeLabel}</Label>
          <Input
            id="creditCode"
            value={creditCode}
            onChange={handleCreditCodeChange}
            placeholder="Enter credit code if you have one"
          />
        </div>
        {showVerifyButton && (
          <Button
            onClick={validateCreditCode}
            variant="outline"
            size="default"
          >
            {formContent.verifyButton}
          </Button>
        )}
      </div>

      {isCreditCodeValid !== null && (
        <div className="mt-2">
          {isCreditCodeValid ? (
            <Alert variant="default" className="bg-green-50 border-green-200">
              <CheckCircle className="h-4 w-4 text-green-600" />
              <AlertTitle className="text-green-600">Valid Code</AlertTitle>
              <AlertDescription className="text-green-600">
                {formContent.validCodeMessage}
              </AlertDescription>
            </Alert>
          ) : creditCodeRedeemed ? (
            <Alert variant="default" className="bg-amber-50 border-amber-200">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertTitle className="text-amber-600">Already Redeemed</AlertTitle>
              <AlertDescription className="text-amber-600">
                {formContent.redeemedCodeMessage}
              </AlertDescription>
            </Alert>
          ) : (
            <Alert variant="default" className="bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertTitle className="text-red-600">Invalid Code</AlertTitle>
              <AlertDescription className="text-red-600">
                {formContent.invalidCodeMessage}
              </AlertDescription>
            </Alert>
          )}
        </div>
      )}
    </>
  )}
</div>

<Separator />

{(isCreditCodeValid || currentRegistrationFee === 0) && !isPayLater ? (
  <Alert variant="default" className="bg-green-50 border-green-200">
    <CheckCircle className="h-4 w-4 text-green-600" />
    <AlertTitle className="text-green-600">Free Registration</AlertTitle>
    <AlertDescription className="text-green-600">
      Your registration is free of charge.
    </AlertDescription>
  </Alert>
) : isPayLater ? (
  <Alert variant="default" className="bg-yellow-50 border-yellow-200">
    <AlertTitle className="text-yellow-700">Pay at Weigh-ins</AlertTitle>
    <AlertDescription className="text-yellow-700">
      {formContent.registrationFeeLabel}{" "}
      {convertedFee.currency === 'MXN'
        ? `${convertedFee.amount} MXN`
        : `$${currentRegistrationFee} USD`} + 10% surcharge
    </AlertDescription>
  </Alert>
) : (
  <div className="space-y-4">
    <div className="space-y-2">
      <Label htmlFor="card-element">{formContent.registrationFeeLabel}</Label>
      <div className="border rounded-md p-3 bg-gray-50">
        <CardElement id="card-element" options={CARD_ELEMENT_OPTIONS} />
      </div>
    </div>

    <div className="flex items-center justify-between">
      <div className="text-sm text-gray-600">
        Sanctioning: <Badge variant="outline" className="font-normal">{sanctioning}</Badge>
      </div>
      <div className="text-sm font-medium">
        Fee: {convertedFee.currency === 'MXN'
          ? `${convertedFee.amount} MXN`
          : `$${currentRegistrationFee} USD`}
      </div>
    </div>
  </div>
)}

{statusMessage && (
  <Alert className="bg-blue-50 border-blue-200">
    <AlertTitle className="text-blue-700">Status Update</AlertTitle>
    <AlertDescription className="text-blue-600">
      {statusMessage}
    </AlertDescription>
  </Alert>
)}
      </CardContent>
      
      <CardFooter className="flex justify-end">
        <Button 
          onClick={handleRegistrationSubmit} 
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >

          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {formContent.submittingButton}              
            </>
          ) : (
            formContent.submitButton
          )}

        </Button>
      </CardFooter>
    </Card>

    {isSubmitting && (
  <div className="fixed inset-0 z-50 bg-white/80 flex flex-col items-center justify-center space-y-4">
    <Loader2 className="h-6 w-6 animate-spin text-gray-600" />
    <p className="text-gray-700">{statusMessage || formContent.submittingOverlayMessage}</p>
  </div>
)}

  </div>
);
};

export default RegistrationComponent;


