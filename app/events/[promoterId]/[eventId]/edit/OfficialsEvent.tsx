'use client';

import React, { FC, useEffect, useState } from 'react';
import { deleteDoc, setDoc, getFirestore, collection, getDocs, doc, updateDoc, FirestoreError } from 'firebase/firestore';
import { app } from '@/lib/firebase_techbouts/config';
import { Official } from '@/utils/types';
import Link from 'next/link';
import { fetchOfficials } from '@/utils/officials/fetchOfficials';

import OfficialLayoutModal from './OfficialLayoutModal';
import OfficialBankModal from './OfficialBankModal';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";

interface OfficialsEventProps {
    eventId: string;
    numMats: number;
    promoterId: string;
    sanctioning: string;
}

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

const OfficialsEvent: FC<OfficialsEventProps> = ({ eventId, numMats, promoterId }) => {
    const [officials, setOfficials] = useState<Official[]>([]);
    const [allOfficials, setAllOfficials] = useState<Official[]>([]);
    const [isLayoutModalOpen, setIsLayoutModalOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [loadingError, setLoadingError] = useState<string | null>(null);
    
    // State for the OfficialBankModal
    const [isOfficialBankModalOpen, setIsOfficialBankModalOpen] = useState(false);
    const [currentPosition, setCurrentPosition] = useState<string>('');

    const [openSections, setOpenSections] = useState({
        officials: false,
      });
    
      const toggleSection = (section: keyof typeof openSections) => {
        setOpenSections(prev => ({
          ...prev,
          [section]: !prev[section]
        }));
      };



    // Fetch officials assigned to this event
    useEffect(() => {
        const fetchEventOfficials = async () => {
            setIsLoading(true);
            setLoadingError(null);
            
            const db = getFirestore(app);
            const eventDocRef = doc(db, 'events', 'promotions', promoterId, eventId);
            const officialsColRef = collection(eventDocRef, 'officials');

            try {
                const querySnapshot = await getDocs(officialsColRef);
                const officialsData: Official[] = [];
                querySnapshot.forEach((docSnap) => {
                    const officialData = docSnap.data() as Official;
                    officialsData.push({ ...officialData, id: docSnap.id });
                });
                setOfficials(officialsData);
                setIsLoading(false);
            } catch (error) {
                const firestoreError = error as FirestoreError;
                console.error('Error fetching event officials:', firestoreError);
                setLoadingError(`Failed to load event officials: ${firestoreError.message || 'Unknown error'}`);
                setIsLoading(false);
            }
        };
        
        fetchEventOfficials();
    }, [eventId]);

    // Fetch all available officials - for use in the OfficialBankModal
    useEffect(() => {
        const loadAllOfficials = async () => {
            try {
                console.log('Fetching officials from utility function...');
                const officials = await fetchOfficials();
                console.log(`Successfully fetched ${officials.length} officials`);
                setAllOfficials(officials);
            } catch (error) {
                const firestoreError = error as FirestoreError;
                console.error('Error fetching all officials:', firestoreError);
                // Still continue - the modal will just show an empty state
                setAllOfficials([]);
            }
        };

        loadAllOfficials();
    }, []);

    const renderTableForPosition = (position: string) => {
        const filteredOfficials = officials.filter(official => official.position === position);

        return (
            <table className="min-w-full divide-y divide-gray-200 mt-2">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {filteredOfficials.length > 0 ? (
                        filteredOfficials.map(official => (
                            <tr key={official.id} className="hover:bg-gray-50">
                                <td className="px-6 py-4 whitespace-nowrap">{official.first} {official.last}</td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    {official.city && official.state ? `${official.city}, ${official.state}` : 'N/A'}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap">
                                    <button 
                                        onClick={() => handleDeleteOfficial(official.id)}
                                        className="text-red-600 hover:text-red-800"
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td colSpan={3} className="px-6 py-4 text-center text-gray-500">
                                No {position.toLowerCase()} officials added yet
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        );
    };

    const handleDeleteOfficial = async (officialId: string) => {
        if (!window.confirm("Are you sure you want to delete this official from this event?")) return;

        try {
            await deleteDoc(doc(getFirestore(app), 'events', 'promotions', promoterId, eventId, 'officials', officialId));
            console.log("Official deleted successfully");

            // Remove the official from the officials list
            setOfficials(prevOfficials => prevOfficials.filter(official => official.id !== officialId));
        } catch (error) {
            console.error('Error deleting official:', error);
            alert('Failed to delete official. Please try again.');
        }
    };

    const handleAddOfficial = async (officialId: string, position: string) => {
        const officialToAdd = allOfficials.find(official => official.id === officialId);
        if (!officialToAdd) {
            console.error("Official not found in allOfficials list");
            alert('Could not find the selected official in the database.');
            return;
        }
    
        // Check if this official is already assigned to this event with this position
        const existingOfficial = officials.find(o => o.id === officialId && o.position === position);
        if (existingOfficial) {
            alert(`This official is already assigned as a ${position}.`);
            return;
        }
    
        const newOfficial = { ...officialToAdd, position };
    
        try {
            const db = getFirestore(app);
            const eventDocRef = doc(db, 'events', 'promotions', promoterId, eventId);
            // Use setDoc with the profile ID instead of addDoc
            const officialDocRef = doc(eventDocRef, 'officials', officialId);
            await setDoc(officialDocRef, newOfficial);
            console.log(`${position} added successfully with ID: ${officialId}`);
    
            // Update the officials list using the same ID
            setOfficials(prevOfficials => [...prevOfficials, newOfficial]);
        } catch (error) {
            console.error(`Error adding ${position.toLowerCase()}:`, error);
            alert(`Failed to add ${position.toLowerCase()}. Please try again.`);
        }
    };

    const openOfficialBankModal = (position: string) => {
        setCurrentPosition(position);
        setIsOfficialBankModalOpen(true);
    };

    // ALL CODE FOR ASSIGNING OFFICIAL LOCATION AND MAT
    const handleAssignOfficial = async (officialId: string, mat: number, location: string) => {
        if (!officialId) return; // Don't do anything if no official is selected
        
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
                official => official.location === location && official.mat === mat && official.id !== officialId
            );

            if (prevOfficial) {
                await updateDoc(doc(db, 'events', 'promotions', promoterId, eventId, 'officials', prevOfficial.id), {
                    mat: -1,
                    location: ""
                });
                setOfficials(prevOfficials =>
                    prevOfficials.map(official =>
                        official.id === prevOfficial.id ? { ...official, mat: -1, location: "" } : official
                    )
                );
            }

            const officialDocRef = doc(db, 'events', 'promotions', promoterId, eventId, 'officials', officialId);
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
        <div key={matNumber} className="mb-8 border p-4 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Mat {matNumber}</h3>
            <div className="flex flex-col items-center space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                    <div className="border p-3 rounded text-center">
                        <p className="font-medium mb-2">Judge 1</p>
                        <p className="mb-2">{renderAssignedOfficial(matNumber, 'judge1')}</p>
                        <SelectLocationDropdown 
                            onSelectLocation={handleAssignOfficial} 
                            officialsList={officials.filter(o => o.position === 'Judge')} 
                            mat={matNumber} 
                            location="judge1" 
                        />
                    </div>
                    <div className="border p-3 rounded text-center">
                        <p className="font-medium mb-2">Judge 2</p>
                        <p className="mb-2">{renderAssignedOfficial(matNumber, 'judge2')}</p>
                        <SelectLocationDropdown 
                            onSelectLocation={handleAssignOfficial} 
                            officialsList={officials.filter(o => o.position === 'Judge')} 
                            mat={matNumber} 
                            location="judge2" 
                        />
                    </div>
                    <div className="border p-3 rounded text-center">
                        <p className="font-medium mb-2">Judge 3</p>
                        <p className="mb-2">{renderAssignedOfficial(matNumber, 'judge3')}</p>
                        <SelectLocationDropdown 
                            onSelectLocation={handleAssignOfficial} 
                            officialsList={officials.filter(o => o.position === 'Judge')} 
                            mat={matNumber} 
                            location="judge3" 
                        />
                    </div>
                </div>

                <div className="border p-3 rounded text-center w-full sm:w-1/3">
                    <p className="font-medium mb-2">Referee</p>
                    <p className="mb-2">{renderAssignedOfficial(matNumber, 'referee')}</p>
                    <SelectLocationDropdown 
                        onSelectLocation={handleAssignOfficial} 
                        officialsList={officials.filter(o => o.position === 'Referee')} 
                        mat={matNumber} 
                        location="referee" 
                    />
                </div>
            </div>
        </div>
    );

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-8">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="ml-3">Loading officials...</span>
            </div>
        );
    }

    if (loadingError) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded mb-4 text-red-700">
                <p className="font-bold">Error loading officials:</p>
                <p>{loadingError}</p>
                <button 
                    onClick={() => window.location.reload()}
                    className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <Collapsible
        open={openSections.officials}
        onOpenChange={() => toggleSection('officials')}
        className="w-full border rounded-lg overflow-hidden"
      >
        <CollapsibleTrigger className="flex items-center justify-between w-full p-4 bg-gray-50 hover:bg-gray-100">
          <h2 className="text-xl font-semibold">Officials</h2>
          {openSections.officials ? <ChevronDown className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
        </CollapsibleTrigger>
        <CollapsibleContent className="p-4 bg-white">

            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Representative</h3>
                            <button 
                                onClick={() => openOfficialBankModal('Representative')}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Select Official
                            </button>
                        </div>
                        {renderTableForPosition('Representative')}
                    </div>

                    <div className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Referees</h3>
                            <button 
                                onClick={() => openOfficialBankModal('Referee')}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Select Official
                            </button>
                        </div>
                        {renderTableForPosition('Referee')}
                    </div>

                    <div className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Judges</h3>
                            <button 
                                onClick={() => openOfficialBankModal('Judge')}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Select Official
                            </button>
                        </div>
                        {renderTableForPosition('Judge')}
                    </div>

                    <div className="border p-4 rounded-lg">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-semibold">Medical</h3>
                            <button 
                                onClick={() => openOfficialBankModal('Medical')}
                                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                            >
                                Select Official
                            </button>
                        </div>
                        {renderTableForPosition('Medical')}
                    </div>
                </div>

                <div className="mb-6">
                    <Link 
                        href="/officials/apply" 
                        className="inline-block px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                    >
                        Add New Official
                    </Link>
                </div>

                <div className="mb-6 p-4 bg-gray-100 rounded-lg">
                    <p className="font-medium">Number of Mats: {numMats}</p>
                </div>

                <div className="mb-6">
                    <h2 className="text-xl font-bold mb-4">Mat Assignments</h2>
                    <div className="space-y-6">
                        {[...Array(numMats)].map((_, i) => renderMat(i + 1))}
                    </div>
                </div>

                <div className="text-center mb-6">
                    <button 
                        onClick={() => setIsLayoutModalOpen(true)}
                        className="px-6 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                    >
                        Share Image
                    </button>
                </div>

                {/* Official Bank Modal */}
                <OfficialBankModal
                    isOpen={isOfficialBankModalOpen}
                    onClose={() => setIsOfficialBankModalOpen(false)}
                    officialsList={allOfficials}
                    onSelectOfficial={handleAddOfficial}
                    position={currentPosition}
                />

                {/* Layout Modal for sharing */}
                <OfficialLayoutModal
                    isOpen={isLayoutModalOpen}
                    onClose={() => setIsLayoutModalOpen(false)}
                    officials={officials}
                    matCount={numMats}
                />
            </div>
        </CollapsibleContent>
    </Collapsible>
    );
};

export default OfficialsEvent;