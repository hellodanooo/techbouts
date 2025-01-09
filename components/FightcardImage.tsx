import React, { useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import { GiSave } from "react-icons/gi";
import { FaPrint } from "react-icons/fa";
import buttons from '../styles/buttons.module.css';
import { ResultsFighter } from '@/utils/types';


interface FightcardImageProps {
  fightcardData: ResultsFighter[];
}

const FightcardImage: React.FC<FightcardImageProps> = ({ fightcardData }) => {
  const [showResults, setShowResults] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const organizeData = () => {
    const organizedData: { [key: number]: { [key: number]: ResultsFighter[] } } = {};
    const bouts: { [key: number]: ResultsFighter[] } = {};

    fightcardData.forEach(fighter => {
      if (fighter.bracket && fighter.bracket !== 0 && fighter.bout) {
        if (!organizedData[fighter.bracket]) {
          organizedData[fighter.bracket] = {};
        }
        if (!organizedData[fighter.bracket][fighter.bout]) {
          organizedData[fighter.bracket][fighter.bout] = [];
        }
        organizedData[fighter.bracket][fighter.bout].push(fighter);
      } else if (fighter.bracket === 0 && fighter.bout) {
        if (!bouts[fighter.bout]) {
          bouts[fighter.bout] = [];
        }
        bouts[fighter.bout].push(fighter);
      }
    });

    return { organizedData, bouts };
  };

  const renderFighter = (fighter: ResultsFighter) => (
    <div style={{
      border: '1px solid black',
      padding: '5px',
      margin: '5px',
      borderRadius: '5px',
      width: '45%',
      backgroundColor: fighter.result === 'W' ? '#e6ffe6' : fighter.result === 'L' ? '#ffe6e6' : 'white',
    }}>
      <div>{fighter.first} {fighter.last}</div>
      <div>{fighter.gym}</div>
      <div>{fighter.weightclass} lbs | {fighter.age} yrs | {fighter.gender}</div>
      <div>[{fighter.win}-{fighter.loss}] {fighter.result || ''}</div>
    </div>
  );

  const renderBout = (boutNum: number, fighters: ResultsFighter[]) => (
    <div key={boutNum} style={{ margin: '10px 0', border: '1px solid black', padding: '10px' }}>
      <h4 style={{backgroundColor: '#ede5cc', padding: '5px', borderRadius: '5px'}}>Bout {boutNum}</h4>
      <div style={{ display: 'flex', justifyContent: 'space-around' }}>
        {fighters.map(fighter => renderFighter(fighter))}
      </div>
      {showResults && (
        <div style={{ marginTop: '10px', backgroundColor: '#f0f0f0', padding: '5px', borderRadius: '5px' }}>
          <h5>Bout Result:</h5>
          <div>Decision: _______________________________</div>
          <div>Method of Victory: ______________________________</div>
          <div>Round Stopped: ___________________________________</div>
        </div>
      )}
    </div>
  );

  const renderBracket = (bracketNum: number, bouts: { [key: number]: ResultsFighter[] }) => {
    const fighters = Object.values(bouts).flat();
    const weightclass = fighters[0]?.weightclass;
    const ageGender = fighters[0]?.age_gender;
    const fighterClass = fighters[0]?.class;

    return (
      <div key={bracketNum} style={{ margin: '20px 0', border: '2px solid black', padding: '10px' }}>
        <div style={{
          fontSize:'1.5rem',
          backgroundColor: 'black',
          color: 'white',
        }}>
          Bracket {bracketNum}: {fighterClass} Class {ageGender} {weightclass} lbs
        </div>
        {Object.entries(bouts).map(([boutNum, fighters]) => renderBout(parseInt(boutNum), fighters))}
      </div>
    );
  };

  const captureImage = async () => {
    if (contentRef.current) {
      try {
        const canvas = await html2canvas(contentRef.current, {
          scrollY: -window.scrollY,
          windowWidth: document.documentElement.offsetWidth,
          windowHeight: document.documentElement.scrollHeight,
        });
        
        const image = canvas.toDataURL("image/png").replace("image/png", "image/octet-stream");
        const link = document.createElement('a');
        link.download = 'fightcard.png';
        link.href = image;
        link.click();
      } catch (error) {
        console.error("Error capturing image:", error);
      }
    }
  };

  const renderFighterForPrint = (fighter: ResultsFighter) => `
    <div style="
      border: 1px solid black;
      padding: 5px;
      margin: 5px;
      border-radius: 5px;
      width: 45%;
      background-color: ${fighter.result === 'W' ? '#e6ffe6' : fighter.result === 'L' ? '#ffe6e6' : 'white'};
    ">
      <div>${fighter.first} ${fighter.last}</div>
      <div>${fighter.gym}</div>
      <div>${fighter.weightclass} lbs | ${fighter.age} yrs | ${fighter.gender}</div>
      <div>[${fighter.win}-${fighter.loss}] ${fighter.result || ''}</div>
    </div>
  `;

  const renderBoutForPrint = (boutNum: number, fighters: ResultsFighter[]) => `
    <div class="bout" style="
      margin: 10px 0;
      border: 1px solid black;
      padding: 10px;
      page-break-inside: avoid;
      height: 45vh;
    ">
      <h4 style="background-color: #ede5cc; padding: 5px; border-radius: 5px;">Bout ${boutNum}</h4>
      <div style="display: flex; justify-content: space-around;">
        ${fighters.map(fighter => renderFighterForPrint(fighter)).join('')}
      </div>
      <div style="margin-top: 10px; background-color: #f0f0f0; padding: 5px; border-radius: 5px;">
        <h5>Bout Result:</h5>
        <div>Decision: _______________________________</div>
        <div>Method of Victory: ______________________________</div>
        <div>Round Stopped: ___________________________________</div>
      </div>
    </div>
  `;

  const handlePrint = () => {
    const { organizedData, bouts } = organizeData();
    const allBouts = [
      ...Object.values(organizedData).flatMap(bracketBouts => 
        Object.entries(bracketBouts).map(([boutNum, fighters]) => ({ boutNum: parseInt(boutNum), fighters }))
      ),
      ...Object.entries(bouts).map(([boutNum, fighters]) => ({ boutNum: parseInt(boutNum), fighters }))
    ].sort((a, b) => a.boutNum - b.boutNum);

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Fightcard Bouts</title>
            <style>
              body { font-family: Arial, sans-serif; }
              .bout { page-break-inside: avoid; height: 45vh; }
              @media print {
                .bout { page-break-inside: avoid; height: 45%; }
                @page { size: portrait; }
              }
            </style>
          </head>
          <body>
            ${allBouts.map(bout => renderBoutForPrint(bout.boutNum, bout.fighters)).join('')}
          </body>
        </html>
      `);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const { organizedData, bouts } = organizeData();

  return (
    <>
      <button 
        onClick={captureImage}
        style={{
          position: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: '10px',
          left: '10vw',
          zIndex: 1000,
          padding: '10px',
          backgroundColor: '#4CAF50',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        <GiSave size={30} />  Save as Image
      </button>

      <button 
        onClick={handlePrint}
        style={{
          position: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: '10px',
          left: '30vw',
          zIndex: 1000,
          padding: '10px',
          backgroundColor: '#4285F4',
          color: 'white',
          border: 'none',
          borderRadius: '5px',
          cursor: 'pointer'
        }}
      >
        <FaPrint size={30} />  Print Bouts
      </button>

      <button
        style={{
          position: 'fixed',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          top: '10px',
          right: '15vw',
          zIndex: 1000,
        }}
        className={buttons.toggle}
        onClick={() => setShowResults(!showResults)}
      >
        {showResults ? 'Hide Recording' : 'Show Recording'}
      </button>

      <div ref={contentRef} style={{ fontFamily: 'Arial, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
        <h2>Fightcard</h2>
        {Object.entries(organizedData).map(([bracketNum, bracketBouts]) => 
          renderBracket(parseInt(bracketNum), bracketBouts)
        )}
        <h2>Individual Bouts</h2>
        {Object.entries(bouts).map(([boutNum, fighters]) => 
          renderBout(parseInt(boutNum), fighters)
        )}
      </div>
    </>
  );
};

export default FightcardImage;