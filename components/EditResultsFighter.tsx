import React, { useState } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase_pmt/config';
import { RosterFighter } from '../utils/types';

interface EditResultsFighterModalProps {
  fighter: RosterFighter;
  eventId: string;
  onClose: () => void;
  onUpdate: () => void;
}

const EditResultsFighterModal: React.FC<EditResultsFighterModalProps> = ({
  fighter,
  eventId,
  onClose,
  onUpdate
}) => {
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData] = useState<Partial<RosterFighter>>({});



  const handleSubmit = async () => {
    try {
      setIsUpdating(true);

      // Get the current resultsJson document
      const resultsJsonRef = doc(db, 'events', eventId, 'resultsJson', 'fighters');
      const resultsJsonDoc = await getDoc(resultsJsonRef);

      if (!resultsJsonDoc.exists()) {
        throw new Error('Results JSON document not found');
      }

      const defaultEmail = `${(formData.first || fighter.first).toLowerCase()}${(formData.last || fighter.last).toLowerCase()}@example.com`;
      const defaultPhone = '1234567890';

      // Update the specific fighter in the fighters array
      const resultsData = resultsJsonDoc.data();
      const updatedFighters = resultsData.fighters.map((f: RosterFighter) => {
        if (f.fighter_id === fighter.fighter_id) {
          const updatedEmail = formData.email?.trim() || f.email || defaultEmail;
          const updatedPhone = formData.phone?.trim() || f.phone || defaultPhone;
          return {
            ...f,
            ...formData,
            // Ensure these fields are properly formatted
            first: formData.first?.toUpperCase() || f.first,
            last: formData.last?.toUpperCase() || f.last,
            gym: formData.gym?.toUpperCase() || f.gym,
            weightclass: Number(formData.weightclass) || f.weightclass,
            age: Number(formData.age) || f.age,
            // Preserve critical bout information
     
            result: f.result,
     
   
            email: updatedEmail,
            phone: updatedPhone,
          };
        }
        return f;
      });

      // Update the resultsJson document
      await setDoc(resultsJsonRef, {
        ...resultsData,
        fighters: updatedFighters,
        metadata: {
          ...resultsData.metadata,
          lastUpdated: new Date().toISOString()
        }
      });

      onUpdate(); // Trigger parent component refresh
      alert('Fighter updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating fighter:', error);
      if (error instanceof Error) {
        alert(`Error updating fighter: ${error.message}`);
      } else {
        alert('Error updating fighter');
      }
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="modalOverlay">
      <div className="modalContentResults">
        <div style={{ position: 'relative', padding: '20px' }}>
          <span 
            className="closeButton" 
            onClick={onClose}
            style={{
              position: 'absolute',
              right: '10px',
              top: '10px',
              cursor: 'pointer',
              fontSize: '24px'
            }}
          >
            &times;
          </span>
          
          <h2 style={{ marginBottom: '20px', textAlign: 'center' }}>
            Edit Fighter: {fighter.first} {fighter.last}
          </h2>

          <div style={{ marginBottom: '10px', textAlign: 'center' }}>
            <strong>Result:</strong> {fighter.result}
          </div>

       

          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: '20px',
            padding: '10px'
          }}>
            <button
              onClick={onClose}
              style={{
                padding: '10px 20px',
                backgroundColor: '#ccc',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
              disabled={isUpdating}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              style={{
                padding: '10px 20px',
                backgroundColor: '#4CAF50',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
              disabled={isUpdating}
            >
              Save Changes
            </button>
          </div>

          {isUpdating && (
            <div style={{ 
              position: 'absolute', 
              top: 0, 
              left: 0, 
              right: 0, 
              bottom: 0, 
              backgroundColor: 'rgba(255,255,255,0.8)', 
              display: 'flex', 
              justifyContent: 'center', 
              alignItems: 'center' 
            }}>
              Updating fighter...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditResultsFighterModal;