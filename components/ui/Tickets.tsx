import React, { useState } from 'react';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import axios from 'axios';
import modals from '../../styles/modals.module.css';
import { ImCancelCircle } from "react-icons/im";
import buttons from '../../styles/buttons.module.css';
import animations from '../../styles/animations.module.css';
import { setDoc, doc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';


interface TicketProps {
  eventId: string;
  ticketPrice: number;
  ticketPrice1Description?: string;
  ticketPrice2?: number;
  ticketPrice2Description?: string;
  eventName: string;
  spectatorInfo?: string;
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

const TicketComponent: React.FC<TicketProps> = ({ eventId, ticketPrice, ticketPrice1Description, ticketPrice2, ticketPrice2Description, eventName, gymNames = [], spectatorInfo, onClose }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [firstName, setFirstName] = useState<string>('');
  const [lastName, setLastName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [numTickets, setNumTickets] = useState<number>(1);
  const [selectedGym, setSelectedGym] = useState<string>('none');
  const [selectedTicketType, setSelectedTicketType] = useState<'price1' | 'price2'>('price1');


  const getSelectedTicketDescription = () => {
    return selectedTicketType === 'price1' ? ticketPrice1Description : ticketPrice2Description;
  };

  const getSelectedPrice = () => {
    return selectedTicketType === 'price1' ? ticketPrice : (ticketPrice2 || ticketPrice);
  };



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

    const idempotencyKey = `ticket-${eventId}-${Date.now()}`;
    try {
 const selectedPrice = getSelectedPrice();
      const totalAmount = selectedPrice * numTickets;
      const selectedTicketDescription = getSelectedTicketDescription();

      const response = await axios.post('/api/stripeTickets', {
        token: token.id,
        eventId,
        totalAmount,
        idempotencyKey,
        selectedGym,
        eventName,
        customer: { firstName, lastName, email },
        numTickets,
        ticketType: selectedTicketDescription

      });
      if (response.data.success) {
        alert('Ticket purchase successful!');
        for (let i = 0; i < numTickets; i++) {
          await setDoc(doc(db, 'purist_events', eventId, 'tickets', `${token.id}-${i}`), {
            firstName,
            lastName,
            email,
            ticketPrice: selectedPrice,
            ticketType: selectedTicketDescription,
                        gym: selectedGym,
            eventName,
            purchaseTime: Timestamp.now()
          });
        }

        console.log("Sending data:", { email, firstName, lastName, eventName, eventId });

        await axios.post('/api/sendTicketConfirmation', {
          email,
          firstName,
          lastName,
          eventName,
          eventId,
          ticketType: selectedTicketDescription,
          numTickets,
          totalAmount
        });

        onClose();
      } else {
        alert('Ticket purchase failed. Please try again.');
      }
    } catch (error) {
      alert('An error occurred during the ticket purchase. Please try again.');
      console.error('Ticket purchase error:', error);
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
        >Spectator Tickets</div>

{spectatorInfo ? (
            <p
            style={{
              padding: '5px',
              border: '1px solid black',
              borderRadius: '5px',
              textAlign: 'center',
              marginBottom: '10px',
            }}
            >{spectatorInfo}</p>
          ) : (
            <p></p>
          )}

<p>one person can buy multiple tickets for people.</p>
<p
style={{
  padding: '5px',
  border: '1px solid black',
  borderRadius: '5px',
  textAlign: 'center',
  margin: '10px',
  backgroundColor: 'black',
  color: 'white',
  }}
>Spectator info</p>
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


            <div>Gym Affiliation (optional)</div>

            <div className={buttons.selectWrapper}>
              <select
                id="gymAffiliation"
                className={buttons.customSelect}
                value={selectedGym}
                onChange={(e) => setSelectedGym(e.target.value)}
              >
                <option value="none">None</option>
                {gymNames.map((gym, index) => (
                  <option key={index} value={gym}>{gym}</option>
                ))}
                <option value="Other">Other</option>
              </select>
            </div>

          </div>

  <div style={{ border: '1px solid black', padding: '5px', margin: '10px', borderRadius: '5px' }}>
        <div>Ticket Type</div>
        <div className={buttons.selectWrapper}>
          <select
            id="ticketType"
            className={buttons.customSelect}
            value={selectedTicketType}
            onChange={(e) => setSelectedTicketType(e.target.value as 'price1' | 'price2')}
          >
            <option value="price1">{`$${ticketPrice} - ${ticketPrice1Description}`}</option>
            {ticketPrice2 && ticketPrice2Description && (
              <option value="price2">{`$${ticketPrice2} - ${ticketPrice2Description}`}</option>
            )}
          </select>
        </div>
      </div>



          <div style={{ border: '1px solid black', margin: '10px', borderRadius: '5px' }}>

            <div
              style={{
                backgroundColor: 'black',
                padding: '5px',
                marginBottom: '10px',
                color: 'white',
              }}
            >Number of Tickets</div>

            <div className={buttons.selectWrapperNumber}>
              <select
                id="numTickets"
                value={numTickets}
                onChange={(e) => setNumTickets(parseInt(e.target.value, 10))}
                className={buttons.customSelectNumber}
                style={{ width: '50%' }}
              >
                {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                  <option key={num} value={num}>{num}</option>
                ))}
              </select>
            </div>

          </div>

          <p className='total-price'>
        Total Price: ${(getSelectedPrice() * numTickets).toFixed(2)}
      </p>


        </div>

        <CardInputWrapper />

        <div style={{
          display: 'flex',
          width: '100%', justifyContent: 'center', alignItems: 'center', marginTop: '10px'
        }}>

          <div
            style={{
              border: '2px solid green',
              color: 'green',

            }}
            className={buttons.flatRight}>
          {numTickets} Tickets @ ${(getSelectedPrice() * numTickets).toFixed(2)}
          </div>

          <button
            style={{
              color: 'white',
              backgroundColor: 'green',
              border: '2px solid green',
            }}
            className={`${buttons.flatLeft} ${animations.pulseButton}`}

            onClick={handleTicketPurchase} disabled={isSubmitting}>
            {isSubmitting ? 'Processing...' : 'Buy Tickets'}
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

export default TicketComponent;
