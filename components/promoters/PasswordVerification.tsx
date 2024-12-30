// components/PasswordVerification.tsx
import React, { useState } from 'react';
import { PromoterType } from '../../utils/types';

interface PasswordVerificationProps {
  promoterId: PromoterType;
  onSuccess: () => void;
  onCancel: () => void;
}

const PasswordVerification: React.FC<PasswordVerificationProps> = ({
  promoterId,
  onSuccess,
  onCancel
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/promoterEvents/promoterAuth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          promoterId,
          password
        }),
      });

      const data = await response.json();

      if (response.ok && data.verified) {
        onSuccess();
      } else {
        setError('Incorrect password');
      }
    } catch (error) {
      setError('Error verifying password');
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modalOverlay2">
         <div className="modalContent2">

      <h3 className="text-lg font-semibold mb-4">Enter Password to Edit Event</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Enter password"
            required
          />
        </div>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        <div className="flex space-x-2">
          <button
            type="submit"
            disabled={isLoading}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            {isLoading ? 'Verifying...' : 'Submit'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
          >
            Cancel
          </button>
        </div>
      </form>
</div>
    </div>
  );
};

export default PasswordVerification;