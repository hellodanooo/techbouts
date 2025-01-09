import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import modals from '../../styles/modals.module.css';
import { ImCancelCircle } from "react-icons/im";
import buttons from '../../styles/buttons.module.css';
import animations from '../../styles/animations.module.css';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';


interface PhotoProps {
  eventId: string;
  photoPrice: number;
  eventName: string;
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

const PhotoComponent: React.FC<PhotoProps> = ({ eventId, photoPrice, eventName, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');


 

 


  const handlePhotoPurchase = async () => {
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

    const idempotencyKey = `photo-${eventId}-${Date.now()}`;
    try {
      const totalAmount =  photoPrice;

      const response = await axios.post('/api/stripePhoto', {
        token: token.id,
        eventId,
        totalAmount,
        idempotencyKey,
        eventName,
        customer: { firstName, lastName, email },

      });
      if (response.data.success) {
        alert('Photo purchase successful!');
          await setDoc(doc(db, 'purist_events', eventId, 'photos', `${token.id}`), {
            firstName,
            lastName,
            email,
            photoPrice: photoPrice,
            eventName,
            purchaseTime: Timestamp.now()
          });
        

        console.log("Sending data:", { email, firstName, lastName, eventName, eventId });

        await axios.post('/api/sendPhotoConfirmation', {
          email,
          firstName,
          lastName,
          eventName,
          eventId,
          totalAmount
        });

        onClose();
      } else {
        alert('Photo purchase failed. Please try again.');
      }
    } catch (error) {
      alert('An error occurred during the Photo purchase. Please try again.');
      console.error('Photo purchase error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (

    <div className={modals.overlayLevel2}>
     
     
      <div className={modals.contentLevel2}>
        
        <div style={{marginTop:'5%'}}>
        
        <div
        style={{
          fontSize: '24px',
          marginBottom: '10px',
          padding: '5px',
          borderBottom: '1px solid black',
          backgroundColor: 'black',
          color: 'white',
        }}
        >Photo Package</div>




        <input
          type="text"
          placeholder="First Name"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          style={{ margin: '2%', borderRadius: '5px', border: '1px solid black' }}
        />
        <input
          type="text"
          placeholder="Last Name"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          style={{ margin: '2%', borderRadius: '5px', border: '1px solid black' }}

        />

        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ margin: '2%', borderRadius: '5px', border: '1px solid black' }}
            />



          <div style={{ border: '1px solid black', padding: '5px', margin: '10px', borderRadius: '5px' }}>



          </div>





          <div style={{ border: '1px solid black', margin: '10px', borderRadius: '5px' }}>

       

        

          </div>

          <p className='total-price'>
      Total Price: ${(photoPrice || 0).toFixed(2)}
    </p>


        </div>

        <CardInputWrapper />

        <div style={{
          display: 'flex',
          width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: '10px'
        }}>

          

          <button
            style={{
              color: 'white',
              backgroundColor: 'green',
              border: '2px solid green',
            }}
            className={`${buttons.flatLeft} ${animations.pulseButton}`}

            onClick={handlePhotoPurchase} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Buy Photos'}
          </button>


        </div>

        <br></br>

        <div style={{ position: 'absolute', top: '2%', right: '5%' }} onClick={onClose} >
          <ImCancelCircle size={32} color="#fc5e03" />
        </div>

        </div>

      </div>

    </div>
  );
};

export default PhotoComponent;
