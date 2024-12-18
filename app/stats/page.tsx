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
        <div className="flex flex-wrap justify-center gap-8">
          {Object.entries(stateDistribution).map(([state, bouts]) => {
            // Skip rendering if state doesn't have an associated file
            if (!isValidState(state)) return null;
            
            return (
              <div
                key={state}
                onClick={() => onStateToggle(state)}
                className={`relative cursor-pointer group transition-transform hover:scale-105 ${
                  selectedStates.includes(state) ? 'scale-105' : 'opacity-75'
                }`}
              >
                {/* Container for image and stats */}
                <div className="relative w-[100px]">
                  {/* State image */}
                  <Image
                    src={`/images/states/${stateFiles[state]}.svg`}
                    alt={`${state} state`}
                    width={100}
                    height={100}
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
    eventStats: EventStats;
}

const StatisticsDashboard = () => {
    const [selectedYears, setSelectedYears] = useState<Record<string, boolean>>({
        '2022': false,
        '2023': false,
        '2024': false
    });
    const [selectedStates, setSelectedStates] = useState<string[]>([]);
    const [availableStates, setAvailableStates] = useState<string[]>([]);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [debugLogs, setDebugLogs] = useState<string[]>([]);
    const [showLogs, setShowLogs] = useState(true);

    const [stats, setStats] = useState<Stats>({
        genderDistribution: [],
        ageGenderDistribution: [],
        topAthletes: [],
        topGyms: [],
        totalBouts: 0,
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

            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunks = new TextDecoder()
                    .decode(value)
                    .split('\n')
                    .filter(chunk => chunk.trim());

                for (const chunk of chunks) {
                    const data = JSON.parse(chunk);

                    if (data.type === 'progress') {
                        addLog(`Processing ${data.eventName}: ${data.processedAthletes} athletes processed`);
                    } else if (data.type === 'complete') {
                        setStats(data);
                        // Update available states from the state distribution
                        const states = Object.keys(data.eventStats.stateDistribution);
                        setAvailableStates(states.sort());
                        addLog('Analysis completed successfully');
                    } else if (data.type === 'error') {
                        throw new Error(data.message);
                    }
                }
            }
        } catch (error) {
            console.error('Error during analysis:', error);
            addLog(`ERROR: ${error instanceof Error ? error.message : 'Unknown error occurred'}`);
        } finally {
            setIsAnalyzing(false);
        }
    };

    const filteredStats = React.useMemo(() => {
        if (selectedStates.length === 0) return stats;
    
        // Get the top athletes and gyms for the selected states
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
    
        return {
            ...stats,
            topAthletes: stateAthletes,
            topGyms: stateGyms,
            totalBouts: totalBoutsInStates,
            eventStats: {
                stateDistribution: Object.fromEntries(
                    Object.entries(stats.eventStats.stateDistribution)
                        .filter(([state]) => selectedStates.includes(state))
                )
            }
        };
    }, [stats, selectedStates]);

    return (
        <div style={styles.container}>
            <div style={styles.yearSelectionContainer}>
                <h1 style={styles.heading}>Tournament Statistics Analysis</h1>
                
                {/* Year Selection */}
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


            <div style={styles.statsContainer}>
                <div style={styles.statsHeader}>
                    <div>
                        <h2 style={styles.statsTitle}>Total Bouts</h2>
                        <p style={styles.statsSubtitle}>Across selected years {selectedStates.length > 0 ? `in ${selectedStates.join(', ')}` : ''}</p>
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
                    <ResponsiveContainer>
                        <BarChart data={filteredStats.topAthletes} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Bar dataKey="wins" fill="#82ca9d" name="Wins" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            <div style={styles.chartContainer}>
                <h3 style={styles.statsTitle}>Top 10 Gyms by Wins</h3>
                <div style={styles.barChartContainer}>
                    <ResponsiveContainer>
                        <BarChart data={filteredStats.topGyms} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis type="number" />
                            <YAxis dataKey="name" type="category" width={150} />
                            <Tooltip />
                            <Bar dataKey="wins" fill="#0088FE" name="Wins" />
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
        borderRadius: '0.5rem',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        padding: '1.5rem',
        marginBottom: '2rem'
    },
    statsHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
    },
    statsTitle: {
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#1f2937'
    },
    statsSubtitle: {
        color: '#4b5563'
    },
    totalBouts: {
        fontSize: '2.25rem',
        fontWeight: 'bold',
        color: '#2563eb'
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
        height: '300px'
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