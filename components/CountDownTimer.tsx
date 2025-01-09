import React, { useState, useEffect, useCallback } from 'react';
import buttons from '../styles/buttons.module.css';

interface CountdownTimerProps {
  eventDate: string; // YYYY-MM-DD format
  openRegistrationModal: () => void;
}

const CountdownTimer: React.FC<CountdownTimerProps> = ({ eventDate, openRegistrationModal }) => {
  const [mounted, setMounted] = useState(false);
  const [timeLeft, setTimeLeft] = useState<{ [key: string]: number }>({});
  const [message, setMessage] = useState<string>('');
  const [showRegisterButton, setShowRegisterButton] = useState(false);
  const calculateTimeLeft = useCallback(() => {
    const eventTime = new Date(`${eventDate}T00:00:00`).getTime();
    const fiveDaysInMilliseconds = 5 * 24 * 60 * 60 * 1000;
    const adjustedEventTime = eventTime - fiveDaysInMilliseconds;
    const difference = adjustedEventTime - new Date().getTime();
    
    let timeLeft: { [key: string]: number } = {};
    if (difference > 0) {
      timeLeft = {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      };
    }
    return timeLeft;
  }, [eventDate]);

  const updateMessage = useCallback(() => {
    const now = new Date();
    const event = new Date(`${eventDate}T00:00:00`);
    const fiveDaysBefore = new Date(event.getTime() - 5 * 24 * 60 * 60 * 1000);
    const threeDaysBefore = new Date(event.getTime() - 3 * 24 * 60 * 60 * 1000);

    if (now >= event) {
      setMessage("Tournament Concluded");
      setShowRegisterButton(false);
    } else if (now.toDateString() === event.toDateString()) {
      setMessage("Fights Underway");
      setShowRegisterButton(false);
    } else if (now >= threeDaysBefore) {
      setMessage("Pre Matching");
      setShowRegisterButton(false);
    } else if (now >= fiveDaysBefore) {
      setMessage("Registration Closes");
      setShowRegisterButton(true);
    } else {
      setMessage("Final Registration");
      setShowRegisterButton(true);
    }
  }, [eventDate]);

  useEffect(() => {
    setMounted(true);
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
      updateMessage();
    }, 1000);
    return () => clearInterval(timer);
  }, [calculateTimeLeft, updateMessage]);

  if (!mounted) {
    return null; // or a loading indicator
  }

  const timerComponents = Object.keys(timeLeft).map((interval) => {
    if (!timeLeft[interval]) {
      return null;
    }
    return (
      <div
        style={{
          border: '1px solid black',
          margin: '10px',
          borderRadius: '5px',
        }}
        key={interval}
      >
        <div
          style={{
            backgroundColor: 'black',
            color: 'white',
            padding: '5px',
          }}
        >
          {interval}
        </div>
        <div
          id={interval}
          className='custom-font-catz'
          style={{
            padding: '10px',
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: 'black',
          }}
        >
          {timeLeft[interval]}
        </div>
      </div>
    );
  });

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '10px',
        margin: '10px',
        borderRadius: '5px',
        border: '1px solid black',
      }}
      className="countdownContainer"
    >
      <div className='custom-font-catz'>{message}</div>
      <div id="countdown">
        <div style={{ display: 'flex' }}>
          {Object.keys(timeLeft).length ? timerComponents : <div></div>}
        </div>
      </div>
 
      
    {showRegisterButton && (
        <div
          onClick={openRegistrationModal}
          style={{
            cursor: 'pointer',
            padding: '10px 20px',
            border: '1px solid red',
            color: 'white',
            fontSize: '1.5rem',
            borderRadius: '5px',
            letterSpacing: '5px',
            backgroundColor: 'red',
            marginTop: '10px',
            zIndex: 1000,
          }}
          className={`custom-font-marker ${buttons.keyboard}`}
        >
          REGISTER
        </div>
      )}
    </div>
  );
};

export default CountdownTimer;