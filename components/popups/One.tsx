'use client';

import React from 'react';

interface SanctioningPopupProps {
  popUpSource: 'sanctioningDetails';
  selectedSanctioning?: string;
  onClose: () => void;
}

const SanctioningPopup: React.FC<SanctioningPopupProps> = ({
  selectedSanctioning,
  onClose,
}) => {
  const sanctioningDetails: Record<string, string> = {
    IKF: 'The International Kickboxing Federation (IKF) is a worldwide organization for kickboxing events and competitions.',
    PMT: 'Point Muay Thai (PMT) focuses on technical sparring competitions with an emphasis on scoring points rather than knockouts.',
    PBSC: 'The Point Boxing Sparring Circuit (PBSC) provides a platform for point-based boxing sparring events, prioritizing safety and technique.',
    none: 'No specific sanctioning organization selected.'
  };

  const details = selectedSanctioning ? sanctioningDetails[selectedSanctioning] : 'No details available.';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
      <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
        <h2 className="text-xl font-bold mb-4">Sanctioning Details</h2>
        <p className="mb-4">{details}</p>

        {selectedSanctioning === 'IKF' && (
          <div>
            <p className="mb-4">Founded in 1992, IKF sanctions amateur and professional kickboxing events globally.</p>
            <p className="mb-4">Website: <a href="https://www.ikfkickboxing.com" target="_blank" className="text-blue-500">www.ikfkickboxing.com</a></p>
          </div>
        )}

        {selectedSanctioning === 'PMT' && (
          <div>
            <p className="mb-4">PMT focuses on technical sparring with rules that emphasize control and precision.</p>
            <p className="mb-4">For more details, visit <a href="https://www.pointmuaythai.com" target="_blank" className="text-blue-500">pointmuaythai.com</a></p>
          </div>
        )}

        {selectedSanctioning === 'PBSC' && (
          <div>
            <p className="mb-4">PBSC is dedicated to developing skills through point-based sparring events.</p>
            <p className="mb-4">Check their official site at <a href="https://www.pbscboxing.com" target="_blank" className="text-blue-500">pbscboxing.com</a></p>
          </div>
        )}

        <div className="flex justify-end">
          <button
            className="px-4 py-2 bg-blue-500 text-white rounded"
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default SanctioningPopup;
