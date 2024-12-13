"use client";

import React, { useState, useEffect } from 'react';
import { collection, doc, getDoc } from 'firebase/firestore';
import { PuristFighter } from '../utils/types';
import { app } from '../utils/firebase';
import { getFirestore } from 'firebase/firestore';
import AdminHeader from '../../components/headers/AdminHeader';
import buttons from '../../styles/buttons.module.css';

const db = getFirestore(app);

const FighterDatabase: React.FC = () => {
    const [fighters, setFighters] = useState<PuristFighter[]>([]);
    const [filter, setFilter] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [genderFilter, setGenderFilter] = useState('all');
    const [isLoading, setIsLoading] = useState(true);

    const defaultPhotoUrl = "https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/Fighter_Photos%2FIcon_grey.png?alt=media&token=8e8beffa-a6b3-4329-93fc-db64b7045c0a";

    const fetchFighters = async () => {
        try {
            setIsLoading(true);
            const fighterDatabaseRef = doc(db, 'fighter_database', 'fighters');
            const fighterSnapshot = await getDoc(fighterDatabaseRef);

            if (fighterSnapshot.exists()) {
                const data = fighterSnapshot.data();
                const fightersArray = Object.values(data) as PuristFighter[];
                setFighters(fightersArray);
            }
        } catch (error) {
            console.error('Error fetching fighters:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchFighters();
    }, []);

    const filteredFighters = fighters.filter(fighter => {
        const search = filter.toLowerCase();
        const matchesGender = genderFilter === 'all' || fighter.gender.toLowerCase() === genderFilter;
        const matchesSearch = (() => {
            switch (filterType) {
                case 'name':
                    return fighter.first.toLowerCase().includes(search) || fighter.last.toLowerCase().includes(search);
                case 'gym':
                    return fighter.gym.toLowerCase().includes(search);
                case 'weight':
                    return fighter.weightclass.toString().includes(search);
                case 'city':
                    return fighter.city?.toLowerCase().includes(search);
                case 'state':
                    return fighter.state?.toLowerCase().includes(search);
                case 'age':
                    return fighter.age.toString().includes(search);
                default:
                    return fighter.first.toLowerCase().includes(search) ||
                        fighter.last.toLowerCase().includes(search) ||
                        fighter.gym.toLowerCase().includes(search) ||
                        fighter.weightclass.toString().includes(search) ||
                        (fighter.city?.toLowerCase().includes(search) || '') ||
                        (fighter.state?.toLowerCase().includes(search) || '');
            }
        })();
        return matchesSearch && matchesGender;
    });

    if (isLoading) {
        return (
            <div className="database_page">
                <AdminHeader />
                <div className="loading">Loading fighters...</div>
            </div>
        );
    }

    return (
        <div className='database_page'>
            <AdminHeader />

            <h2>Fighter Database (JSON)</h2>
            <p>This page displays the fighters data from the JSON database</p>

            <div style={{ display: 'flex', justifyContent: 'space-evenly', margin: '20px' }}>
                <select 
                    value={genderFilter} 
                    onChange={e => setGenderFilter(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All Genders</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                </select>

                <select 
                    value={filterType} 
                    onChange={e => setFilterType(e.target.value)}
                    className="filter-select"
                >
                    <option value="all">All</option>
                    <option value="name">Name</option>
                    <option value="gym">Gym</option>
                    <option value="weight">Weight Class</option>
                    <option value="city">City</option>
                    <option value="state">State</option>
                    <option value="age">Age</option>
                </select>

                <input
                    type="text"
                    placeholder="Filter fighters..."
                    value={filter}
                    onChange={e => setFilter(e.target.value)}
                    className="filter-input"
                    style={{ marginBottom: '10px' }}
                />

                <button 
                    className={buttons.addFighter}
                    onClick={fetchFighters}
                >
                    Refresh Data again
                </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
                <table>
                    <thead>
                        <tr>
                            <th>Photo</th>
                            <th>First Name</th>
                            <th>Last Name</th>
                            <th>Weight</th>
                            <th>Gym</th>
                            <th>Age</th>
                            <th>Gender</th>
                            <th>Wins</th>
                            <th>Losses</th>
                            <th>City</th>
                            <th>State</th>
                            <th>MTP ID</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFighters.map(fighter => (
                            <tr key={fighter.mtp_id}>
                                <td>
                                    <img 
                                        src={fighter.photo || defaultPhotoUrl} 
                                        onError={(e) => { e.currentTarget.src = defaultPhotoUrl; }} 
                                        alt={`${fighter.first} ${fighter.last}`} 
                                        style={{ width: '50px', height: '50px', objectFit: 'cover' }}
                                    />
                                </td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.first}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.last}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.weightclass}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.gym}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.age}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.gender}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.win}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.loss}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.city}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.state}</td>
                                <td style={{ border: '1px solid black', borderLeft:'none', borderRight:'none' }}>{fighter.mtp_id}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default FighterDatabase;