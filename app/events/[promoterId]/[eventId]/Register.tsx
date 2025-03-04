
'use client';
import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { db } from '@/lib/firebase_techbouts/config';
import { Firestore, doc, getDoc, setDoc, writeBatch } from 'firebase/firestore';
import FighterForm from './FighterForm';
import { format } from 'date-fns';
import { FullContactFighter } from '@/utils/types';

interface RegisterProps {
  eventId: string;
  locale: string;
  eventName: string;
  closeModal: () => void;
  registrationFee: number;
  user?: string;
  sanctioningLogoUrl?: string;
  promotionLogoUrl?: string;
}

interface FighterFormData {
  first: string;
  last: string;
  email: string;
  dob: string;
  gym: string;
  age: number;
  weightclass: number;
  fighter_id: string;
  win: number;
  loss: number;
  gender: string;
  years_exp: number;
  other: string;
  ammy: number;
  height: number;
  heightFoot: number;
  heightInch: number;
  phone: string;
  coach_phone: string;
  coach_name: string;
  coach_email: string;
  state: string;
  city: string;
  mt_win: number;
  mt_loss: number;
  boxing_win: number;
  boxing_loss: number;
  mma_win: number;
  mma_loss: number;
  pmt_win: number;
  pmt_loss: number;
  gym_id?: string;

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

const RegistrationComponent: React.FC<RegisterProps> = ({ eventId, closeModal, registrationFee: baseRegistrationFee, eventName, locale, user, sanctioningLogoUrl }) => {

  const [fighterData, setFighterData] = useState<FighterFormData | null>(null);
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

  const [formContent] = useState({
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
    gymSuspendedMessage: 'This Team is suspended for {days} more days.'
  });

  useEffect(() => {
   console.log('Sanctioning Logo URL:', sanctioningLogoUrl);
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

  const sendConfirmationEmail = async (fighterData: FighterFormData, eventName: string, eventId: string) => {
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
        ammy: fighterData.ammy,
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
  };

  async function saveFighterToFirestore(
    db: Firestore,
    eventId: string,
    fighterData: FighterFormData & {
      paymentIntentId?: string;
      paymentAmount?: number;
      paymentCurrency?: string;
    },
    currentDate: string
  ): Promise<boolean> {
    try {
      // Create payment info object, ensuring no undefined values
      const paymentInfo = {
        paymentIntentId: fighterData.paymentIntentId || "",
        paymentAmount: fighterData.paymentAmount || 0,
        paymentCurrency: fighterData.paymentCurrency || 'USD'
      };
      
      // Determine class based on experience and amateur status
      const fighterClass = determineClass(fighterData.years_exp || 0, fighterData.ammy || 0);
      
      // Determine age_gender classification
      const ageGenderClassification = determineAgeGender(fighterData.age, fighterData.gender);
      
      // Prepare fighter data to match FullContactFighter interface
      const fullContactFighterData: Partial<FullContactFighter> = {
        // Basic Information
        fighter_id: fighterData.fighter_id,
        id: fighterData.fighter_id,
        first: fighterData.first,
        last: fighterData.last,
        dob: fighterData.dob,
        age: fighterData.age,
        gender: fighterData.gender,
        email: fighterData.email.toLowerCase(),
        
        // Gym Information
        gym: fighterData.gym,
        gym_id: fighterData.gym_id || '',
        coach: fighterData.coach_name,
        coach_email: fighterData.coach_email || '',
        coach_name: fighterData.coach_name,
        coach_phone: fighterData.coach_phone,
        
        // Location Information
        state: fighterData.state || '',
        city: fighterData.city || '',
        
        // Physical Information
        weightclass: fighterData.weightclass,
        height: calculateHeightInInches(fighterData.heightFoot, fighterData.heightInch),
        
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
        class: fighterClass,
        age_gender: ageGenderClassification,
        confirmed: true,
        
   
        
        // Documentation
        docId: fighterData.fighter_id,
        
        // Additional data for tracking
        date_registered: currentDate,
        payment_info: paymentInfo
      };
      
      // Reference to the roster_json document
      const rosterJsonRef = doc(db, 'events', eventId, 'roster_json', 'fighters');
      
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
      
      // Also save an individual document for this fighter in a separate collection for easier querying
      const individualFighterRef = doc(db, 'events', eventId, 'fighters', fighterData.fighter_id);
      batch.set(individualFighterRef, fullContactFighterData);
      
      // Commit the batch
      await batch.commit();
      
      return true;
    } catch (error) {
      console.error('Error saving fighter data to Firestore:', error);
      throw new Error('Failed to save fighter data');
    }
  }
  
  // Helper function to calculate height in inches
  function calculateHeightInInches(feet: number, inches: number): number {
    return (feet * 12) + inches;
  }
  
  // Helper function to determine fighter class based on experience
  function determineClass(yearsExp: number, ammy: number): 'A' | 'B' | 'C' {
    if (ammy === 0) {
      return 'A'; // Professional
    } else if (yearsExp > 3) {
      return 'B'; // Experienced amateur
    } else {
      return 'C'; // Novice amateur
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

      await saveFighterToFirestore(db, eventId, fighterData, currentDate);
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
      await sendConfirmationEmail(fighterData, eventName, eventId);
      setStatusMessage('Email Sent');
      closeModal();
    } else {
      // Handle paid registration
      setStatusMessage('Posting Payment...');

      if (!stripe || !elements) {
        throw new Error('Stripe.js not loaded');
      }

      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('CardElement not found');
      }

      // Process payment
      const { token, error: stripeError } = await stripe.createToken(cardElement);
      if (stripeError) throw new Error(stripeError.message);

      const paymentResponse = await axios.post('/api/stripe', {
        token: token.id,
        eventId,
        amount: convertedFee.amount,
        currency: convertedFee.currency,
        idempotencyKey: `reg-charge-${fighterData.fighter_id}-${Date.now()}`,
        pmt_id: fighterData.fighter_id,
        locale
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

        await saveFighterToFirestore(db, eventId, fighterDataWithPayment, currentDate);

        setStatusMessage('Submitted Successfully.');
        setStatusMessage('Sending confirmation email...');

        await sendConfirmationEmail(fighterData, eventName, eventId);
        setStatusMessage('Email Sent');
        setStatusMessage('Registration Successful');

        closeModal();
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

    <div className="fixed bg-white inset-0 z-50 flex items-center justify-center">
    


      <div className="p-6 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto relative">
   
   



    {sanctioningLogoUrl && (
      <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '10px',
        marginBottom: '10px',
        fontSize: '2.5rem',
        border: '1px solid black',
        borderRadius: '10px',
      }}
      >



    <div>
      <img src={sanctioningLogoUrl} alt="Sanctioning Body Logo" className="h-20 w-auto mx-auto" />
    </div>  
 
  
    </div>

  
    )}
   
   
      <div style={{ backgroundColor: 'black', color: 'white', padding: '10px', textAlign: 'center'
        
       }}>
        <h1>Registration Form for {eventName}</h1>
      </div>

        <div>
          Current Fighters Registered: {rosterCount}<br></br>
          Early Bird (under 50 Athletes): 65 | 50-80: 75 | 80-110: 85 | 110+: 95
        </div>

        <FighterForm
          onFormDataChange={setFighterData}
          locale={locale}
          user={user}
        />

        <div style={{ marginBottom: '30px' }} className='credit-code-container'>
          <label htmlFor='creditCode'>
            {formContent.creditCodeLabel}:
          </label>
          <input
            type='text'
            id='creditCode'
            value={creditCode}
            onChange={handleCreditCodeChange}
          />
          {showVerifyButton && (
            <button onClick={validateCreditCode} className='verifyButton'>

              {formContent.verifyButton}

            </button>
          )}
        </div>

        {isCreditCodeValid === null ? null : isCreditCodeValid ? (
          <p>{formContent.validCodeMessage}</p>
        ) : creditCodeRedeemed ? (
          <p>{formContent.redeemedCodeMessage}</p>
        ) : (
          <p>{formContent.invalidCodeMessage}</p>
        )}

        {(isCreditCodeValid || currentRegistrationFee === 0) ? (
          <p>Registration is free</p>
        ) : (
          <div style={{ width: '100%' }} className='card-element-container'>
            <CardElement options={CARD_ELEMENT_OPTIONS} />
            <p>
              {formContent.registrationFeeLabel}
              {convertedFee.currency === 'MXN'
                ? `${convertedFee.amount} MXN`
                : `$${currentRegistrationFee} USD`
              }
            </p>
          </div>
        )}

        <button onClick={handleRegistrationSubmit} disabled={isSubmitting} className='submitButton'>
          {isSubmitting ? formContent.submittingButton : formContent.submitButton}
        </button>
      </div>

      {statusMessage && (
        <div className="mt-4 mb-4 p-4 rounded bg-gray-100">
          <p className="text-sm font-medium text-gray-900">{statusMessage}</p>
        </div>
      )}

    </div>
  );
};

export default RegistrationComponent;
