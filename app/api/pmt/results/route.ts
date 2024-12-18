import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/utils/firebase';
import { NextResponse } from 'next/server';

interface Fighter {
    gender?: string;
    age?: number;
    result?: string;
    pmt_id?: string;
    first?: string;
    last?: string;
    gym?: string;
    event_name?: string;
    event_date?: string;
    event_city?: string;
    event_state?: string;
    fighters?: Fighter[]; 
    mat?: number;
    bout?: number;
}

interface EventLocation {
    event_name: string;
    date: string;
    location: string;
}

interface AthleteWin {
    name: string;
    wins: number;
    events: EventLocation[];
}

interface GymStats {
    name: string;
    wins: number;
    states: string[];
}

interface ProcessedData {
    type: 'complete';
    genderDistribution: Array<{ name: string; value: number }>;
    ageGenderDistribution: Array<{ name: string; value: number }>;
    topAthletes: AthleteWin[];
    topGyms: GymStats[];
    totalBouts: number;
    eventStats: {
        stateDistribution: Record<string, number>;
        athleteWinsByState: Record<string, AthleteWin[]>;
        gymWinsByState: Record<string, GymStats[]>;
    };
}

interface ProgressData {
    type: 'progress';
    processedAthletes: number;
    eventName: string;
}

interface ErrorData {
    type: 'error';
    message: string;
}

type StreamData = ProcessedData | ProgressData | ErrorData;

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const years = searchParams.get('years')?.split(',') || [];

    if (years.length === 0) {
        return NextResponse.json({ error: 'No years selected' }, { status: 400 });
    }

    const encoder = new TextEncoder();
    const stream = new TransformStream();
    const writer = stream.writable.getWriter();

    const writeChunk = async (data: StreamData) => {
        await writer.write(encoder.encode(JSON.stringify(data) + '\n'));
    };

    (async () => {
        try {
            const eventsRef = collection(db, 'events');
            const eventsSnapshot = await getDocs(eventsRef);
            const allFighters: Fighter[] = [];
            let processedAthletes = 0;

            for (const eventDoc of eventsSnapshot.docs) {
                const eventData = eventDoc.data();
                const eventYear = eventData.date?.substring(0, 4);

                if (years.includes(eventYear)) {
                    const resultsRef = collection(db, 'events', eventDoc.id, 'resultsJson');
                    const resultsSnapshot = await getDocs(resultsRef);

                    for (const doc of resultsSnapshot.docs) {
                        const data = doc.data();
                        if (data.fighters && Array.isArray(data.fighters)) {
                            const enhancedFighters = data.fighters.map((fighter: Fighter) => ({
                                ...fighter,
                                event_name: eventData.event_name,
                                event_date: eventData.date,
                                event_city: eventData.city,
                                event_state: eventData.state
                            }));
                            
                            allFighters.push(...enhancedFighters);
                            processedAthletes += enhancedFighters.length;
                            
                            await writeChunk({
                                type: 'progress',
                                processedAthletes,
                                eventName: eventData.event_name || 'Unknown Event'
                            });
                        }
                    }
                }
            }

            const finalData = processAthleteData(allFighters);
            await writeChunk({
                type: 'complete',
                ...finalData
            });

            await writer.close();
        } catch (error) {
            console.error('Error fetching data:', error);
            await writeChunk({
                type: 'error',
                message: 'Failed to fetch data'
            });
            await writer.close();
        }
    })();

    return new Response(stream.readable, {
        headers: {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
        },
    });
}

