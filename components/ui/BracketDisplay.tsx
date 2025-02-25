//components/BracketDisplay.tsx
import React, { useState, useEffect } from 'react';
import { FullContactFighter } from '@/utils/types';
import Image from 'next/image';
import Link from 'next/link';
import { FaYoutube } from 'react-icons/fa';
import buttons from '@/styles/buttons.module.css';
import { MdOutlineSwapHorizontalCircle } from "react-icons/md";
import { MdOutlineRefresh } from "react-icons/md";
import FightcardImage from '@/components/FightcardImage';
import { FaRegCheckCircle } from "react-icons/fa";
import { CgCloseO } from "react-icons/cg";
import { FaChevronDown } from "react-icons/fa";
import { FaChevronUp } from "react-icons/fa";




type PopupMessageType = 'SWAP' | 'RELOAD' | 'OTHER';

interface BracketDisplayProps {
  fightcardData: FullContactFighter[];
  selectedClass: 'A' | 'B' | 'C' | 'ALL';
  selectedDivision: 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS' | 'ALL';
  selectedWeightClasses: number[];
  textFilter: string;

  isEditable: boolean;

  handleFighterClick?: (fighter: FullContactFighter, newFighter: boolean) => void;
  swapFighters?: (fighter1: FullContactFighter, fighter2: FullContactFighter) => void;

  onEditBracket?: (bracketNum: number, fighters: FullContactFighter[]) => void;

  onRecordChampionResult?: (fighter: FullContactFighter, result: 'W' | 'L' | 'NC' | 'DQ') => void;
  displayMessagePopup?: boolean;
  popupMessage?: string;
  popupMessageType?: PopupMessageType;
  videos: Video[];
  initialEventData: {
    date: string;
  };
}

interface Video {
  id: string;
  date: string;
  youtubeUrl: string;
  event: string;
  fighters: {
    docId: string;
    first: string;
    last: string;
    weightclass: string;
    age: number;
  }[];
  gyms: {
    id: string;
    gym: string;
    city: string;
    state: string;
  }[];
}

