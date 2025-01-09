import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import modals from '../styles/modals.module.css';
import { ImCancelCircle } from "react-icons/im";
import buttons from '../styles/buttons.module.css';
import animations from '../styles/animations.module.css';
import { db } from '@/lib/firebase_techbouts/config';

interface CoachProps {
  eventId: string;
  coachPrice: number;
  eventName: string;
  gymNames: string[];
  onClose: () => void;
}

const CARD_OPTIONS = {
  style: {
    base: {
      color: "black",
      fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
      fontSize: "16px",
      fontSmoothing: "antialiased",
      '::placeholder': {
        color: 'black'
      },
      iconColor: '#6c757d',
    },
    invalid: {
      color: "#dc3545",
      iconColor: "#dc3545",
      backgroundColor: '#faebeb',
    }
  },
  hidePostalCode: true
};

const CardInputWrapper = () => {
  return (
    <div style={{
      border: '1px solid #ced4da',
      borderRadius: '4px',
      padding: '10px 12px'
    }}>
      <CardElement options={CARD_OPTIONS} />
    </div>
  );
};

const TicketComponent: React.FC<CoachProps> = ({ eventId, coachPrice, eventName, gymNames =[], onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [selectedGym, setSelectedGym] = useState<string>('none');


  const handleTicketPurchase = async () => {
    setIsSubmitting(true);

    if (!stripe || !elements) {
      alert('Stripe.js has not loaded yet.');
      setIsSubmitting(false);
      return;
    }

    const cardElement = elements.getElement(CardElement);
    if (!cardElement) {
      alert('Please enter your card information.');
      setIsSubmitting(false);
      return;
    }

    const { error, token } = await stripe.createToken(cardElement);
    if (error) {
      alert(`Payment error: ${error.message}`);
      setIsSubmitting(false);
      return;
    }

    const idempotencyKey = `coach-${eventId}-${Date.now()}`;
    try {
      const totalAmount = coachPrice;
      const response = await axios.post('/api/stripeCoach', {
        token: token.id,
        eventId,
        totalAmount,
        idempotencyKey,
        selectedGym,
        eventName,
        customer: { firstName, lastName, email },
      });
      if (response.data.success) {
        alert('Coach Registered successful!');
      
          await setDoc(doc(db, 'purist_events', eventId, 'coaches', `${token.id}`), {
            firstName,
            lastName,
            email,
            coachPrice,
            gym: selectedGym,
            eventName,
            purchaseTime: Timestamp.now()
          });
       

        console.log("Sending data:", { email, firstName, lastName, eventName, eventId });

        await axios.post('/api/sendCoachConfirmation', {
          email,
          firstName,
          lastName,
          eventName,
          eventId,
            gym: selectedGym,
        });

        onClose();
      } else {
        alert('Coach Registration purchase failed. Please try again.');
      }
    } catch (error) {
      alert('An error occurred during the coach purchase. Please try again.');
      console.error('Coach Registration error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div className={modals.contentLevel2}>
      <div className={modals.contentLevel2}>
        <h1>Coach Registration</h1>

        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ margin: '6%' }}
          />



          <div style={{ border: '1px solid black', padding: '5px', margin: '10px', borderRadius: '5px' }}>
           
           
            <div>Gym Affiliation</div>
           
            <div className={buttons.selectWrapper}>
  <select
    id="gymAffiliation"
    className={buttons.customSelect}
    value={selectedGym}
    onChange={(e) => setSelectedGym(e.target.value)}
  >
    {gymNames.map((gym, index) => (
      <option key={index} value={gym}>{gym}</option>
    ))}
  </select>
</div>

</div>





          <p
            style={{ marginBottom: '6%' }}
            className='total-price'
          >Total Price: ${(coachPrice).toFixed(2)}</p>

        </div>

        <CardInputWrapper />

        <div style={{ 
          display: 'flex',
           width: '100%', justifyContent: 'center', alignItems: 'center', marginTop:'10px' }}>

          <div
          style={{
            border:'2px solid green',
            color:'green',

          }}
          className={buttons.flatRight}>Coach Registration: ${(coachPrice).toFixed(2)}</div>

          <button
          style={{
            color:'white',
          backgroundColor:'green',
          border:'2px solid green',
          }}
          className={`${buttons.flatLeft} ${animations.pulseButton}`}
                    
          onClick={handleTicketPurchase} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Submit'}
          </button>


        </div>

        <br></br>

        <div style={{ position: 'absolute', top: '6%', right: '10%' }} onClick={onClose} >
          <ImCancelCircle size={32} color="#fc5e03" />
        </div>

      </div>

    </div>
  );
};

export default TicketComponent;