function processAthleteData(fighters: Fighter[]) {
    const boutMap = new Map<string, Fighter[]>();
    fighters.forEach(fighter => {
        if (fighter.mat && fighter.bout) {
            const boutKey = `${fighter.event_name}_mat${fighter.mat}_bout${fighter.bout}`;
            const existingBout = boutMap.get(boutKey) || [];
            existingBout.push(fighter);
            boutMap.set(boutKey, existingBout);
        }
    });

    const athleteStateWins: Record<string, Record<string, AthleteWin>> = {};
    const gymStateWins: Record<string, Record<string, { wins: number, eventLocations: Set<string> }>> = {};
    
    fighters.forEach(fighter => {
        if (fighter.event_state) {
            if (!athleteStateWins[fighter.event_state]) {
                athleteStateWins[fighter.event_state] = {};
            }
            if (!gymStateWins[fighter.event_state]) {
                gymStateWins[fighter.event_state] = {};
            }
        }
    });

    fighters.forEach(fighter => {
        if (fighter.result === 'W' && fighter.pmt_id && fighter.mat && fighter.bout && fighter.event_state) {
            const boutKey = `${fighter.event_name}_mat${fighter.mat}_bout${fighter.bout}`;
            const bout = boutMap.get(boutKey);
            
            if (bout && bout.length === 2) {
                if (!athleteStateWins[fighter.event_state][fighter.pmt_id]) {
                    athleteStateWins[fighter.event_state][fighter.pmt_id] = {
                        name: `${fighter.first} ${fighter.last}`.trim() || 'Unknown',
                        wins: 0,
                        events: []
                    };
                }
                athleteStateWins[fighter.event_state][fighter.pmt_id].wins += 1;
                athleteStateWins[fighter.event_state][fighter.pmt_id].events.push({
                    event_name: fighter.event_name || 'Unknown Event',
                    date: fighter.event_date || 'Unknown Date',
                    location: `${fighter.event_city || 'Unknown City'}, ${fighter.event_state}`
                });

                const gym = fighter.gym || 'Unaffiliated';
                if (!gymStateWins[fighter.event_state][gym]) {
                    gymStateWins[fighter.event_state][gym] = {
                        wins: 0,
                        eventLocations: new Set([fighter.event_state])
                    };
                }
                gymStateWins[fighter.event_state][gym].wins += 1;
            }
        }
    });

    const stateDistribution: Record<string, number> = {};
    boutMap.forEach((boutFighters) => {
        if (boutFighters.length === 2 && boutFighters[0]?.event_state) {
            stateDistribution[boutFighters[0].event_state] = 
                (stateDistribution[boutFighters[0].event_state] || 0) + 1;
        }
    });

    return {
        genderDistribution: processGenderDistribution(fighters),
        ageGenderDistribution: processAgeGenderDistribution(fighters),
        topAthletes: Object.values(athleteStateWins)
            .flatMap(stateAthletes => Object.values(stateAthletes))
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 10),
        topGyms: Object.values(gymStateWins)
            .flatMap(stateGyms => 
                Object.entries(stateGyms).map(([name, data]) => ({
                    name,
                    wins: data.wins,
                    states: Array.from(data.eventLocations)
                }))
            )
            .sort((a, b) => b.wins - a.wins)
            .slice(0, 10),
        totalBouts: boutMap.size,
        eventStats: {
            stateDistribution,
            athleteWinsByState: Object.fromEntries(
                Object.entries(athleteStateWins).map(([state, athletes]) => [
                    state,
                    Object.values(athletes)
                        .sort((a, b) => b.wins - a.wins)
                        .slice(0, 10)
                ])
            ),
            gymWinsByState: Object.fromEntries(
                Object.entries(gymStateWins).map(([state, gyms]) => [
                    state,
                    Object.entries(gyms)
                        .map(([name, data]) => ({
                            name,
                            wins: data.wins,
                            states: Array.from(data.eventLocations)
                        }))
                        .sort((a, b) => b.wins - a.wins)
                        .slice(0, 10)
                ])
            )
        }
    };
}

function processGenderDistribution(fighters: Fighter[]) {
    const genderCounts = fighters.reduce((acc, fighter) => {
        const gender = fighter.gender || 'Not Specified';
        acc[gender] = (acc[gender] || 0) + 1;
        return acc;
    }, {} as Record<string, number>);

    return [
        { name: 'Male', value: genderCounts['MALE'] || 0 },
        { name: 'Female', value: genderCounts['FEMALE'] || 0 },
        { name: 'Not Specified', value: genderCounts['Not Specified'] || 0 }
    ].filter(item => item.value > 0);
}

function processAgeGenderDistribution(fighters: Fighter[]) {
    const counts = fighters.reduce((acc, fighter) => {
        if (fighter.age && fighter.gender && fighter.gender !== 'Not Specified') {
            const gender = fighter.gender.toUpperCase();
            const age = fighter.age;
            
            if (age > 0) {
                if (gender === 'MALE') {
                    if (age < 18) acc.boys += 1;
                    else acc.men += 1;
                } else if (gender === 'FEMALE') {
                    if (age < 18) acc.girls += 1;
                    else acc.women += 1;
                }
            }
        }
        return acc;
    }, { boys: 0, girls: 0, men: 0, women: 0 });

    return [
        { name: 'Boys', value: counts.boys },
        { name: 'Girls', value: counts.girls },
        { name: 'Men', value: counts.men },
        { name: 'Women', value: counts.women }
    ].filter(item => item.value > 0);
}