const BracketDisplay: React.FC<BracketDisplayProps> = ({
  fightcardData,
  selectedClass,
  selectedDivision,
  selectedWeightClasses,
  isEditable,
  handleFighterClick,
  onEditBracket,
  onRecordChampionResult,
  displayMessagePopup,
  popupMessage,
  popupMessageType,
  videos,
  initialEventData,
  textFilter,

}) => {

  const [organizedBrackets, setOrganizedBrackets] = useState<{
    [day: number]: { [key: number]: { [key: number]: FullContactFighter[] } }
  }>({});

  const [organizedBouts, setOrganizedBouts] = useState<{ [key: number]: FullContactFighter[] }>({});
  const [visibleChampions, setVisibleChampions] = useState<{ [key: string]: boolean }>({});
  const [matchingBrackets, setMatchingBrackets] = useState<string[]>([]);

  const [displayFightcardImage, setDisplayFightcardImage] = useState<boolean>(false);
  const [isDay1Collapsed, setIsDay1Collapsed] = useState<boolean>(true);


  const getPopupStyle = (messageType: PopupMessageType) => {
    const baseStyle = {
      position: 'fixed' as const,
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      padding: '20px',
      borderRadius: '10px',
      zIndex: 2000,
      fontSize: '24px',
      fontWeight: 'bold' as const,
    };

    switch (messageType) {
      case 'SWAP':
        return {
          ...baseStyle,
          backgroundColor: 'green',
          color: 'white',
          padding: '20px',
          width: '60vw',
        };
      case 'RELOAD':
        return {
          ...baseStyle,
          color: '#ff9100',
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
        };
    }
  };

  useEffect(() => {
    loadFighterPhotos();
  }, [fightcardData]);

  const loadFighterPhotos = async () => {
    const updatedFighters = await Promise.all(
      fightcardData.map(async (fighter) => {
       
        return fighter;
      })
    );
    organizeBrackets(updatedFighters);       // Pass the updated data for organizing brackets
  };





  const organizeBrackets = (fighters: FullContactFighter[]) => {
    const organized: {
      [day: number]: { [key: number]: { [key: number]: FullContactFighter[] } }
    } = {};
    const bouts: { [key: number]: FullContactFighter[] } = {};
  
    fighters.forEach(fighter => {
      if (fighter.bracket && fighter.bracket !== 0 && fighter.bout) {
        const day = fighter.day || 0; // Use 0 for fighters without a day
        if (!organized[day]) {
          organized[day] = {};
        }
        if (!organized[day][fighter.bracket]) {
          organized[day][fighter.bracket] = {};
        }
        if (!organized[day][fighter.bracket][fighter.bout]) {
          organized[day][fighter.bracket][fighter.bout] = [];
        }
        organized[day][fighter.bracket][fighter.bout].push(fighter);
      } else if (fighter.bracket === 0 && fighter.bout) {
        if (!bouts[fighter.bout]) {
          bouts[fighter.bout] = [];
        }
        bouts[fighter.bout].push(fighter);
      }
    });
  
    setOrganizedBrackets(organized);
    setOrganizedBouts(bouts);
  
    // Initialize all champions as visible
    const initialVisibleChampions = Object.entries(organized).reduce((acc, [day, brackets]) => {
      Object.keys(brackets).forEach(bracketNum => {
        acc[`${day}-${bracketNum}`] = true;
      });
      return acc;
    }, {} as { [key: string]: boolean });
    setVisibleChampions(initialVisibleChampions);
  };



  useEffect(() => {
    const initialVisibleChampions = Object.entries(organizedBrackets).reduce((acc, [day, brackets]) => {
      Object.keys(brackets).forEach(bracketNum => {
        acc[`${day}-${bracketNum}`] = true;
      });
      return acc;
    }, {} as { [key: string]: boolean });
    setVisibleChampions(initialVisibleChampions);
  }, [organizedBrackets]);



  useEffect(() => {
    if (textFilter) {
      const matching = Object.entries(organizedBrackets).flatMap(([day, brackets]) => 
        Object.entries(brackets).filter(([, bouts]) => 
          Object.values(bouts).flat().some(fighter =>
            fighter.first.toLowerCase().includes(textFilter.toLowerCase()) ||
            fighter.last.toLowerCase().includes(textFilter.toLowerCase()) ||
            fighter.gym.toLowerCase().includes(textFilter.toLowerCase())
          )
        ).map(([bracketNum]) => `${day}-${bracketNum}`)
      );
      setMatchingBrackets(matching);
      console.log("Matching brackets:", matching);
    } else {
      setMatchingBrackets([]);
    }
  }, [textFilter, organizedBrackets]);


  const getBracketInfo = (fighters: FullContactFighter[]) => {
    if (fighters.length === 0) return { weightclass: '', class: '', ageGender: '' };

    const weightclass = fighters[0].weightclass;
    const fighterClass = fighters[0].class;
    const ageGender = fighters[0].age_gender;

    return { weightclass, class: fighterClass, ageGender };
  };



 const renderBracket = (day: number, bracketNum: number, bouts: { [key: number]: FullContactFighter[] }) => {
  const isCClass = Object.values(bouts).flat().some(fighter => fighter.class === 'C');
  const { weightclass, class: fighterClass, ageGender } = getBracketInfo(Object.values(bouts).flat());
  const firstFighter = Object.values(bouts).flat()[0];
  const isConfirmed = firstFighter?.confirmed === true;

  const filteredBouts = Object.entries(bouts).filter(([, fighters]) =>
    fighters.some(fighter =>
      (selectedClass === 'ALL' || fighter.class === selectedClass) &&
      (selectedDivision === 'ALL' || fighter.age_gender === selectedDivision) &&
      (selectedWeightClasses.length === 0 || selectedWeightClasses.includes(fighter.weightclass)) &&
      (matchingBrackets.length === 0 || matchingBrackets.includes(`${day}-${bracketNum}`))
    )
  );



    const matchesTextFilter = Object.values(bouts).flat().some(fighter =>
      textFilter !== '' && (
        fighter.first.toLowerCase().includes(textFilter.toLowerCase()) ||
        fighter.last.toLowerCase().includes(textFilter.toLowerCase()) ||
        fighter.gym.toLowerCase().includes(textFilter.toLowerCase())
      )
    );

    // Log the bracket number if it contains a matching fighter
    if (matchesTextFilter) {
      console.log(`Bracket ${bracketNum} on Day ${day} contains fighters matching the search: "${textFilter}"`);
    }

    // If there's a text filter, only show brackets with matching fighters
    if (textFilter !== '' && !matchesTextFilter) {
      return null;
    }



    if (filteredBouts.length === 0) return null;

    const getWinner = (boutFighters: FullContactFighter[]) => {
      return boutFighters.find(fighter => fighter.result === 'W');
    };

    const bout1Winner = getWinner(bouts[1] || []);
    const bout2Winner = getWinner(bouts[2] || []);
    const championshipWinner = [...Object.values(bouts).flat()].find(
      fighter => fighter.championship_result === 'W'
    );
    const key = `${day}-${bracketNum}`;


    const getVideoForBout = (fighter1: FullContactFighter, fighter2: FullContactFighter) => {
      const fighterIds = [fighter1.id, fighter2.id].sort().join('-VS-');
      return videos.find(video =>
        video.id === fighterIds &&
        video.date === initialEventData.date &&
        video.youtubeUrl 
      );
    };

    const getVideoForChampionshipBout = () => {
      if (bout1Winner && bout2Winner) {
        return getVideoForBout(bout1Winner, bout2Winner);
      }
      return null;
    };

    const toggleChampionVisibility = (day: number, bracketNum: number) => {
      const key = `${day}-${bracketNum}`;
      setVisibleChampions(prev => ({
        ...prev,
        [key]: !prev[key]
      }));
    };


    const renderChampionshipBout = () => {
      return (
        <div
          className='championshipBout'
          style={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            zIndex: 2,
            transition: 'opacity 0.3s ease-in-out',
            opacity: 1,
            border: '1px solid black',
            borderRadius: '5px',
          }}>
          <div style={{ backgroundColor: 'black', color: 'white' }}>Championship Bout</div>

          <div className='video'>

            {(() => {
              const video = getVideoForChampionshipBout();
              if (video) {
                return (
                  <Link
                    href={video.youtubeUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="watch-video-button"
                  >
                    Watch Championship Fight <FaYoutube className="youtube-icon" />
                  </Link>
                );
              }
              return null;
            })()}

          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            zIndex: 2,
            transition: 'opacity 0.3s ease-in-out',
            opacity: 1,
            gap: '30px',
            marginTop: '40px'
          }}>
                 {[bout1Winner, bout2Winner].map((fighter, index) => (
        <div 
          key={fighter?.id || `empty-slot-${index}`}

              style={{
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'center',
                alignItems: 'center',
                padding: '10px',
                border: '1px solid black',
                borderRadius: '5px',
                zIndex: 2,
                position: 'relative',
                backgroundColor: 'white',
                width: '40%',
                cursor: isEditable ? 'pointer' : 'default',
              }}
                onClick={() => {
                  if (isEditable && fighter && onRecordChampionResult) {
                    const result = prompt('Enter championship result (W/L/NC/DQ):');
                    if (result && ['W', 'L', 'NC', 'DQ'].includes(result.toUpperCase())) {
                      onRecordChampionResult(fighter, result.toUpperCase() as 'W' | 'L' | 'NC' | 'DQ');
                    }
                  }
                }}
              >
                {fighter ? (
                  <>
                    <Image
                      src={fighter.photo || '/Icon_grey.png'}
                      alt={fighter.first || 'Fighter'}
                      width={70}
                      height={70}
                      priority
                    />
                    {fighter.first} {fighter.last}<br />
                    {fighter.gym.length > 11 ? `${fighter.gym.slice(0, 11)}...` : fighter.gym}<br />
                    {fighter.championship_result && <strong>Result: {fighter.championship_result}</strong>}
                  </>
                ) : (
                  <>
                    <Image
                      src={'/Icon_grey.png'}
                      alt={'Fighter'}
                      width={70}
                      height={70}
                      priority
                    />
                    Winner Bout {index + 1}<br />
                    Gym
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      );
    };


    return (
      <div key={key} style={{
        margin: '10px 0',
        border: '1px solid black',
        padding: '10px',
        borderRadius: '10px',
        position: 'relative',
      }}>
        <div
          style={{
            border: '1px solid black',
            padding: '5px',
            backgroundColor: 'black',
            color: 'white',
            fontSize: '.7rem',
          }}
          className={`${buttons.keyboard} custom-font-catz`}
          onClick={() => isEditable && onEditBracket && onEditBracket(bracketNum, Object.values(bouts).flat())}
        >
          <div>
            Day {day} - Bracket 
            <span
              style={{border: '1px solid white', padding: '5px 10px', borderRadius: '5px', marginRight: '10px', marginLeft: '10px'}}
              className='custom-font-jersey'
            >
              {bracketNum}
            </span>

           <span
           style={{marginRight: '5px', marginLeft: '5px'}}
           >
             {ageGender}  
        </span>

              Class
          <span className='custom-font-jersey'
          style={{
            height: '20px',
            border: '1px solid white',
             padding: '5px 10px', borderRadius: '5px', marginLeft: '5px'}}
          >{fighterClass}</span>
          
        
          
          <span
                    style={{border: '1px solid white', padding: '5px 10px', borderRadius: '5px', marginRight: '5px', marginLeft: '5px'}}

          className='custom-font-jersey'>{weightclass}
          </span> 
          lbs
          </div>

           
        </div>

        <div className='trapezoid'
          style={{
            margin: 'auto',
            marginTop: '-5px',
            marginBottom: '10px',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            color: 'white',
            padding: '5px',
            borderRadius: '5px',
            fontSize: '1rem',
          
          }}
          >

CONFIRMED:
          {isConfirmed ? (
            <FaRegCheckCircle color='lightgreen' style={{marginLeft:'10px'}} />
          ) : (
            <CgCloseO color='red' style={{marginLeft:'5px'}} />
          )}
            </div> 

            
            {championshipWinner && (
          <div
            onClick={() => toggleChampionVisibility(day, bracketNum)}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(255, 255, 255, 0.9)',
              zIndex: 15,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '20px',
              textAlign: 'center',
              cursor: 'pointer',
              transition: 'opacity 0.5s ease, visibility 0.5s ease',
              opacity: visibleChampions[key] ? 1 : 0,
              visibility: visibleChampions[key] ? 'visible' : 'hidden',
            }}
          >
            <div style={{ backgroundColor: 'black', color: 'white', padding: '5px 10px', borderRadius: '5px' }}>
              {championshipWinner.weightclass} lbs {championshipWinner.class} Class
            </div>
            <h3 style={{ color: 'black', fontSize: '24px', marginBottom: '10px' }}>Championship Winner</h3>
            <p style={{ fontSize: '20px', fontWeight: 'bold', margin: '10px 0' }}>
              {championshipWinner.first} {championshipWinner.last}
            </p>
            <p>{championshipWinner.gym}</p>
            <Image
              src={championshipWinner.photo || '/Icon_grey.png'}
              alt={championshipWinner.first || 'Champion'}
              width={200}
              height={190}
              priority
            />
            <div style={{ marginTop: '-10px' }}>
              <Image
                src={championshipWinner.class === 'C' ? '/trophy2.png' : '/belt.png'}
                alt={championshipWinner.class === 'C' ? 'Championship Trophy' : 'Championship Belt'}
                width={200}
                height={100}
              />
            </div>
            <p style={{ marginTop: '10px', fontSize: '14px', color: '#666' }}>
              (Click to view bracket details)
            </p>
          </div>
        )}





        <div className='bracket' style={{ position: 'relative' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {filteredBouts.map(([boutNum, fighters]) => (
              <div key={boutNum}>
                <div style={{
                  position: 'relative',
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '5px',
                  zIndex: 10,
                }}>
                  Bout: {boutNum}
                </div>

                <div className='video'>
                  {fighters.length === 2 && (() => {
                    const video = getVideoForBout(fighters[0], fighters[1]);
                    if (video) {
                      return (
                        <a href={video.youtubeUrl} target="_blank" rel="noopener noreferrer">
                          Watch Fight Video
                        </a>
                      );
                    }
                    return null;
                  })()}
                </div>


                <div style={{ display: 'flex', gap: '30px', position: 'relative', paddingBottom: '10px', paddingRight: '6px' }}>
  {["fighter1", "fighter2"].map((fighternum) => {
    const fighter = fighters.find(f => f.fighternum === fighternum);

    const getStyleBasedOnResult = (result?: string) => {
      const baseStyle = {
        flex: 1,
        padding: '10px',
        border: '1px solid black',
        borderRadius: '5px',
        backgroundColor: fighter ? 'white' : '#f0f0f0',
        zIndex: 2,
        position: 'relative' as const,
        cursor: fighter ? 'pointer' : 'default',
      };

      if (result === 'W') {
        return { ...baseStyle, backgroundColor: '#e6ffe6', borderColor: '#00cc00', fontSize: '10px' };
      } else if (result === 'L') {
        return { ...baseStyle, backgroundColor: '#ffe6e6', color: 'grey', borderColor: '#cc0000', fontSize: '10px' };
      }

      return baseStyle;
    };

    return (
      <div
        className={buttons.keyboard}
        key={fighternum}
        style={getStyleBasedOnResult(fighter?.result)}
        onClick={() => {
          if (fighter && isEditable && handleFighterClick && fighter.id !== 'placeholder') {
            handleFighterClick(fighter, false);
          }
        }}
      >
        {fighter ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
            <Image
              src={fighter.photo || '/Icon_grey.png'}
              alt={fighter.first || 'Fighter'}
              width={70}
              height={70}
              priority
            />
            {fighter.first} {fighter.last}<br />
            {fighter.gym.length > 11 ? `${fighter.gym.slice(0, 11)}..` : fighter.gym}<br />
            {fighter.weightclass} lbs<br />
            Age: {fighter.age}<br />
            {fighter.gender}<br />
            <div>[{fighter.mt_win}-{fighter.mt_loss}]</div>
            {fighter.result || ''}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: '0.2' }}>
            <Image
              src={'/Icon_grey.png'}
              alt={'Fighter'}
              width={70}
              height={70}
              priority
            />
            OPEN
          </div>
        )}
      </div>
    );
  })}
</div>



              </div>
            ))}

            {/* Add placeholder bout if there's only one bout with fighters */}
            {Object.keys(bouts).length === 1 && (
              <div>
                <div style={{
                  position: 'relative',
                  backgroundColor: 'black',
                  color: 'white',
                  padding: '2px 10px',
                  borderRadius: '5px',
                  zIndex: 10,
                }}>
                  Bout: {Object.keys(bouts)[0] === '1' ? '2' : '1'}
                </div>
                <div style={{ display: 'flex', gap: '30px', position: 'relative', }}>
                  {[1, 2].map((fighterNum) => (
                    <div
                      key={fighterNum}
                      style={{
                        flex: 1,
                        padding: '10px',
                        border: '1px solid black',
                        borderRadius: '5px',
                        backgroundColor: '#f0f0f0',
                        zIndex: 2,
                        position: 'relative',
                      }}
                    >
                      <>

                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', opacity: '0.2' }}>

                          <Image
                            src={'/Icon_grey.png'}
                            alt={'Fighter'}
                            width={70}
                            height={70}
                            priority
                          />
                          OPEN
                        </div>
                        <br />
                        <br />
                        <br />
                      </>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className='Blacklines' style={{
            position: 'absolute',
            left: '50%',
            top: '20%',
            transform: 'translateX(-50%)',
            width: '10px',
            height: '40%',
            backgroundColor: 'black',
            zIndex: 1,
          }}>
            <div style={{
              position: 'absolute',
              left: '50%',
              top: 0,
              transform: 'translateX(-50%)',
              width: '100px',
              height: '10px',
              backgroundColor: 'black',
            }} />
            <div style={{
              position: 'absolute',
              left: '50%',
              bottom: 0,
              transform: 'translateX(-50%)',
              width: '100px',
              height: '10px',
              backgroundColor: 'black',
            }} />
          </div>

          {/* BELT OR TROPHY IMAGE */}

          <div style={{
            position: 'absolute',
            left: '50%',
            top: '80%',
            transform: 'translateX(-50%)',
            zIndex: 3,
            transition: 'opacity 0.3s ease-in-out',
            opacity: 1,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            width: '150px',
            height: '80px',
          }}>
            {true && (
              <div style={{
                position: 'relative',
                width: '100%',
                height: '100%',
              }}>
                <Image
                  src={isCClass ? '/trophy2.png' : '/belt.png'}
                  alt={isCClass ? "Championship Trophy" : "Championship Belt"}
                  fill
                  style={{
                    objectFit: 'contain',
                    objectPosition: 'center bottom'
                  }}
                  priority
                />
              </div>
            )}
          </div>




          {renderChampionshipBout()}


        </div>


      </div>
    );

  };




  const renderBouts = () => {
    console.log('Fightcard data in Bout', fightcardData);
    const bracket0Fighters = fightcardData.filter(fighter => fighter.bracket === 0);
    const boutCounts: { [key: number]: number } = {};

    bracket0Fighters.forEach(fighter => {
      if (fighter.bout) {
        boutCounts[fighter.bout] = (boutCounts[fighter.bout] || 0) + 1;
      }
    });



    const matchedBouts = Object.values(boutCounts).filter(count => count === 2).length;
    const singleFighterBouts = Object.values(boutCounts).filter(count => count === 1).length;

    return (
      <>
        <h2>Bouts</h2>

        {isEditable && (
          <div style={{ marginBottom: '20px', padding: '10px', backgroundColor: '#f0f0f0', borderRadius: '5px' }}>
            <h3>Bout Analysis</h3>
            <p>Total fighters with bracket = 0: {bracket0Fighters.length}</p>
            <p>Matched bouts (2 fighters): {matchedBouts}</p>
            <p>Single fighter bouts: {singleFighterBouts}</p>
          </div>
        )}


        <div className='boutsContainer'>
          {Object.entries(organizedBouts)
            .sort(([boutA], [boutB]) => parseInt(boutA) - parseInt(boutB))
            .map(([bout, fighters]) => (
              <React.Fragment key={`bout-${bout}`}>
                {renderBout(parseInt(bout), fighters)}
              </React.Fragment>
            ))}
        </div>
      </>
    );
  };



const renderBout = (bout: number, fighters: FullContactFighter[]) => {
  const defaultFighter: FullContactFighter = {
    // Basic Information
    fighter_id: '',
    id: 'placeholder',
    first: 'OPEN',
    last: '',
    dob: '',
    age: 0,
    gender: '',
    email: '',
    
    // Gym Information
    gym: '',
    gym_id: '',
    coach: '',
    coach_email: '',
    coach_name: '',
    coach_phone: '',
    
    // Location Information
    state: '',
    city: '',
    address: '',
    comp_city: '',
    comp_state: '',
    
    // Physical Information
    weighin: 0,
    weightclass: 0,
    height: 0,
    
    // Record
    mt_win: 0,
    mt_loss: 0,
    boxing_win: 0,
    boxing_loss: 0,
    mma_win: 0,
    mma_loss: 0,
    pmt_win: 0,
    pmt_loss: 0,
  
    nc: 0,
    dq: 0,
 
    
    // Event Information
    bout: 0,
    bout_type: '',
    boutmat: '',
    mat: 0,
    bracket: 0,
    day: 0,
    fighternum: 'unmatched',
    opponent_id: '',
    result: '',
    championship_result: '',
    
    // Experience & Classification
    years_exp: 0,
    class: 'C',
    age_gender: 'MEN',
    confirmed: false,
    
  
    
    // Media & Documentation
    photo: '/Icon_grey.png',
    photo_package: false,
    docId: '',
    website: '',

 
  };

  const displayFighters = fighters.length === 1
    ? [...fighters, defaultFighter]
    : fighters;

  return (
    <div key={bout} style={{ margin: '10px 0', border: '1px solid black', padding: '10px', borderRadius: '10px' }}>
      <h3>Bout {bout}</h3>
      <div style={{ display: 'flex', gap: '20px' }}>
        {displayFighters.map((fighter) => (
          <div
            key={fighter.id}
            style={{
              flex: 1,
              padding: '10px',
              border: '1px solid black',
              borderRadius: '5px',
              backgroundColor: fighter.id === 'placeholder' ? '#f0f0f0' : 'white',
              cursor: isEditable && fighter.id !== 'placeholder' ? 'pointer' : 'default',
              opacity: fighter.result === 'L' ? 0.3 : 1, // Set opacity to 30% if result is 'L'
            }}
            onClick={() => {
              if (fighter && isEditable && handleFighterClick && fighter.id !== 'placeholder') {
                handleFighterClick(fighter, false);
              }
            }}
          >
            {fighter.id !== 'placeholder' ? (
              <>
                <Image
                  src={fighter.photo || '/Icon_grey.png'}
                  alt={fighter.first || 'Fighter'}
                  width={70}
                  height={70}
                  priority
                />
                <p>{fighter.first} {fighter.last}</p>
                <p>{fighter.gym || 'Gym'}</p>
                <p>{fighter.weightclass} lbs</p>
                <p>Age: {fighter.age}</p>
                {fighter.gender}<br />
                <p>[{fighter.mt_win}-{fighter.mt_loss}]</p>
                <p>{fighter.result || ''}</p>
              </>
            ) : (
              <p style={{ textAlign: 'center', fontSize: '1.2em', fontWeight: 'bold' }}>OPEN</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};






  const toggleFightcardImage = () => {
    setDisplayFightcardImage(!displayFightcardImage);
  };


  return (
    <>
      <div className='bracketsContainer'>

        <button
          onClick={toggleFightcardImage}
          className={`${buttons.keyboard} fightcard_image`}
          style={{
            padding: '10px',
            margin: '10px 0',
            backgroundColor: '#f0f0f0',
            border: '1px solid black',
            borderRadius: '5px',
            cursor: 'pointer',
          }}
        >
          {displayFightcardImage ? 'Hide Fightcard text' : 'Show Fightcard text'}
        </button>

        {/* {isEditable && (
          <button
            onClick={organizeBracketsByWeight}
            className={`${buttons.keyboard} organize-weight-button`}
            style={{
              padding: '10px',
              margin: '10px 0',
              backgroundColor: '#f0f0f0',
              border: '1px solid black',
              borderRadius: '5px',
              cursor: 'pointer',
            }}
          >
            Organize Brackets by Weight
          </button>
        )} */}

        {displayFightcardImage && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            zIndex: 1000,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <div style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '10px',
              maxWidth: '90%',
              maxHeight: '90%',
              overflow: 'auto',
            }}>
              <button
                onClick={toggleFightcardImage}
                style={{
                  position: 'absolute',
                  top: '10px',
                  right: '10px',
                  padding: '5px 10px',
                  backgroundColor: '#f0f0f0',
                  border: '1px solid black',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
              <FightcardImage fightcardData={fightcardData} />
            </div>
          </div>
        )}


{[1, 2].map(day => {
          if (organizedBrackets[day]) {
            return (
              <React.Fragment key={`day-${day}`}>
                <div
                  style={{
                    fontSize: '1.5rem',
                    backgroundColor: 'black',
                    color: 'white',
                    padding: '10px',
                    borderRadius: '5px',
                    marginTop: '20px',
                    marginBottom: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                  }}
                  onClick={() => day === 1 && setIsDay1Collapsed(!isDay1Collapsed)}
                >
                  <span>Day {day}</span>
                  {day === 1 && (
                    isDay1Collapsed ? <FaChevronDown size={24} /> : <FaChevronUp size={24} />
                  )}
                </div>
                {(day !== 1 || !isDay1Collapsed) && (
                  <div style={{ display: day === 1 && isDay1Collapsed ? 'none' : 'block' }}>
                    {Object.entries(organizedBrackets[day]).map(([bracketNum, bouts]) => (
                      <React.Fragment key={`day-${day}-bracket-${bracketNum}`}>
                        {renderBracket(day, parseInt(bracketNum), bouts)}
                      </React.Fragment>
                    ))}
                  </div>
                )}
              </React.Fragment>
            );
          }
          return null;
        })}

      {/* Render brackets without day value */}
      {Object.entries(organizedBrackets).filter(([day]) => !['1', '2'].includes(day)).map(([day, dayBrackets]) => (
        <React.Fragment key={`day-${day}`}>
         
          <div
          style={{
            fontSize: '1.5rem',
            backgroundColor: 'black',
            color: 'white',
            padding: '10px',
            borderRadius: '5px',
            marginTop: '20px',
            marginBottom: '10px',
          }}
          >
            {day === '0' ? 'Brackets Pending' : `Day ${day}`}
          </div>

          {Object.entries(dayBrackets).map(([bracketNum, bouts]) => (
            <React.Fragment key={`day-${day}-bracket-${bracketNum}`}>
              {renderBracket(parseInt(day), parseInt(bracketNum), bouts)}
            </React.Fragment>
          ))}
        </React.Fragment>
      ))}
    </div>




      {renderBouts()}




      {displayMessagePopup && popupMessageType && (
        <div style={getPopupStyle(popupMessageType)}>
          {popupMessage}<br />
          {popupMessageType === 'SWAP' && (
            <MdOutlineSwapHorizontalCircle style={{ fontSize: '60px', marginTop: '10px' }} />
          )}
          {popupMessageType === 'RELOAD' && (
            <MdOutlineRefresh style={{
              boxShadow: '0 0 20px 10px #ff9100',

              fontSize: '100px',
              marginTop: '10px',
              animation: 'rotate 2s linear infinite',

            }} />
          )}
        </div>
      )}


      <style jsx>{`
        @keyframes rotate {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
      `}</style>

    </>
  );
};

export default BracketDisplay;


