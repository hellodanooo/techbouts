import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { doc, setDoc } from 'firebase/firestore';
import FighterForm from '@/components/ui/FighterForm';
import { format } from 'date-fns';
import { FullContactFighter } from '@/utils/types';
import { db } from '@/lib/firebase_techbouts/config';

interface CheckoutFormProps {
  eventId: string;
  eventName: string;
  closeModal: () => void;
  registrationFee: number;
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

const RegistrationComponent: React.FC<CheckoutFormProps> = ({ eventId, closeModal, registrationFee, eventName }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [fighterData, setFighterData] = useState<FullContactFighter | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;


  const initialFighterData: FullContactFighter = {
    first: '',
    last: '',
    email: '',
    dob: '',
    gym: '',
    age: 0,
    weightclass: 0,
    fighter_id: '',
    mt_win: 0,
    mt_loss: 0,
    mma_win: 0,
    mma_loss: 0,
    gender: 'MALE',
    years_exp: 0,
    other_exp: '',
    heightFoot: 0,
    heightInch: 0,
    phone: '',
    coach_phone: '',
    coach_name: '',
    gym_id: '',
    photo: '',
    coach: '',
    coach_email: '',
    state: '',
    city: '',
    age_gender: 'MEN',
    docId: '',
    boxing_win: 0,
    boxing_loss: 0,
    pmt_win: 0,
    pmt_loss: 0,
    pb_win: 0,
    pb_loss: 0,
    nc: 0,
    dq: 0,
    pmt_fights: [],
    gym_website: '',
    gym_address: ''
  };


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


  const handleRegistrationSubmit = async () => {
    if (isSubmitting) return; // Prevent the function from proceeding if already submitting
    setIsSubmitting(true); // Disable the submit button

    const formError = validateForm();
    if (formError) {
      alert(formError); // Show error to the user
      setIsSubmitting(false); // Re-enable the button
      return;
    }

    if (!fighterData) {
      console.log('Fighter data is missing.');
      setIsSubmitting(false); // Re-enable the button
      return;
    }

    const currentDate = format(new Date(), 'yyyy-MM-dd'); // Formats the current date as "YYYY-MM-DD"
    const formDataWithDate = { ...fighterData, date_registered: currentDate };

  

    if (registrationFee === 0) {
      try {
        // Store registration data in Firestore
        await setDoc(doc(db, 'purist_events', eventId, 'roster', fighterData.fighter_id), {
          ...formDataWithDate,
          registrationFee: 0,
        });
        
        // Send confirmation email
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
          heightFoot: fighterData.heightFoot,
          heightInch: fighterData.heightInch,
          phone: fighterData.phone,
          coach: fighterData.coach_name,
          coach_phone: fighterData.coach_phone
        });
  
        if (emailResponse.status === 200) {
          console.log('Confirmation email sent successfully.');
          alert('Registration successful! Confirmation email sent to ' + fighterData.email.toLowerCase());
        }
        
        setFighterData(initialFighterData);
        closeModal();
        return; // Exit the function here for free registrations
      } catch (error) {
        console.error('Error during free registration:', error);
        alert('An error occurred during registration. Please try again.');
        setIsSubmitting(false);
        return;
      }
    }

    
    if (!stripe || !elements) {
      console.log('Stripe.js has not loaded yet.');
      setIsSubmitting(false); // Re-enable the button
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      console.log('CardElement not found');
      setIsSubmitting(false); // Re-enable the button
      return;
    }

    const { error, token } = await stripe.createToken(cardElement);
    if (error) {
      console.log(`Stripe error: ${error.message}`);
      alert(`Error: ${error.message}`);
      setIsSubmitting(false);
      return;
    }
    if (!token) {
      console.log('Stripe token generation failed');
      setIsSubmitting(false);
      return;
    }

    const mtp_id = fighterData.fighter_id;
    const idempotencyKey = `reg-charge-${mtp_id}-${Date.now()}`;

    try {
      const response = await axios.post('/api/stripe', {
        token: token.id,
        eventId: eventId,
        amount: registrationFee,
        idempotencyKey,
        mtp_id: formDataWithDate.fighter_id,
      });

      if (response.data.success && response.data.paymentIntentId) {
        const formDataWithDateAndPayment = {
          ...formDataWithDate,
          paymentIntentId: response.data.paymentIntentId,
          registrationFee: registrationFee,
        };

        try {
          await setDoc(doc(db, 'purist_events', eventId, 'roster', fighterData.fighter_id), formDataWithDateAndPayment);
          console.log('Registration data stored in Firestore successfully.');
        } catch (error) {
          console.error('Error storing registration data in Firestore:', error);
          alert('An error occurred while saving your registration. Please contact support.');
          return; // Exit if Firestore submission fails
        }

      

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
            heightFoot: fighterData.heightFoot,
            heightInch: fighterData.heightInch,
            phone: fighterData.phone,
            coach: fighterData.coach_name,
            coach_phone: fighterData.coach_phone
          });

          if (emailResponse.status === 200) {
            console.log('Confirmation email sent successfully.');
            alert('Registration successful! Confirmation email sent to ' + fighterData.email.toLowerCase());
          }
        } catch (emailError) {
          console.error('Error during sending confirmation email:', emailError);
          console.log("error email", fighterData.email.toLowerCase());
          alert('Registration successful but there was an error sending confirmation email. Please email info@pointmuaythaica.com for details.');
        }
        setFighterData(initialFighterData);
        closeModal(); // Assuming this is to close the registration modal/dialog
      } else {
        console.log('Payment failed');
        alert('Payment failed. Please try again.');
      }
    } catch (error) {
      console.error('Error during payment or Firestore submission:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setIsSubmitting(false); // Re-enable the button after the process is complete
    }
  };




  
  return (
    <div className='registration'
      style={{padding: '10px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center'}}>
      
<div>{registrationFee} | {eventId}</div>

      <FighterForm onFormDataChange={setFighterData} />

      {registrationFee > 0 && (
        <div style={{width:'80%', padding:'10px'}} className='card-element-container'>
          <CardElement options={CARD_ELEMENT_OPTIONS} />
          <p>Registration Fee: ${registrationFee}</p>
        </div>
      )}

      <div style={{width:'100%', padding:'20px', border: '1px solid black', borderRadius: '5px', margin:'10px', }}>
        <button onClick={handleRegistrationSubmit} disabled={isSubmitting} className='submitButton'>
          {isSubmitting ? 'Submitting...' : 'Submit Registration'}
        </button>
      </div>
    </div>
  );
};

export default RegistrationComponent;
