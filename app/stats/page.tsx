// app/stats/page.tsx
"use client";

import React, { useState } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer
} from 'recharts';
import TerminalLogs from '../../components/TerminalLogs';
import MyPieChart from './MyPieChart';
import Image from 'next/image';


interface ProgressData {
    type: 'progress';
    eventName: string;
    processedAthletes: number;
}

interface CompleteData {
    type: 'complete';
    genderDistribution: DistributionItem[];
    ageGenderDistribution: DistributionItem[];
    topAthletes: Athlete[];
    topGyms: Gym[];
    totalBouts: number;
    eventStats: EventStats;
    uniqueAthletesCount: number;

}

interface ErrorData {
    type: 'error';
    message: string;
}

// Union type for all possible stream data types
type StreamData = ProgressData | CompleteData | ErrorData;



interface StateMapProps {
    stateDistribution: Record<string, number>;
    selectedStates: string[];
    onStateToggle: (state: string) => void;
  }



  const StateMap: React.FC<StateMapProps> = ({
    stateDistribution,
    selectedStates,
    onStateToggle,
  }) => {
    // Define state files with proper typing
    const stateFiles: Record<string, string> = {
      'CA': 'california',
      'TX': 'texas',
      'CO': 'CO',
      'NV': 'NV',
      'OK': 'OK',
      'WY': 'WY'
    };
  
    // Create type guard to check if state exists in stateFiles
    const isValidState = (state: string): state is keyof typeof stateFiles => {
      return state in stateFiles;
    };
  
    return (
      <div className="bg-white rounded-lg shadow p-6 mb-8 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-gray-800 mb-6 text-center">
          Bouts by State
        </h3>
        <div className="flex flex-wrap justify-center gap-2">
          {Object.entries(stateDistribution).map(([state, bouts]) => {
            // Skip rendering if state doesn't have an associated file
            if (!isValidState(state)) return null;
            
            return (
                <div key={state} 
                onClick={() => onStateToggle(state)} 
                className={`relative cursor-pointer group transition-transform hover:scale-105 flex items-center justify-center ${
                  selectedStates.includes(state) 
                    ? 'shadow-lg ring-2 ring-blue-500 rounded-lg w-[120px]' 
                    : 'opacity-75'
                }`}
              >
                <div className="relative w-[130px] flex items-center justify-center h-[140px]">
                  {/* State image */}
                  <Image
                    src={`/images/states/${stateFiles[state]}.svg`}
                    alt={`${state} state`}
                    width={90}
                    height={90}
                    className={`transition-all duration-200 ${
                      selectedStates.includes(state) ? 'drop-shadow-lg' : ''
                    }`}
                  />
                  {/* State abbreviation */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-bold text-gray-700 text-lg">
                      {bouts.toLocaleString()} bouts
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  


interface DistributionItem {
    name: string;
    value: number;
}

interface AthleteEvent {
    event_name: string;
    date: string;
    location: string;
}

interface Athlete {
    name: string;
    wins: number;
    events?: AthleteEvent[];
    pmt_id?: string;
}

interface Gym {
    name: string;
    wins: number;
    states?: string[];
}

interface EventStats {
    stateDistribution: Record<string, number>;
    athleteWinsByState: Record<string, Athlete[]>;
    gymWinsByState: Record<string, Gym[]>;
}

interface Stats {
    genderDistribution: DistributionItem[];
    ageGenderDistribution: DistributionItem[];
    topAthletes: Athlete[];
    topGyms: Gym[];
    totalBouts: number;
    uniqueAthletesCount: number;
    eventStats: EventStats;
}

const StatisticsDashboard = () => {
    const [selectedYears, setSelectedYears] = useState<Record<string, boolean>>({
        '2022': false,
        '2023': false,
        '2024': false
    });
    const [selectedStates, setSelectedStates] = useState<string[]>(['CA', 'TX', 'CO', 'NV', 'OK', 'WY']);    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(true);

const [stats, setStats] = useState<Stats>({
    genderDistribution: [],
    ageGenderDistribution: [],
    topAthletes: [],
    topGyms: [],
    totalBouts: 0,
    uniqueAthletesCount: 0, // This will hold the total count
    eventStats: {
        stateDistribution: {},
        athleteWinsByState: {},
        gymWinsByState: {}
    }
});

    const addLog = (message: string) => {
        setDebugLogs(prev => {
            const newLogs = [...prev, `[${new Date().toLocaleTimeString()}] ${message}`];
            return newLogs.slice(-100);
        });
    };

    const handleYearToggle = (year: string) => {
        setSelectedYears(prev => ({
            ...prev,
            [year]: !prev[year]
        }));
    };

    const handleStateToggle = (state: string) => {
        setSelectedStates(prev => 
            prev.includes(state)
                ? prev.filter(s => s !== state)
                : [...prev, state]
        );
    };



 const beginAnalysis = async () => {
    const selectedYearsList = Object.entries(selectedYears)
        .filter(([, isSelected]) => isSelected)
        .map(([year]) => year);

    if (selectedYearsList.length === 0) {
        alert('Please select at least one year to analyze');
        return;
    }

    setIsAnalyzing(true);
    setDebugLogs([]);
    addLog('Starting analysis...');

    try {
        const response = await fetch(`/api/pmt/results?years=${selectedYearsList.join(',')}`);
        if (!response.ok) throw new Error('Failed to fetch data');

        const reader = response.body?.getReader();
        if (!reader) throw new Error('Stream not available');

        let buffer = ''; // Buffer for incomplete chunks

        while (true) {
            const { done, value } = await reader.read();
            
            if (done) {
                // Process any remaining data in buffer
                if (buffer.trim()) {
                    try {
                        const data = JSON.parse(buffer.trim()) as StreamData;
                        handleStreamData(data);
                    } catch (error) {
                        console.error('Error parsing final buffer:', error);
                        const errorMessage = error instanceof Error 
                            ? error.message 
                            : 'Unknown parsing error';
                        addLog(`Error parsing data: ${errorMessage}`);
                    }
                }
                break;
            }

            // Decode the chunk and add to buffer
            const chunk = new TextDecoder().decode(value);
            buffer += chunk;

            // Split by newlines and process complete chunks
            const lines = buffer.split('\n');
            
            // Keep the last potentially incomplete chunk in buffer
            buffer = lines.pop() || '';

            // Process complete chunks
            for (const line of lines) {
                if (line.trim()) {
                    try {
                        const data = JSON.parse(line.trim()) as StreamData;
                        handleStreamData(data);
                    } catch (error) {
                        console.error('Error parsing chunk:', error);
                        const errorMessage = error instanceof Error 
                            ? error.message 
                            : 'Unknown parsing error';
                        addLog(`Error parsing data: ${errorMessage}`);
                    }
                }
            }
        }
    } catch (error) {
        console.error('Error during analysis:', error);
        const errorMessage = error instanceof Error 
            ? error.message 
            : 'Unknown error occurred';
        addLog(`ERROR: ${errorMessage}`);
    } finally {
        setIsAnalyzing(false);
    }
};


    
const handleStreamData = (data: StreamData) => {
    console.log('Received data from API:', data); // <-- Log full response from API

    switch (data.type) {
        case 'progress':
            addLog(`Processing ${data.eventName}: ${data.processedAthletes} athletes processed`);
            break;

        case 'complete':
            setStats(prevStats => {
                const newStats = { ...prevStats };

                if (data.genderDistribution) {
                    newStats.genderDistribution = data.genderDistribution;
                }
                if (data.ageGenderDistribution) {
                    newStats.ageGenderDistribution = data.ageGenderDistribution;
                }
                if (data.topAthletes) {
                    newStats.topAthletes = data.topAthletes;
                }
                if (data.topGyms) {
                    newStats.topGyms = data.topGyms;
                }
                if (data.totalBouts) {
                    newStats.totalBouts = data.totalBouts;
                }
                if (data.uniqueAthletesCount) {
                    newStats.uniqueAthletesCount = data.uniqueAthletesCount; // <-- Update the count
                    console.log('Updated uniqueAthletesCount:', data.uniqueAthletesCount); // <-- Log updated count
                }

                if (data.eventStats) {
                    newStats.eventStats = {
                        ...newStats.eventStats,
                        stateDistribution: {
                            ...newStats.eventStats.stateDistribution,
                            ...data.eventStats.stateDistribution
                        },
                        athleteWinsByState: {
                            ...newStats.eventStats.athleteWinsByState,
                            ...data.eventStats.athleteWinsByState
                        },
                        gymWinsByState: {
                            ...newStats.eventStats.gymWinsByState,
                            ...data.eventStats.gymWinsByState
                        }
                    };
                }

                // Log updated stats
                console.log('Updated Stats:', newStats); // <-- Log entire stats object

                // Update available states
                if (data.eventStats?.stateDistribution) {
                    const states = Object.keys(newStats.eventStats.stateDistribution);
                    setAvailableStates(states.sort());
                }

                return newStats;
            });
            break;

        case 'error':
            console.error('Error in stream data:', data.message);
            addLog(`ERROR: ${data.message}`);
            break;

        default:
            const _exhaustiveCheck: never = data;
            console.warn('Unknown data type received:', _exhaustiveCheck);
    }
};






const getUniqueAthleteCount = (athletesByState: Record<string, Athlete[]>): number => {
    const uniquePmtIds = new Set();
    Object.values(athletesByState).forEach(athletes => {
        athletes.forEach(athlete => {
            if (athlete.pmt_id) {
                uniquePmtIds.add(athlete.pmt_id);
            }
        });
    });
    return uniquePmtIds.size;
};




const filteredStats = React.useMemo(() => {
    if (selectedStates.length === 0) return stats;

    // Filter top athletes and gyms for selected states
    const stateAthletes = selectedStates.flatMap(state => 
        stats.eventStats.athleteWinsByState[state] || []
    ).sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

    const stateGyms = selectedStates.flatMap(state => 
        stats.eventStats.gymWinsByState[state] || []
    ).sort((a, b) => b.wins - a.wins)
    .slice(0, 10);

    const totalBoutsInStates = Object.entries(stats.eventStats.stateDistribution)
        .filter(([state]) => selectedStates.includes(state))
        .reduce((sum, [, count]) => sum + count, 0);

    // Calculate unique athlete count directly in memo
    const uniqueAthletesCount = getUniqueAthleteCount(
        Object.fromEntries(
            Object.entries(stats.eventStats.athleteWinsByState).filter(([state]) =>
                selectedStates.includes(state)
            )
        )
    );

    return {
        ...stats,
        topAthletes: stateAthletes,
        topGyms: stateGyms,
        totalBouts: totalBoutsInStates,
        uniqueAthletesCount, // Include the unique count in the returned stats
        eventStats: {
            stateDistribution: Object.fromEntries(
                Object.entries(stats.eventStats.stateDistribution)
                    .filter(([state]) => selectedStates.includes(state))
            )
        }
    };
}, [stats, selectedStates]);


React.useEffect(() => {
    console.log('Stats updated:', stats); // Track changes in state
}, [stats]);


    return (
        <div style={styles.container}>
            <div style={styles.yearSelectionContainer}>
                <h1 style={styles.heading}>POINT MUAY THAI STATISTICS</h1>
                <p className="text-center">The Largest Community Based Muay Thai Organization</p>

                <div className="flex items-center justify-center gap-2">

                        <p className="text-gray-600">Powered by Techbouts Inc</p>
                        <Image 
                            src="/logos/techboutslogoFlat.png"
                            alt="Techbouts Logo"
                            width={80}
                            height={80}
                            className="inline-block"
                        />
                    </div>               
                    
                     <div className="flex justify-center mb-6">
                    <Image 
                        src="/logos/pmt_logo_2024_sm.png"
                        alt="Point Muay Thai Logo"
                        width={100}
                        height={100}
                        priority
                    />
                </div>

                <div style={styles.filterSection}>
                    <h3 style={styles.filterTitle}>Select Years</h3>
                    <div style={styles.yearButtonContainer}>
                        {Object.keys(selectedYears).map(year => (
                            <button
                                key={year}
                                onClick={() => handleYearToggle(year)}
                                style={{
                                    ...styles.yearButton,
                                    ...(selectedYears[year] ? styles.selectedYearButton : styles.unselectedYearButton)
                                }}
                            >
                                {year}
                            </button>
                        ))}
                    </div>

                    <button
                    onClick={beginAnalysis}
                    disabled={isAnalyzing}
                    style={styles.analyzeButton}
                >
                    {isAnalyzing ? 'Analyzing...' : 'Begin Analysis'}
                </button>
                </div>

                {/* State Selection */}
                {availableStates.length > 0 && (
                    <div style={styles.filterSection}>
                        <h3 style={styles.filterTitle}>Filter by State</h3>
                        <div style={styles.stateButtonContainer}>
                       
                          
                        <StateMap 
  stateDistribution={stats.eventStats.stateDistribution}
  selectedStates={selectedStates}
  onStateToggle={handleStateToggle}
/>

                        </div>
                    </div>
                )}

             
            </div>


            <div style={styles.statsHeader}>
    <div>
        <div style={styles.statsSubtitle}>Across selected years {selectedStates.length > 0 ? `in ${selectedStates.join(', ')}` : ''}</div>
    </div>




<div
style={{
    border: '1px solid #e5e7eb',
    flexDirection: 'column',
    borderRadius: '5px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    marginTop: '20px',
    maxWidth: '400px',
    margin: '0 auto',

}}
>
    <div
    style={{
        backgroundColor:'black',
        color:'white',
        padding:'5px 10px',
        borderRadius: '5px',

    }}
    >
Total Unique Atheles 
</div>
    <div style={styles.totalAthletes}>
       {stats.uniqueAthletesCount.toLocaleString()}
    </div>
    </div>



    <div
style={{
    border: '1px solid #e5e7eb',
    flexDirection: 'column',
    borderRadius: '5px',
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: '20px',
    marginTop: '20px',
    maxWidth: '400px',
    margin: '0 auto',

}}
>
    <div
    style={{
        backgroundColor:'black',
        color:'white',
        padding:'5px 10px',
        borderRadius: '5px',

    }}
    >
    Total Bouts Analyzed 
    </div>
    <div style={styles.totalBouts}>
        {filteredStats.totalBouts.toLocaleString()}
    </div>
    </div>
</div>




            <div style={styles.chartsGrid}>

               

                <div style={styles.chartContainer}>
                    {filteredStats.ageGenderDistribution.length > 0 ? (
                        <MyPieChart
                            data={filteredStats.ageGenderDistribution}
                            title="Age-Gender Distribution"
                        />
                    ) : (
                        <div style={styles.noDataMessage}>
                            No age-gender data available
                        </div>
                    )}
                </div>
            </div>



            <div style={styles.chartContainer}>
    <h3 style={styles.statsTitle}>Top 10 Athletes by Wins</h3>
    <div style={styles.barChartContainer}>
        <ResponsiveContainer width="100%" height={400}>
            <BarChart 
                data={filteredStats.topAthletes} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    interval={0}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar 
                    dataKey="wins" 
                    fill="#82ca9d" 
                    name="Wins"
                    barSize={20}
                />
            </BarChart>
        </ResponsiveContainer>
    </div>
</div>

<div style={styles.chartContainer}>
    <h3 style={styles.statsTitle}>Top 10 Gyms by Wins</h3>
    <div style={styles.barChartContainer}>
        <ResponsiveContainer width="100%" height={400}>
            <BarChart 
                data={filteredStats.topGyms} 
                layout="vertical"
                margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
            >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={150}
                    interval={0}
                    tick={{ fontSize: 12 }}
                />
                <Tooltip />
                <Bar 
                    dataKey="wins" 
                    fill="#0088FE" 
                    name="Wins"
                    barSize={20}
                />
            </BarChart>
        </ResponsiveContainer>
    </div>
</div>




            <div style={styles.terminalContainer}>
                <div style={styles.terminalButtons}>
                    <button
                        onClick={() => setShowLogs(!showLogs)}
                        style={styles.terminalButton}
                    >
                        {showLogs ? 'Hide' : 'Show'} Terminal
                    </button>
                    {showLogs && (
                        <button
                            onClick={() => setDebugLogs([])}
                            style={{...styles.terminalButton, ...styles.clearButton}}
                        >
                            Clear
                        </button>
                    )}
                </div>

                {showLogs && debugLogs.length > 0 && <TerminalLogs logs={debugLogs} />}
            </div>
        </div>
    );
};







export default StatisticsDashboard;





const styles: Record<string, React.CSSProperties> = {
    filterSection: {
        marginBottom: '1.5rem',
    },
    filterTitle: {
        fontSize: '1rem',
        fontWeight: 'bold',
        marginBottom: '0.5rem',
        color: '#4b5563'
    },
    stateButtonContainer: {
        display: 'flex',
        flexWrap: 'wrap',
        gap: '0.5rem',
        justifyContent: 'center'
    },
    stateButton: {
        padding: '0.25rem 0.75rem',
        borderRadius: '0.25rem',
        fontSize: '0.875rem',
        transition: 'all 0.2s'
    },
    selectedStateButton: {
        backgroundColor: '#3b82f6',
        color: '#ffffff'
    },
    unselectedStateButton: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb',
        color: '#4b5563'
    },

    container: {
        minHeight: '100vh',
        backgroundColor: '#f3f4f6',
        padding: '1rem'
    },
    yearSelectionContainer: {
        maxWidth: '1280px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        marginBottom: '2rem',
        padding: '1.5rem'
    },
    heading: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        marginBottom: '1.5rem',
        textAlign: 'center' as const,
        color: '#1f2937' 

    },
    yearButtonContainer: {
        display: 'flex',
        flexWrap: 'wrap' as const, // Type assertion for flexWrap
        gap: '1rem',
        justifyContent: 'center',
        marginBottom: '1rem'
    },
    yearButton: {
        padding: '0.5rem 1.5rem',
        borderRadius: '0.5rem',
        transition: 'all 0.2s'
    },
    selectedYearButton: {
        backgroundColor: '#2563eb',
        color: '#ffffff'
    },
    unselectedYearButton: {
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb'
        // Note: Removed :hover as it's not supported in inline styles
    },
    analyzeButton: {
        width: '100%',
        maxWidth: '20rem',
        margin: '0 auto',
        padding: '0.5rem 1rem',
        backgroundColor: '#2563eb',
        color: '#ffffff',
        borderRadius: '0.5rem',
        display: 'block',
        // Note: Removed :hover and :disabled as they're not supported in inline styles
    },
    statsContainer: {
        maxWidth: '1280px',
        margin: '0 auto',
        backgroundColor: '#ffffff',
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        padding: '2rem',
        marginBottom: '2rem',
        textAlign: 'center',
        border: '1px solid #e5e7eb',
    },
    statsHeader: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem',
        marginBottom: '1.5rem'
    },
    statsTitle: {
        fontSize: '1.75rem',
        fontWeight: 'bold',
        color: '#1f2937',
        marginBottom: '0.5rem'
    },
    statsSubtitle: {
        fontSize: '1rem',
        color: '#6b7280'
    },
    totalBoutsContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '1rem'
    },
    totalBouts: {
        fontSize: '3rem',
        fontWeight: 'bold',
        color: '#2563eb',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        display: 'inline-block',
       
    },
    totalAthletes: {
        fontSize: '3rem',
        fontWeight: 'bold',
        color: '#2563eb',
        padding: '1rem',
        backgroundColor: '#f3f4f6',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        display: 'inline-block',
      
    },
    chartsGrid: {
        maxWidth: '1280px',
        margin: '0 auto',
        display: 'grid',
        gridTemplateColumns: '1fr',
        gap: '2rem'
        // Note: Removed @media as it's not supported in inline styles
    },
    chartContainer: {
        backgroundColor: '#ffffff',
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1.5rem'
    },
    noDataMessage: {
        height: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#6b7280'
    },
    barChartContainer: {
        width: '100%',
        height: '400px'
    },
    terminalContainer: {
        position: 'fixed',
        bottom: '1rem',
        right: '1rem',
        width: '100%',
        maxWidth: '42rem',
        zIndex: 50
    },
    terminalButtons: {
        display: 'flex',
        justifyContent: 'flex-end',
        gap: '0.5rem',
        marginBottom: '0.5rem'
    },
    terminalButton: {
        backgroundColor: '#1f2937',
        color: '#ffffff',
        padding: '0.5rem 1rem',
        borderRadius: '0.25rem'
    },
    clearButton: {
        backgroundColor: '#dc2626'
    }
};