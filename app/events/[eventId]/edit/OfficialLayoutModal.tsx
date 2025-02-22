import React, { FC } from 'react';
import { Official } from '../../../../utils/types';


interface OfficialLayoutModalProps {
    isOpen: boolean;
    onClose: () => void;
    officials: Official[];
    matCount: number;
}

const OfficialLayoutModal: FC<OfficialLayoutModalProps> = ({ isOpen, onClose, officials, matCount }) => {
    if (!isOpen) return null;

    const renderAssignedOfficial = (mat: number, location: string) => {
        const official = officials.find(official => official.location === location && official.mat === mat);
        return official ? `${official.first} ${official.last}` : `Select ${location}`;
    };

    const renderMat = (matNumber: number) => (
        <div key={matNumber}>
            <h3>Mat {matNumber}</h3>
            <div style={{ height: '230px', display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', alignItems: 'center' }}>
                
                <div style={{ display: 'flex', justifyContent: 'center' }}>
                    <div className='officialMatImage'>
                        <p>Judge 1</p>
                        <div
                    style={{borderRadius: '5px', backgroundColor: 'white' }}
                        >
                        {renderAssignedOfficial(matNumber, 'judge1')}
                        </div>
                    </div>
                    <div className='officialMatImage'>
                        <p>Judge 2</p>
                        {renderAssignedOfficial(matNumber, 'judge2')}
                    </div>
                    <div className='officialMatImage'>
                        <p>Judge 3</p>
                        {renderAssignedOfficial(matNumber, 'judge3')}
                    </div>
                </div>
                <div className='refMatImage'>
                    <p>Referee</p>
                    {renderAssignedOfficial(matNumber, 'referee')}
                </div>
            </div>
        </div>
    );

    return (
        <div className="modalOverlay">
            <div className="modalContentOfficials">
                <button onClick={onClose} >Close</button>
                <div>
                    {[...Array(matCount)].map((_, i) => renderMat(i + 1))}
                </div>
                {/* Share Image button or functionality goes here */}
            </div>
        </div>
    );
};

export default OfficialLayoutModal;
