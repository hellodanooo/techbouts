import React, { useState, useEffect } from 'react';
import { getFirestore, doc, getDoc } from 'firebase/firestore';
import { EventType } from '@/utils/types';
import buttons from '@/styles/buttons.module.css';
import { SiGooglemaps } from "react-icons/si";
import { FaCopy } from "react-icons/fa";
import { format, parseISO, parse } from 'date-fns';
import Image from 'next/image';
import { FaTicketAlt } from "react-icons/fa";
import TicketComponent from '@/components/Tickets';
import CoachComponent from '@/components/Coach';
import modals from '@/styles/modals.module.css';
import Register from '@/components/ui/Register';
import { FaUserPlus } from "react-icons/fa";
import { app } from '@/lib/firebase_techbouts/config';

interface EventDetailsProps {
  eventData: EventType;
  eventId: string;
  isOpen: boolean;
  ticketsEnabled: boolean;
  ticketPrice: number;
  coachEnabled: boolean;
  coachPrice: number;
  eventName: string;
  gymNames: string[];
  eventDetails: string;
  onClose: () => void;
}

const EventDetails: React.FC<EventDetailsProps> = ({ eventId, isOpen, onClose, ticketPrice, ticketsEnabled, coachPrice, eventName, gymNames, eventData, coachEnabled }) => {
  const [event, setEvent] = useState<EventType | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("1");
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);
  const toggleTicketModal = () => setIsTicketModalOpen(!isTicketModalOpen);

  const [isCoachModalOpen, setIsCoachModalOpen] = useState(false);
  const toggleCoachModal = () => setIsCoachModalOpen(!isCoachModalOpen);

  const [isRegistrationOpen, setIsRegistrationOpen] = useState(false);
  const closeRegistrationModal = () => {
    setIsRegistrationOpen(false);
  };


  function convertTo12HourFormat(time24: string): string {
    const date = parse(time24, 'HH:mm', new Date());
    return format(date, 'h:mm a');
  }


  const formatDate3 = (dateString: string) => {
    return format(parseISO(dateString), 'EEEE, MMMM do, yyyy');
  };


  useEffect(() => {
    const fetchEventDetails = async () => {
      setLoading(true);
      setError(null);
      const db = getFirestore(app);
      const eventRef = doc(db, 'purist_events', eventId);
      try {
        const eventSnap = await getDoc(eventRef);
        if (eventSnap.exists()) {
          setEvent(eventSnap.data() as EventType);
        } else {
          setError('Event not found');
        }
      } catch (err) {
        setError('Error fetching event details');
        console.error('Error fetching event details:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      fetchEventDetails();
    }
  }, [eventId, isOpen]);

  if (!isOpen) return null;

  if (loading) {
    return (
      <div className={modals.overlayLoading}>
        <div className={modals.contentLoading}>
          <Image src="/images/purist-loading.svg" alt="Loading" width={300} height={200}
          style={{margin:'auto'}}
          />
          <div style={{ marginTop: '-40px' }} className={`${modals.loadingText} custom-font-marker`}>Loading</div>
        </div>
      </div>
    );
  }

  if (error || !event) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center">
        <div className="bg-white p-6 rounded-lg">
          <p>{error || 'Event not found'}</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-blue-500 text-white rounded">
            Close
          </button>
        </div>
      </div>
    );
  }


  const openGoogleMaps = () => {
    if (event) {
      const address = `${event.address}, ${event.city}, ${event.state}`;
      const encodedAddress = encodeURIComponent(address);
      const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`;
      window.open(mapsUrl, '_blank');
    }
  };

  const copyAddress = () => {
    if (event) {
      const address = `${event.address}, ${event.city}, ${event.state}`;
      navigator.clipboard.writeText(address).then(() => {
        alert('Address copied to clipboard!');
      }).catch(err => {
        console.error('Failed to copy address: ', err);
      });
    }
  };

  const openRegistrationModal = () => {
    setIsRegistrationOpen(true);
  };





  return (
    <div className={modals.overlay}>
      <div className={modals.content}>



        <div className='twoTabContainer'>

          <div className="tab-container"
            style={{
              height: '95%',
            }}
          >

            <div
              style={{
                fontSize: 'clamp(16px, 5vw, 36px)',
                margin: '10px',
                backgroundColor: 'black',
                color: 'white',
                padding: '5px',
                borderRadius: '5px'
              }}>
              {formatDate3(event.date)}
            </div>

            <div
              style={{
                padding: '3%',
                border: '1px solid black',
                borderRadius: '5px',
                margin: '5px',
              }}>
              {eventData.event_details}
            </div>


            <div className='venue'>


              <div style={{ fontSize: 'clamp(16px, 5vw, 36px)', width: '100%', backgroundColor: 'black', color: 'white', marginBottom: '5px', }}>{event.venue_name}</div>



              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  marginBottom: '10px',
                  width: '90%',
                }}>

                <div
                  className={buttons.keyboard}
                  style={{ border: '1px solid black', width: '40%', borderRadius: '5px', cursor: 'pointer', padding: '5px'  }}
                  onClick={openGoogleMaps}>
                  
                  <div>
                    <SiGooglemaps size={35} style={{margin:'auto'}} />
                    <div style={{ fontSize: '1rem' }}>
                      Google maps
                      </div>
                    </div>

                </div>

                <div
                  className={buttons.keyboard}
                  style={{ border: '1px solid black', width: '40%', borderRadius: '5px', cursor: 'pointer', padding: '5px' }} onClick={copyAddress}>
                  <div>
                    <FaCopy size={35} style={{margin:'auto'}}/>
                    <div style={{ fontSize: '1rem' }}>
                      Copy Address
                      </div>
                      </div>
                </div>

              </div>

            </div>



            {event.doors_open && (
              <div
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}
              >
              Doors Open: {convertTo12HourFormat(event.doors_open)}
              </div>
            )}

            <div
              style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}
            >
              Bouts Start: {event.bouts_start_time ? convertTo12HourFormat(event.bouts_start_time) : 'N/A'}
            </div>


            {/* TAB CONTROLS */}
            <div className="tab-controls">
              <div
                className={`tab-button ${activeTab === "1" ? "active" : ""}`}
                onClick={() => setActiveTab("1")}
              >

                Fighters
              </div>
              <div
                className={`tab-button ${activeTab === "2" ? "active" : ""}`}
                onClick={() => setActiveTab("2")}
              >
                Spectators
              </div>


              {eventId && coachEnabled && (

              <div
                className={`tab-button ${activeTab === "3" ? "active" : ""}`}
                onClick={() => setActiveTab("3")}
              >

                Coaches
              </div>

              )}




            </div>




            <div className="tab-content"
              style={{
              }}
              >



              <div className={`tab-content-inner ${activeTab === "1" ? "active" : ""}`}
                style={{
                }}
                >

                <div style={{ display: 'flex', justifyContent: 'center' }}>



                  <div
                    onClick={openRegistrationModal}
                    style={{
                      cursor: 'pointer',
                    }}
                    className={`custom-font-marker ${buttons.glitch}`}
                  >
                    REGISTER <FaUserPlus />
                  </div>


                  {isRegistrationOpen && (
                    <div className={modals.overlayLevel2}>
                      <div className={modals.contentLevel2}>
                        <div className='custom-font-marker'
                          style={{
                            fontSize: '2rem',
                            textAlign: 'center',
                            padding: '10px',
                            backgroundColor: 'red',
                            color: 'white',
                            letterSpacing: '5px',
                          }}
                        >
                          REGISTRATION
                          <FaUserPlus />

                        </div>

                        <button className={modals.closeButton} onClick={closeRegistrationModal}>&times;
                        </button>
                        <Register

                          eventId={eventId as string}
                          eventName={eventData.event_name}
                          closeModal={closeRegistrationModal}
                          registrationFee={65}
                        />
                      </div>
                    </div>
                  )}


                  <div
                  >
                    <div className='weighinsContainer'
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}
                    >
                      Weigh-ins

                      <br></br>
                        <div >{event.weighin_date ? formatDate3(event.weighin_date) : 'N/A'}</div>
                        {event.weighin_start_time && event.weighin_end_time ? 
                        `${convertTo12HourFormat(event.weighin_start_time)} - ${convertTo12HourFormat(event.weighin_end_time)}` : 'N/A'}

                    </div>


                    <div
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}

                    >Rules Meeting: {event.rules_meeting_time}</div>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}

                    >Bouts Start: {event.bouts_start_time}</div>

                  </div>





                </div>
              </div>



              <div className={`tab-content-inner ${activeTab === "2" ? "active" : ""}`}>

                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>




                  {eventId && ticketsEnabled && (
                    <>

                      <div className={buttons.glitch} onClick={toggleTicketModal}>
                        TICKETS <FaTicketAlt />
                      </div>
                      
                    </>
                  )}


                  {isTicketModalOpen && (
                    <div className='modalBackground-level2'>
                      <div className='modalContent-level2'>
                        <TicketComponent
                          eventId={eventId as string}
                          ticketPrice={ticketPrice || 0}
                          eventName={eventName}
                          gymNames={gymNames}
                          onClose={toggleTicketModal}
                        />
                      </div>
                    </div>
                  )}



                  <div style={{}}>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}

                    >Doors Open: {event.doors_open}</div>

                    <div
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}

                    >Bouts Start: {event.bouts_start_time}</div>

                  </div>
                </div>


              </div>

              <div className={`tab-content-inner ${activeTab === "3" ? "active" : ""}`}
                style={{
                }}
                >

                <div style={{ display: 'flex', justifyContent: 'center' }}>

                {eventId && coachEnabled && (
                    <>

                      <div className={buttons.glitch} onClick={toggleCoachModal}>

                        COACH <FaUserPlus />
                      </div>
                    </>
                  )}


{isCoachModalOpen && (
                    <div className='modalBackground-level2'>
                      <div className='modalContent-level2'>
                        <CoachComponent
                          eventId={eventId as string}
                          coachPrice={coachPrice || 0}
                          eventName={eventName}
                          gymNames={gymNames}
                          onClose={toggleCoachModal}
                        />
                      </div>
                    </div>
                  )}



                  <div
                  >
                    <div className='weighinsContainer'
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}
                    >
                      Weigh-ins

                      <br></br>
                        <div >{event.weighin_date ? formatDate3(event.weighin_date) : 'N/A'}</div>
                        {event.weighin_start_time && event.weighin_end_time ? 
                        `${convertTo12HourFormat(event.weighin_start_time)} - ${convertTo12HourFormat(event.weighin_end_time)}` : 'N/A'}

                    </div>


                    <div
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}

                    >Rules Meeting: {event.rules_meeting_time}</div>
                    <div
                      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', border: '1px solid black', borderRadius: '5px', padding: '5px', margin: '5px' }}

                    >Bouts Start: {event.bouts_start_time}</div>

                  </div>





                </div>


              </div>



            </div>




            <div
              style={{
                backgroundColor: '##ff000080',
                margin: '10px',
                marginBottom: '20px',
                color: 'black',
                borderRadius: '5px',
                border: '1px solid black',
                padding: '5px',
                cursor: 'pointer',
              }} onClick={onClose} className={buttons.keyboard}>
              Close
            </div>
          </div>

        </div>


      </div>
    </div>
  );
};

export default EventDetails;