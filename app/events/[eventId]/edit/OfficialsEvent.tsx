'use client';

import React, { FC, useEffect, useState } from 'react';
import { deleteDoc, getDoc, setDoc, getFirestore, collection, getDocs, doc, updateDoc } from 'firebase/firestore';
import { app } from '@/lib/firebase_techbouts/config';
import { Official } from '../../../../utils/types';
import Link from 'next/link';
import OfficialLayoutModal from './OfficialLayoutModal';

interface OfficialsEventProps {
    eventId: string;
    numMats: number;
}

interface AutocompleteProps {
    officialsList: Official[];
    onSelectOfficial: (officialId: string, position: string) => void;
    position: string;
}



const Autocomplete: FC<AutocompleteProps> = ({ officialsList, onSelectOfficial, position }) => {
    const [input, setInput] = useState('');
    const [filteredOfficials, setFilteredOfficials] = useState<Official[]>([]);

    useEffect(() => {
        setFilteredOfficials(
            officialsList.filter(official =>
                `${official.first} ${official.last}`.toLowerCase().includes(input.toLowerCase())
            )
        );
    }, [input, officialsList]);

    const handleSelect = (officialId: string) => {
        console.log("Selected official ID:", officialId, "Position:", position);
        onSelectOfficial(officialId, position);
        setInput('');
    };

    return (
        <div>
            <input type="text" value={input} onChange={(e) => setInput(e.target.value)} />
            {input && (
                <ul>
                    {filteredOfficials.map(official => (
                        <li
                        style={{ cursor: 'pointer', padding: '4px', border: '1px solid #ccc', borderRadius: '4px', marginBottom: '4px' }}
                        key={official.id} onClick={() => handleSelect(official.id)}>
                            {official.first} {official.last}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

interface SelectLocationDropdownProps {
    officialsList: Official[];
    onSelectLocation: (officialId: string, mat: number, location: string) => void;
    mat: number;
    location: string;
}

const SelectLocationDropdown: FC<SelectLocationDropdownProps> = ({ officialsList, onSelectLocation, mat, location }) => {
    const handleSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const officialId = e.target.value;
        onSelectLocation(officialId, mat, location);
    };

    return (
        <select onChange={handleSelect}>
            <option value="">Select Official</option>
            {officialsList.map(official => (
                <option key={official.id} value={official.id}>
                    {official.first} {official.last}
                </option>
            ))}
        </select>
    );
};

const OfficialsEvent: FC<OfficialsEventProps> = ({ eventId, numMats }) => {
    const [officials, setOfficials] = useState<Official[]>([]);
    const [allOfficials, setAllOfficials] = useState<Official[]>([]);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDashboardVisible, setIsDashboardVisible] = useState(false);



    useEffect(() => {
        const fetchOfficials = async () => {
            const db = getFirestore(app);
            const eventDocRef = doc(db, 'events', eventId);
            const officialsColRef = collection(eventDocRef, 'officials');

            try {
                const querySnapshot = await getDocs(officialsColRef);
                const officialsData: Official[] = [];
                querySnapshot.forEach((docSnap) => {
                    const officialData = docSnap.data() as Official;
                    officialsData.push({ ...officialData, id: docSnap.id });
                });
                setOfficials(officialsData);
            } catch (error) {
                console.error('Error fetching officials:', error);
            }
        };
        fetchOfficials();
    }, [eventId]);

    const renderTableForPosition = (position: string) => {
        const filteredOfficials = officials.filter(official => official.position === position);

        return (
            <table>
                <tbody>
                    {filteredOfficials.map(official => (
                        <tr key={official.id}>
                            <td>{official.first} {official.last}</td>
                            <td>{official.city}</td>
                            <td>
                                <button onClick={() => handleDeleteOfficial(official.id)}>Delete</button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    const handleDeleteOfficial = async (officialId: string) => {
        if (!window.confirm("Are you sure you want to delete this official?")) return;

        try {
            await deleteDoc(doc(getFirestore(app), 'events', eventId, 'officials', officialId));
            console.log("Official deleted successfully");

            // Remove the official from the officials list
            setOfficials(prevOfficials => prevOfficials.filter(official => official.id !== officialId));
        } catch (error) {
            console.error('Error deleting official:', error);
        }
    };

    useEffect(() => {
        
        
        const fetchAllOfficials = async () => {
            const db = getFirestore(app);
            try {
                // Fetch from officials_profile_json instead of officials_all collection
                const profilesDoc = await getDoc(doc(db, 'officials_profile_json', 'profiles'));
                if (!profilesDoc.exists()) {
                    console.log('No officials profile document found');
                    return;
                }
        
                const profileData = profilesDoc.data();
                const allOfficialsData: Official[] = profileData.officials || [];
        
                // Filter out any duplicates by ID
                const uniqueOfficials = allOfficialsData.reduce((acc: Official[], current: Official) => {
                    if (acc.every(item => item.id !== current.id)) {
                        return [...acc, current];
                    } else {
                        return acc;
                    }
                }, [] as Official[]);
        
                console.log('Officials fetched from profiles:', uniqueOfficials.length);
                setAllOfficials(uniqueOfficials);
            } catch (error) {
                console.error('Error fetching officials from profiles:', error);
            }
        };


        fetchAllOfficials();
    }, []);

    const SelectOfficialDropdown = ({ onSelectOfficial, officialsList }: { onSelectOfficial: (officialId: string) => void, officialsList: Official[] }) => {
        return (
            <select onChange={(e) => onSelectOfficial(e.target.value)}>
                <option value="">Select Official</option>
                {officialsList.map(official => (
                    <option
                    key={official.id} value={official.id}>
                        {official.first} {official.last}
                    </option>
                ))}
            </select>
        );
    };

    const handleAddRep = async (officialId: string) => {
        const officialToAdd = allOfficials.find(official => official.id === officialId);
        if (!officialToAdd) {
            console.error("Official not found in allOfficials list");
            return;
        }
    
        const newOfficial = { ...officialToAdd, position: 'Representative' };
    
        try {
            const db = getFirestore(app);
            const eventDocRef = doc(db, 'events', eventId);
            // Use setDoc with the profile ID instead of addDoc
            const officialDocRef = doc(eventDocRef, 'officials', officialId);
            await setDoc(officialDocRef, newOfficial);
            console.log("Representative added successfully with ID:", officialId);
    
            // Update the officials list using the same ID
            setOfficials(prevOfficials => [...prevOfficials, newOfficial]);
        } catch (error) {
            console.error('Error adding representative:', error);
        }
    };

    const handleAddOfficial = async (officialId: string, position: string) => {
        const officialToAdd = allOfficials.find(official => official.id === officialId);
        if (!officialToAdd) {
            console.error("Official not found in allOfficials list");
            return;
        }
    
        const newOfficial = { ...officialToAdd, position };
    
        try {
            const db = getFirestore(app);
            const eventDocRef = doc(db, 'events', eventId);
            // Use setDoc with the profile ID instead of addDoc
            const officialDocRef = doc(eventDocRef, 'officials', officialId);
            await setDoc(officialDocRef, newOfficial);
            console.log(`${position} added successfully with ID: ${officialId}`);
    
            // Update the officials list using the same ID
            setOfficials(prevOfficials => [...prevOfficials, newOfficial]);
        } catch (error) {
            console.error(`Error adding ${position.toLowerCase()}:`, error);
        }
    };

    const filterOfficialsByPosition = (position: string) => {
        return allOfficials.filter(official => official.position === position);
    };

    // ALL CODE FOR ASSIGNING OFFICIAL LOCATION AND MAT
    const handleAssignOfficial = async (officialId: string, mat: number, location: string) => {
        const db = getFirestore(app);
        const officialToAssign = officials.find(official => official.id === officialId);
        if (!officialToAssign) {
            console.error("Official not found in event's officials list");
            return;
        }

        const updatedOfficial = { ...officialToAssign, mat, location };

        try {
            // Unassign previous official from the same mat and location
            const prevOfficial = officials.find(
                official => official.location === location && official.mat === mat
            );

            if (prevOfficial) {
                await updateDoc(doc(db, 'events', eventId, 'officials', prevOfficial.id), {
                    mat: -1,
                    location: ""
                });
                setOfficials(prevOfficials =>
                    prevOfficials.map(official =>
                        official.id === prevOfficial.id ? { ...official, mat: -1, location: "" } : official
                    )
                );
            }

            const officialDocRef = doc(db, 'events', eventId, 'officials', officialId);
            await updateDoc(officialDocRef, { mat, location });
            console.log(`Assigned ${officialToAssign.first} ${officialToAssign.last} to mat ${mat} at ${location}`);

            // Update assigned locations in local state
            setOfficials(prevOfficials =>
                prevOfficials.map(official =>
                    official.id === officialId ? updatedOfficial : official
                )
            );
        } catch (error) {
            console.error(`Error assigning official to mat ${mat} at ${location}:`, error);
        }
    };

    const renderAssignedOfficial = (mat: number, location: string) => {
        const official = officials.find(official => official.location === location && official.mat === mat);
        return official ? `${official.first} ${official.last}` : `Select ${location}`;
    };

    const renderMat = (matNumber: number) => (
        <div key={matNumber}>
            <h3>Mat {matNumber}</h3>
            <div style={{ height: '400px', paddingTop: '20px', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', width:'95vw', overflowX:'auto' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <div className='officialMat'>
                        <p>Judge 1</p>
                        {renderAssignedOfficial(matNumber, 'judge1')}
                        <SelectLocationDropdown onSelectLocation={handleAssignOfficial} officialsList={officials} mat={matNumber} location="judge1" />
                    </div>
                    <div className='officialMat'>
                        <p>Judge 2</p>
                        {renderAssignedOfficial(matNumber, 'judge2')}
                        <SelectLocationDropdown onSelectLocation={handleAssignOfficial} officialsList={officials} mat={matNumber} location="judge2" />
                    </div>
                    <div className='officialMat'>
                        <p>Judge 3</p>
                        {renderAssignedOfficial(matNumber, 'judge3')}
                        <SelectLocationDropdown onSelectLocation={handleAssignOfficial} officialsList={officials} mat={matNumber} location="judge3" />
                    </div>
                </div>

                <div className='refMat'>
                    {renderAssignedOfficial(matNumber, 'referee')}
                    <SelectLocationDropdown onSelectLocation={handleAssignOfficial} officialsList={officials} mat={matNumber} location="referee" />
                </div>

            </div>
        </div>
    );

    return (
        <div>
        <button 
            onClick={() => setIsDashboardVisible(!isDashboardVisible)}
            className="w-full py-2 px-4 mb-4 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
        >
            {isDashboardVisible ? 'Hide Officials Dashboard' : 'Show Officials Dashboard'}
        </button>

        <div className={`transition-all duration-300 ${isDashboardVisible ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
            <div>
                <h3>Representative</h3>
                <SelectOfficialDropdown
                    onSelectOfficial={handleAddRep}
                    officialsList={filterOfficialsByPosition('Representative')}
                />
                {renderTableForPosition('Representative')}
            </div>

      

                <div >
                    <h3>Referees</h3>
                    <Autocomplete onSelectOfficial={(officialId) => handleAddOfficial(officialId, "Referee")} officialsList={allOfficials} position="Referee" />
                    {renderTableForPosition('Referee')}
                </div>

                <div >
                    <h3>Judges</h3>
                    <Autocomplete onSelectOfficial={(officialId) => handleAddOfficial(officialId, "Judge")} officialsList={allOfficials} position="Judge" />
                    {renderTableForPosition('Judge')}
                </div>

                <div >
                    <h3>Medical</h3>
                    <Autocomplete onSelectOfficial={(officialId) => handleAddOfficial(officialId, "Medical")} officialsList={allOfficials} position="Medical" />
                    {renderTableForPosition('Medical')}
                </div>

          


            <div >
                <Link href="/admin/officials">
                    Add New Official
                </Link>
            </div>

            <div>
               
                    Number of Mats: {numMats}
                    
                
            </div>

            <div className='matDisplays'>
                {[...Array(numMats)].map((_, i) => renderMat(i + 1))}
            </div>

            <button onClick={() => setIsModalOpen(true)}>Share Image</button>

            <OfficialLayoutModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                officials={officials}
                matCount={numMats}
            />
        </div>
        </div>
    );
};

export default OfficialsEvent;