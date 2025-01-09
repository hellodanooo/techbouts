import React, { useState } from 'react';
import { getFirestore, writeBatch, doc } from 'firebase/firestore';
import { ResultsFighter } from '../utils/types';
import buttons from '../styles/buttons.module.css';
import { ImCancelCircle } from "react-icons/im";
import { shiftBrackets } from '@/utils/moveBracket'; 
import { MdOutlineEmail } from "react-icons/md";
import { app } from '@/lib/firebase_techbouts/config';



interface EditBracketProps {
  bracketNum: { num: number; selectedFighters: ResultsFighter[] };
  fightcard: {fightcard: ResultsFighter[]}
  onClose: () => void;
  onUpdate: (bracketNum: number, updates: Partial<ResultsFighter>, fighters: ResultsFighter[]) => void;
  eventId: string;
}

const EditBracket: React.FC<EditBracketProps> = ({ bracketNum, fightcard, onClose, onUpdate, eventId }) => {
  const [selectedFighters, setSelectedFighters] = useState<ResultsFighter[]>(bracketNum.selectedFighters);

  const [newBracketNum, setNewBracketNum] = useState(bracketNum.num);
  const [newWeightclass, setNewWeightclass] = useState(bracketNum.selectedFighters[0]?.weightclass || 0);
  
  const [newClass, setNewClass] = useState<'A' | 'B' | 'C'>(bracketNum.selectedFighters[0]?.class || 'C');
  const [newAgeGender, setNewAgeGender] = useState<'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS'>(bracketNum.selectedFighters[0]?.age_gender || '');

  const [confirmed, setConfirmed] = useState<boolean>(bracketNum.selectedFighters[0]?.confirmed || false);
  
  const [emailDivOpen, setEmailDivOpen] = useState(false);
  const [emailMessage, setEmailMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [newDay, setNewDay] = useState<number>(bracketNum.selectedFighters[0]?.day || 1); // Add new state for day


  const toggleEmailDiv = () => {
    setEmailDivOpen(!emailDivOpen);
  };


  const handleSendEmails = () => {

    if (!subject) {
      alert('Please enter an email Subject');
      return;
    }

    if (!emailMessage) {
      alert('Please enter an email message');
      return;
    }
    setShowConfirmation(true);
  };




  const confirmSendEmails = async () => {
    setIsSending(true);

    try {
      const emailPromises = selectedFighters.map(fighter => {

        if (fighter.email) {
          return fetch('/api/sendFighterEmail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              subject: subject,
              email: fighter.email,
              message: emailMessage,
              fighterName: `${fighter.first} ${fighter.last}`,
            }),
          });
        }

        if (fighter.coach_email) {
          return fetch('/api/sendFighterEmail', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email: fighter.coach_email,
              message: emailMessage,
              fighterName: `${fighter.first} ${fighter.last}`,
            }),
          });
        }


        return Promise.resolve();
      });

      const results = await Promise.all(emailPromises);

      const allSuccessful = results.every(response => response && response.ok);

      if (allSuccessful) {
        alert('Emails sent successfully to all fighters with email addresses');
      } else {
        alert('Some emails failed to send. Please check and try again.');
      }
    } catch (error) {
      console.error('Error sending emails:', error);
      alert('An error occurred while sending emails');
    } finally {
      setIsSending(false);
      setShowConfirmation(false);
    }
  };

  const cancelSendEmails = () => {
    setShowConfirmation(false);
  };




  const insertBracketEmail = () => {
    const bout1Fighters = selectedFighters.filter(f => f.bout === 1);
    const bout2Fighters = selectedFighters.filter(f => f.bout === 2);

    let insertText = `
      <div style="text-align: center; font-family: Arial, sans-serif;">
        <div style="color: #007bff;">Bracket ${newBracketNum} : ${bout1Fighters[0].age_gender} ${bout1Fighters[0].weightclass} Class: ${bout1Fighters[0].class}</div>
       <table style="margin: 10px auto; border-collapse: collapse;">
    `;

    if (bout1Fighters.length === 2) {
      insertText += `
       <tr>
          <d>Bout 1</d>
          <tr>
            <td>${bout1Fighters[0].first} ${bout1Fighters[0].last}</td><td>VS</td><td>${bout1Fighters[1].first} ${bout1Fighters[1].last}</td>
         </tr>        
        </div>
      `;
    }

    if (bout2Fighters.length === 2) {
      insertText += `
        <div style="margin: 5px 0;">
          <h3>Bout 2</h3>
          <p>${bout2Fighters[0].first} ${bout2Fighters[0].last} vs ${bout2Fighters[1].first} ${bout2Fighters[1].last}</p>
        </div>
      `;
    }

    if (bout1Fighters.length === 2 && bout2Fighters.length === 2) {
      insertText += `
        <div style="margin: 5px 0;">
          <h3>Bout 3</h3>
          <p>Winner of Bout 1 vs Winner of Bout 2</p>
        </div>
      `;
    }

    insertText += '</div>';

    setEmailMessage(prevMessage => prevMessage + insertText);
  };

  const insertIKFWebsiteButton = () => {
    const buttonHtml = `
      <div style="text-align: center; margin: 5px 0;">
        <a href="https://www.ikffightplatform.com/login" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-family: Arial, sans-serif;">IKF Website</a>
      </div>
    `;
    setEmailMessage(prevMessage => prevMessage + buttonHtml);
  };

  const insertFightcardButton = () => {
    const buttonHtml = `
      <div style="text-align: center; margin: 5px 0;">
        <a href="https://www.muaythaipurist.app/fightcard/${eventId}" target="_blank" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: #ffffff; text-decoration: none; border-radius: 5px; font-family: Arial, sans-serif;">FightCard</a>
      </div>
    `;
    setEmailMessage(prevMessage => prevMessage + buttonHtml);
  };


  const insertConfirmMessage = () => {
    const message = `
      <div style="text-align: center; margin: 5px 0;">Verify your record on the FightCard and update any changes on the IKF Platform. To accept the bracket, reply to this email with a photo of yourself in fighting stance (above the waist) and confirm your amateur record is accurate.
Adult Male fight Saturday with championship finals on Sunday. Females and youth compete Sunday.
      </div>
    `;
    setEmailMessage(prevMessage => prevMessage + message);
  };



  const handleFighterUpdate = (index: number, field: 'fighterNum' | 'bout' | 'bracket' | 'confirmed', value: number | boolean) => {

    const updatedFighters = [...selectedFighters];
    updatedFighters[index] = { ...updatedFighters[index], [field]: value };
    setSelectedFighters(updatedFighters);
  };



  const handleUpdate = async () => {
    const db = getFirestore(app);
    const batch = writeBatch(db);



    try {
      if (newBracketNum !== bracketNum.num) {
        console.log('Shifting brackets');
        console.log('New Bracket Number', newBracketNum);
        console.log('Old Bracket Number', bracketNum.num);

        console.log('Fighters Being moved', selectedFighters);
        console.log('Is New Bracket Smaller than Old Brackey', newBracketNum < bracketNum.num);
       
       
       
        await shiftBrackets(fightcard.fightcard, bracketNum.num, newBracketNum, eventId);
      }

  
      selectedFighters.forEach(fighter => {
        const fighterRef = doc(db, 'purist_events', eventId, 'fightcard', fighter.id);
        const updates = {
          weightclass: newWeightclass,
          class: newClass,
          fighterNum: fighter.fighternum,
          bout: fighter.bout,
          age_gender: newAgeGender,
          confirmed: confirmed,
          day: newDay,
        
        };
        batch.update(fighterRef, updates);
      });
  
      // Commit the batch
      await batch.commit();
  
      onUpdate(newBracketNum, {
        weightclass: newWeightclass,
        class: newClass,
        age_gender: newAgeGender,
        confirmed: confirmed,
        day: newDay,
      }, selectedFighters);
      onClose();
    } catch (error) {
      console.error("Error updating bracket:", error);
    }
  };

 





  return (
    <div style={{
      position: 'fixed',
      top: '40%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      backgroundColor: 'white',
      padding: '20px',
      borderRadius: '10px',
      boxShadow: '0 0 10px rgba(0,0,0,0.1)',
      zIndex: 1000,
      maxHeight: '80vh',
      overflowY: 'auto',
      width: '90%',
    }}>

      <h3>Edit Bracket {bracketNum.num}</h3>

      <div>
        <label>
          Bracket Number:
          <input
            type="number"
            value={newBracketNum}
            onChange={(e) => setNewBracketNum(parseInt(e.target.value))}
          />
        </label>
      </div>


      <div>
        <label>
          Day:
          <input
            type="number"
            value={newDay}
            onChange={(e) => setNewDay(parseInt(e.target.value))}
            min={1}
          />
        </label>
      </div>

      <div>
        <label>
          Weightclass:
          <input
            type="number"
            value={newWeightclass}
            onChange={(e) => setNewWeightclass(parseInt(e.target.value))}
          />
        </label>
      </div>
      <div>
        <label>
          Class:
          <select
            value={newClass}
            onChange={(e) => setNewClass(e.target.value as 'A' | 'B' | 'C')}
          >
            <option value="A">A</option>
            <option value="B">B</option>
            <option value="C">C</option>
          </select>
        </label>
      </div>

      <div>
        <label>
          Age Gender:
          <select
            value={newAgeGender}
            onChange={(e) => setNewAgeGender(e.target.value as 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS')}
          >
            <option value="MEN">Men</option>
            <option value="WOMEN">Women</option>
            <option value="BOYS">Boys</option>
            <option value="GIRLS">Girls</option>
          </select>
        </label>
      </div>


      <div>
        <label>
          Bracket Confirmed:
          <select
            value={confirmed.toString()}
            onChange={(e) => setConfirmed(e.target.value === 'true')}
          >
            <option value="true">YES</option>
            <option value="false">NO</option>
          </select>
        </label>
      </div>




      <h4>Fighters</h4>
      {selectedFighters.map((fighter, index) => (
        <div key={fighter.id} style={{ marginBottom: '10px', border: '1px solid black', borderRadius: '5px' }}>
          <span>{fighter.first} {fighter.last} | {fighter.weightclass}</span>
          <div style={{ display: 'flex' }}>
            <div style={{ width: '50%' }} >
              <label style={{ display: 'flex', flexDirection: 'column' }} >
                Fighter Number
                <select
                  value={fighter.fighternum || ''}
                  onChange={(e) => handleFighterUpdate(index, 'fighterNum', parseInt(e.target.value))}
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>
                </select>
              </label>
            </div>



       



            <div style={{ width: '50%', display: 'flex', flexDirection: 'column' }} >
              <label style={{ display: 'flex', flexDirection: 'column' }} >
                Bout
                <select
                  value={fighter.bout || ''}
                  onChange={(e) => handleFighterUpdate(index, 'bout', parseInt(e.target.value))}
                >
                  <option value="">Select</option>
                  <option value="1">1</option>
                  <option value="2">2</option>

                </select>
              </label>
            </div>

          </div>
        </div>
      ))}

      <div style={{
        display: 'flex',
        width: '100%',
        justifyContent: 'space-between',
        marginTop: '20px',
      }}>
        <button className={`${buttons.upDate} ${buttons.keyboard}`} onClick={handleUpdate}>Update</button>
        <button className={`${buttons.cancel} ${buttons.keyboard}`} onClick={onClose}><ImCancelCircle size={50} /></button>
        <button onClick={toggleEmailDiv}><MdOutlineEmail size={60} /></button>
      </div>

      {emailDivOpen && (
        <div style={{ marginTop: '20px', borderTop: '1px solid #ccc', paddingTop: '10px' }}>



          <h3>Bracket Emails</h3>
          {selectedFighters.map((fighter, index) => (
            <div key={index} style={{ marginBottom: '10px' }}>
              <h4>{fighter.first} {fighter.last} : {fighter.coach_name}</h4>
              <p>Fighter Email: {fighter.email || 'N/A'}</p>
              <p>Coach Email: {fighter.coach_email || 'N/A'}</p>
              <p>Coach Phone: {fighter.coach_phone || 'N/A'}</p>
            </div>
          ))}


<div className={buttons.keyboard}
            style={{
              border: '1px solid black',
              padding: '10px 20px',
              marginBottom: '10px',
              cursor: 'pointer'
            }}
            onClick={insertBracketEmail}
          >
            Insert Bracket Names
          </div>


          <div className={buttons.keyboard}
            style={{
              border: '1px solid black',
              padding: '10px 20px',
              marginBottom: '10px',
              cursor: 'pointer'
            }}
            onClick={insertIKFWebsiteButton}
          >
            Insert IKF Website Button
          </div>


<div className={buttons.keyboard}
style={{
  border: '1px solid black',
  padding: '10px 20px',
  marginBottom: '10px',
  cursor: 'pointer'
}}
onClick={insertFightcardButton}
>
Insert Fightcard Button
</div>


<div className={buttons.keyboard}
style={{
  border: '1px solid black',
  padding: '10px 20px',
  marginBottom: '10px',
  cursor: 'pointer'
}}
onClick={insertConfirmMessage}
>
Insert Confirm Message
</div>





          <textarea
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Enter your email subject"
            style={{ width: '100%', marginBottom: '10px', border: '1px solid black' }}
          />

          <textarea
            value={emailMessage}
            onChange={(e) => setEmailMessage(e.target.value)}
            placeholder="Enter your message here..."
            style={{ width: '100%', height: '100px', marginBottom: '10px', border: '1px solid black' }}
          />



          <button
            onClick={handleSendEmails}
            disabled={isSending}
            className={`${buttons.keyboard}`}
            style={{
              marginBottom: '20px',
              padding: '5px 10px'

            }}
          >
            {isSending ? 'Sending...' : 'Send Email to All Fighters'}
          </button>

        </div>
     
     
     )}

      {showConfirmation && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1001,
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '20px',
            borderRadius: '10px',
            maxWidth: '80%',
            maxHeight: '80%',
            overflowY: 'auto',
          }}>
            <h3>Confirm Email Send</h3>
            <p>Are you sure you want to send the following email to these fighters?</p>
            <div style={{ marginBottom: '20px' }}>
              <strong>Message:</strong>
              <pre style={{ whiteSpace: 'pre-wrap', wordWrap: 'break-word' }}>{emailMessage}</pre>
            </div>
            <h4>Recipients:</h4>
            <ul>
              {selectedFighters.filter(fighter => fighter.email).map((fighter, index) => (
                <li key={index}>{fighter.first} {fighter.last}: {fighter.email}</li>
              ))}
            </ul>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '20px' }}>
              <button onClick={confirmSendEmails} className={buttons.keyboard}>Confirm Send</button>
              <button onClick={cancelSendEmails} className={buttons.keyboard}>Cancel</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default EditBracket;