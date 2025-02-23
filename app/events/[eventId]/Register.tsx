
'use client';
import React, { useState, useEffect } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { db } from '@/lib/firebase_techbouts/config';
import { Firestore, WriteBatch, doc, getDoc, setDoc, collection, getDocs, writeBatch } from 'firebase/firestore';
import FighterForm from './FighterForm';
import { format } from 'date-fns';



interface RegisterProps {
  eventId: string;
  locale: string;
  eventName: string;
  closeModal: () => void;
  registrationFee: number;
  user?: string;
}

interface FighterFormData {
  first: string;
  last: string;
  email: string;
  dob: string;
  gym: string;
  age: number;
  weightclass: number;
  fighterId: string;
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
}

interface FighterFirestoreData extends FighterFormData {
  paymentIntentId?: string;
  paymentAmount?: number;
  paymentCurrency?: string;
  date_registered: string;
  status: 'registered';
  registrationComplete: boolean;
}

interface FighterRosterData {
  first: string;
  last: string;
  gym: string;
  weightclass: number;
  gender: string;
  date_registered: string;
  status: 'registered';
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

const RegistrationComponent: React.FC<RegisterProps> = ({ eventId, closeModal, registrationFee: baseRegistrationFee, eventName, locale, user }) => {


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

    const fetchRosterCount = async () => {
      try {
        const rosterRef = collection(db, 'events', eventId, 'roster_json');
        const querySnapshot = await getDocs(rosterRef);
        setRosterCount(querySnapshot.size);
      } catch (error) {
        console.error('Error fetching roster count:', error);
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
      const emailResponse = await axios.post('/api/sendConfirmationEmail', {
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
      // Create a reference to the event's roster collection
      const rosterRef = doc(db, 'events', eventId, 'roster', fighterData.fighterId);
      const rosterJsonRef = doc(db, 'events', eventId, 'roster_json', fighterData.fighterId);
  
      // Basic fighter data for roster collection
      const rosterData: FighterRosterData = {
        first: fighterData.first,
        last: fighterData.last,
        gym: fighterData.gym,
        weightclass: fighterData.weightclass,
        gender: fighterData.gender,
        date_registered: currentDate,
        status: 'registered'
      };
  
      // Complete fighter data for roster_json collection
      const rosterJsonData: FighterFirestoreData = {
        ...fighterData,
        date_registered: currentDate,
        status: 'registered',
        registrationComplete: true
      };
  
      // Save data to both collections using a batch write
      const batch: WriteBatch = writeBatch(db);
      batch.set(rosterRef, rosterData);
      batch.set(rosterJsonRef, rosterJsonData);
      
      // Commit the batch
      await batch.commit();
      
      return true;
    } catch (error) {
      console.error('Error saving fighter data to Firestore:', error);
      throw new Error('Failed to save fighter data');
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

      if (isCreditCodeValid) {

        setStatusMessage('Credit Code Valid Submitting registration data...');

        await saveFighterToFirestore(db, eventId, fighterData, currentDate);
        setStatusMessage('Submitted Successfuly.');

        // Update credit code as redeemed
        if (creditCode) {
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
          idempotencyKey: `reg-charge-${fighterData.fighterId}-${Date.now()}`,
          pmt_id: fighterData.fighterId,
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
          
          setStatusMessage('Submitted Successfuly.');
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

      {isCreditCodeValid === true ? null : (
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
