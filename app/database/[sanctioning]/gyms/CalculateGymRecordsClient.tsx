// app/database/[sanctioning]/gyms/CalculateGymRecordsClient.tsx

'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { 
  collection, 
  getDocs, 
  doc, 
  getDoc,
  query, 
  orderBy, 
  limit,
  startAfter,
  writeBatch,
  DocumentSnapshot,
  Query,
  DocumentData
} from 'firebase/firestore';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';

interface FighterResult {
  id: string;
  first: string;
  last: string;
  gym: string;
  result: string;
  bout_type: string;
  weightclass: number;
  opponent_id?: string;
  event_id?: string;
  pmt_id: string;
  email: string;
  bodykick: number;
  boxing: number;
  clinch: number;
  defense: number;
  footwork: number;
  headkick: number;
  kicks: number;
  knees: number;
  legkick: number;
  ringawareness: number;
}

interface GymRecord {
  gym_id: string;
  gym_name: string;
  wins: number;
  losses: number;
  nc: number;
  dq: number;
  tournament_wins: number;
  tournament_losses: number;
  total_fighters: number;
  // Technical skill metrics
  total_bodykick: number;
  total_boxing: number;
  total_clinch: number;
  total_defense: number;
  total_footwork: number;
  total_headkick: number;
  total_kicks: number;
  total_knees: number;
  total_legkick: number;
  total_ringawareness: number;
  // Yearly statistics
  yearly_stats: {
    [year: string]: {
      wins: number;
      losses: number;
      nc: number;
      dq: number;
      tournament_wins: number;
      tournament_losses: number;
      total_fighters: number;
      fights: number;
      // Added location tracking by city/state
      by_location: {
        [locationKey: string]: {
          wins: number;
          losses: number;
          nc: number;
          dq: number;
          tournament_wins: number;
          tournament_losses: number;
          fights: number;
        }
      }
    }
  };
  // Added all-time location stats
  location_stats: {
    [locationKey: string]: {
      wins: number;
      losses: number;
      nc: number;
      dq: number;
      tournament_wins: number;
      tournament_losses: number;
      fights: number;
    }
  };
  fighters: Array<{
    pmt_id: string;
    first: string;
    last: string;
    email: string;
  }>;
  fights: Array<{
    eventId: string;
    eventName: string;
    date: string;
    fighter_id: string;
    fighter_name: string;
    result: string;
    weightclass: number;
    bout_type: string;
    bodykick: number;
    boxing: number;
    clinch: number;
    defense: number;
    footwork: number;
    headkick: number;
    kicks: number;
    knees: number;
    legkick: number;
    ringawareness: number;
    city?: string;  // Added city
    state?: string; // Added state
  }>;
  lastUpdated: string;
}

interface CalculateGymRecordsClientProps {
  sanctioning: string;
}

function formatGymId(gymName: string): string | null {
  if (!gymName) return null;
  
  try {
    // Replace problematic characters and clean the gym name
    const sanitizedGym = gymName
      .trim()
      // Replace special characters with underscores
      .replace(/[&\/\\#,+()$~%.'":*?<>{}]/g, '_')
      // Replace spaces with underscores
      .replace(/\s+/g, '_')
      // Replace multiple consecutive underscores with a single one
      .replace(/_+/g, '_')
      // Remove any remaining non-alphanumeric characters except underscores
      .replace(/[^a-zA-Z0-9_]/g, '')
      .toUpperCase();

    // If the gym name is empty after sanitization or too long, skip it
    if (!sanitizedGym || sanitizedGym.length > 1500) {
      return null;
    }

    return sanitizedGym;
  } catch (error) {
    console.error('Error formatting gym name:', gymName, error);
    return null;
  }
}

export default function CalculateGymRecordsClient({ sanctioning }: CalculateGymRecordsClientProps) {
  const [loading, setLoading] = useState(false);
  const [transferLoading, setTransferLoading] = useState(false);
  const [progress, setProgress] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [gymRecords, setGymRecords] = useState<GymRecord[]>([]);
  const { user } = useAuth();




  const calculateAllTimeGymRecords = async () => {
    setLoading(true);
    setError(null);
    setProgress([]);
    setGymRecords([]);
  
    const BATCH_SIZE = 500;
    const gymRecordsMap = new Map<string, GymRecord>();
    let lastEventDoc: DocumentSnapshot | null = null;
    const skippedGyms = new Set<string>(); // Track unique skipped gyms
    let totalEventsProcessed = 0;
  
    try {
      setProgress(prev => [...prev, "Starting calculation of all-time gym records..."]);
      
      // Process all events in batches
      while (true) {
        // Build query for all events
        const eventsQuery: Query<DocumentData> = lastEventDoc
          ? query(
              collection(pmtDb, 'events'),
              orderBy('date', 'desc'),
              startAfter(lastEventDoc),
              limit(BATCH_SIZE)
            )
          : query(
              collection(pmtDb, 'events'),
              orderBy('date', 'desc'),
              limit(BATCH_SIZE)
            );
  
        const eventsSnapshot = await getDocs(eventsQuery);
        if (eventsSnapshot.empty) break;
        
        lastEventDoc = eventsSnapshot.docs[eventsSnapshot.docs.length - 1];
        totalEventsProcessed += eventsSnapshot.size;
        
        setProgress(prev => [...prev, `Processing batch of ${eventsSnapshot.size} events (total: ${totalEventsProcessed})`]);
  
        for (const eventDoc of eventsSnapshot.docs) {
          const eventData = eventDoc.data();
          
          // Extract the year from the event date
          const eventYear = eventData.date ? eventData.date.substring(0, 4) : null;
          if (!eventYear) continue; // Skip events without valid dates
          
          // Get city and state from event data
          const eventCity = eventData.city || "Unknown";
          const eventState = eventData.state || "Unknown";
          
          const resultsJsonRef = doc(pmtDb, 'events', eventDoc.id, 'resultsJson', 'fighters');
          const resultsJsonSnap = await getDoc(resultsJsonRef);
          if (!resultsJsonSnap.exists()) continue;
          
          const resultsData = resultsJsonSnap.data();
          if (!resultsData.fighters || !Array.isArray(resultsData.fighters)) continue;
          
          const fighters = resultsData.fighters as FighterResult[];
  
          fighters.forEach((fighter) => {
            if (!fighter.gym) return; // Skip if no gym
  
            const gymId = formatGymId(fighter.gym);
            if (!gymId) {
              // Log problematic gym name and skip processing
              skippedGyms.add(fighter.gym);
              return;
            }
  
            if (!gymRecordsMap.has(gymId)) {
              gymRecordsMap.set(gymId, {
                gym_id: gymId,
                gym_name: fighter.gym.toUpperCase(),
                wins: 0,
                losses: 0,
                nc: 0,
                dq: 0,
                tournament_wins: 0,
                tournament_losses: 0,
                total_fighters: 0,
                total_bodykick: 0,   
                total_boxing: 0,     
                total_clinch: 0,     
                total_defense: 0,    
                total_footwork: 0,   
                total_headkick: 0,    
                total_kicks: 0,      
                total_knees: 0,       
                total_legkick: 0,     
                total_ringawareness: 0,
                yearly_stats: {},
                location_stats: {}, // New object to track stats by location
                fighters: [],
                fights: [],
                lastUpdated: new Date().toISOString(),
              });
            }
  
            const record = gymRecordsMap.get(gymId)!;
  
            // Initialize yearly stats if not present
            if (!record.yearly_stats[eventYear]) {
              record.yearly_stats[eventYear] = {
                wins: 0,
                losses: 0,
                nc: 0,
                dq: 0,
                tournament_wins: 0,
                tournament_losses: 0,
                total_fighters: 0,
                fights: 0,
                // Add city/state tracking to yearly stats
                by_location: {}
              };
            }
            
            // Initialize location key in yearly stats
            const locationKey = `${eventCity}, ${eventState}`;
            if (!record.yearly_stats[eventYear].by_location[locationKey]) {
              record.yearly_stats[eventYear].by_location[locationKey] = {
                wins: 0,
                losses: 0,
                nc: 0,
                dq: 0,
                tournament_wins: 0,
                tournament_losses: 0,
                fights: 0
              };
            }
            
            // Initialize global location stats if not present
            if (!record.location_stats[locationKey]) {
              record.location_stats[locationKey] = {
                wins: 0,
                losses: 0,
                nc: 0,
                dq: 0,
                tournament_wins: 0,
                tournament_losses: 0,
                fights: 0
              };
            }
  
            // Add fighter to gym's fighter list if not already present
            if (!record.fighters.some(f => f.pmt_id === fighter.pmt_id)) {
              record.fighters.push({
                pmt_id: fighter.pmt_id,
                first: fighter.first ? fighter.first.toUpperCase() : '',
                last: fighter.last ? fighter.last.toUpperCase() : '',
                email: fighter.email || ''
              });
              record.total_fighters++;
              
              // Increment year-specific fighter count (only once per fighter)
              record.yearly_stats[eventYear].total_fighters++;
            }
  
            if (fighter.result) {
              // Increment fight count for the year
              record.yearly_stats[eventYear].fights++;
              record.yearly_stats[eventYear].by_location[locationKey].fights++;
              record.location_stats[locationKey].fights++;
              
              if (fighter.bout_type === 'tournament') {
                if (fighter.result === 'W') {
                  record.tournament_wins++;
                  record.yearly_stats[eventYear].tournament_wins++;
                  record.yearly_stats[eventYear].by_location[locationKey].tournament_wins++;
                  record.location_stats[locationKey].tournament_wins++;
                }
                else if (fighter.result === 'L') {
                  record.tournament_losses++;
                  record.yearly_stats[eventYear].tournament_losses++;
                  record.yearly_stats[eventYear].by_location[locationKey].tournament_losses++;
                  record.location_stats[locationKey].tournament_losses++;
                }
              } else {
                switch (fighter.result.toUpperCase()) {
                  case 'W':
                    record.wins++;
                    record.yearly_stats[eventYear].wins++;
                    record.yearly_stats[eventYear].by_location[locationKey].wins++;
                    record.location_stats[locationKey].wins++;
                    break;
                  case 'L':
                    record.losses++;
                    record.yearly_stats[eventYear].losses++;
                    record.yearly_stats[eventYear].by_location[locationKey].losses++;
                    record.location_stats[locationKey].losses++;
                    break;
                  case 'NC':
                    record.nc++;
                    record.yearly_stats[eventYear].nc++;
                    record.yearly_stats[eventYear].by_location[locationKey].nc++;
                    record.location_stats[locationKey].nc++;
                    break;
                  case 'DQ':
                    record.dq++;
                    record.yearly_stats[eventYear].dq++;
                    record.yearly_stats[eventYear].by_location[locationKey].dq++;
                    record.location_stats[locationKey].dq++;
                    break;
                }
              }
            }
  
            // Add fight to gym's fight list
            record.fights.push({
              eventId: eventDoc.id,
              eventName: eventData.event_name || 'Unknown Event',
              date: eventData.date || '',
              fighter_id: fighter.pmt_id,
              fighter_name: `${fighter.first || ''} ${fighter.last || ''}`.toUpperCase(),
              result: fighter.result || 'Unknown',
              weightclass: fighter.weightclass || 0,
              bout_type: fighter.bout_type || '',
              bodykick: fighter.bodykick || 0,
              boxing: fighter.boxing || 0,
              clinch: fighter.clinch || 0,
              defense: fighter.defense || 0,
              footwork: fighter.footwork || 0,
              headkick: fighter.headkick || 0,
              kicks: fighter.kicks || 0,
              knees: fighter.knees || 0,
              legkick: fighter.legkick || 0,
              ringawareness: fighter.ringawareness || 0,
              // Add location data to the fight record
              city: eventCity,
              state: eventState
            });
          });
        }
      }
  
      if (skippedGyms.size > 0) {
        const skippedGymsList = Array.from(skippedGyms).slice(0, 10).join(', ') + 
            (skippedGyms.size > 10 ? ` and ${skippedGyms.size - 10} more...` : '');
        console.warn(`Skipped ${skippedGyms.size} problematic gym names: ${skippedGymsList}`);
        setProgress(prev => [...prev, `⚠️ Warning: Skipped ${skippedGyms.size} gyms with invalid characters.`]);
      }
  
      // Calculate totals for each gym
      for (const record of gymRecordsMap.values()) {
        record.total_bodykick = record.fights.reduce((sum, fight) => sum + (fight.bodykick || 0), 0);
        record.total_boxing = record.fights.reduce((sum, fight) => sum + (fight.boxing || 0), 0);
        record.total_clinch = record.fights.reduce((sum, fight) => sum + (fight.clinch || 0), 0);
        record.total_defense = record.fights.reduce((sum, fight) => sum + (fight.defense || 0), 0);
        record.total_footwork = record.fights.reduce((sum, fight) => sum + (fight.footwork || 0), 0);
        record.total_headkick = record.fights.reduce((sum, fight) => sum + (fight.headkick || 0), 0);
        record.total_kicks = record.fights.reduce((sum, fight) => sum + (fight.kicks || 0), 0);
        record.total_knees = record.fights.reduce((sum, fight) => sum + (fight.knees || 0), 0);
        record.total_legkick = record.fights.reduce((sum, fight) => sum + (fight.legkick || 0), 0);
        record.total_ringawareness = record.fights.reduce((sum, fight) => sum + (fight.ringawareness || 0), 0);
      }
  
      // Convert the Map to an array and sort by wins
      const sortedRecords = Array.from(gymRecordsMap.values())
        .sort((a, b) => b.wins - a.wins);
  
      setGymRecords(sortedRecords);
      setProgress(prev => [...prev, `Successfully calculated records for ${sortedRecords.length} gyms`]);
      setProgress(prev => [...prev, `Processed ${totalEventsProcessed} total events`]);
      
    } catch (error) {
      console.error('Error calculating gym records:', error);
      setError('Error calculating gym records. Check console for details.');
    } finally {
      setLoading(false);
    }
  };




  const transferToTechbouts = async () => {
    if (gymRecords.length === 0) {
      setError("No gym records to transfer");
      return;
    }
  
    setTransferLoading(true);
    setProgress(prev => [...prev, "Starting transfer to TechBouts Firebase..."]);
    
    try {
      let batch = writeBatch(techboutsDb);
      let count = 0;
      const BATCH_LIMIT = 500;
      
      for (const gym of gymRecords) {
        // Create a simplified gym profile for TechBouts with pmt_ prefixes
        const gymProfile = {
          id: gym.gym_id,
          name: gym.gym_name,
          // Add PMT prefixed fields
          pmt_wins: gym.wins,
          pmt_losses: gym.losses,
          pmt_nc: gym.nc,
          pmt_dq: gym.dq,
          pmt_tournament_wins: gym.tournament_wins,
          pmt_tournament_losses: gym.tournament_losses,
          pmt_fighters: gym.fighters,
          pmt_total_fighters: gym.total_fighters,
          
          // Keep track of total fights across sanctioning bodies
          total_wins: gym.wins,
          total_losses: gym.losses,
          total_fighters: gym.total_fighters,
          
          // PMT Technical skills in a nested object
          pmt_stats: {
            bodykick: gym.total_bodykick,
            boxing: gym.total_boxing,
            clinch: gym.total_clinch,
            defense: gym.total_defense,
            footwork: gym.total_footwork,
            headkick: gym.total_headkick,
            kicks: gym.total_kicks,
            knees: gym.total_knees,
            legkick: gym.total_legkick,
            ringawareness: gym.total_ringawareness
          },
          
          // Yearly stats with PMT prefix in a nested object
          pmt_yearly_stats: gym.yearly_stats,
          
          // Location stats with PMT prefix
          pmt_location_stats: gym.location_stats,
          
          // Fight details
          pmt_fights: gym.fights.length,
          
          // Geographic coverage - extract unique locations
          pmt_locations: Object.keys(gym.location_stats).map(loc => ({
            name: loc,
            wins: gym.location_stats[loc].wins,
            fights: gym.location_stats[loc].fights
          })),
          
          // Top performing locations (by win percentage, minimum 3 fights)
          pmt_top_locations: Object.entries(gym.location_stats)
            .filter(([, stats]) => stats.fights >= 3)
            .map(([name, stats]) => ({
              name,
              win_percentage: stats.wins / (stats.wins + stats.losses) * 100,
              wins: stats.wins,
              losses: stats.losses,
              fights: stats.fights
            }))
            .sort((a, b) => b.win_percentage - a.win_percentage)
            .slice(0, 5),
          
          lastUpdated: new Date().toISOString(),
          source: `${sanctioning.toUpperCase()} All-Time`
        };
        
        const gymDocRef = doc(techboutsDb, "Gym_Profiles", gym.gym_id);
        
        // Use set with merge option to maintain any existing data from other sources
        batch.set(gymDocRef, gymProfile, { merge: true });
        count++;
        
        // Process in batches
        if (count % BATCH_LIMIT === 0) {
          await batch.commit();
          setProgress(prev => [...prev, `Transferred batch of ${BATCH_LIMIT} gyms (total: ${count})`]);
          // Create new batch for next set
          batch = writeBatch(techboutsDb);
        }
      }
      
      // Commit any remaining documents
      if (count % BATCH_LIMIT !== 0) {
        await batch.commit();
      }
      
      setProgress(prev => [...prev, `Successfully transferred ${count} gym profiles to TechBouts Firebase with PMT prefixes`]);
    } catch (error) {
      console.error("Error transferring to TechBouts:", error);
      setError("Error transferring data to TechBouts. Check console for details.");
    } finally {
      setTransferLoading(false);
    }
  };




  if (!user) {
    return (
      <div className="container mx-auto py-6">
        <Card>
          <CardContent>
            <p className="text-center py-4">Please login to access this feature.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>
            Calculate {sanctioning.toUpperCase()} All-Time PMT Gym Records
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={calculateAllTimeGymRecords} 
                disabled={loading} 
                className="w-full sm:w-auto"
              >
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Calculate All-Time Gym Records
              </Button>
              
              <Button 
                onClick={transferToTechbouts} 
                disabled={transferLoading || gymRecords.length === 0} 
                variant="outline"
                className="w-full sm:w-auto"
              >
                {transferLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Send to TechBouts Firebase
              </Button>
            </div>

            {error && (
              <div className="text-red-500 mt-4 p-3 bg-red-50 rounded-md">{error}</div>
            )}

            {progress.length > 0 && (
              <div className="mt-4 p-4 bg-muted rounded-md max-h-96 overflow-y-auto space-y-2">
                {progress.map((message, index) => (
                  <div key={index} className="text-sm">
                    {message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {gymRecords.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>
              {sanctioning.toUpperCase()} All-Time Gym Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-muted">
                    <th className="p-2 text-left border">Gym Name</th>
                    <th className="p-2 text-center border">Wins</th>
                    <th className="p-2 text-center border">Losses</th>
                    <th className="p-2 text-center border">NC</th>
                    <th className="p-2 text-center border">DQ</th>
                    <th className="p-2 text-center border">Fighters</th>
                    <th className="p-2 text-center border">Boxing</th>
                    <th className="p-2 text-center border">Kicks</th>
                    <th className="p-2 text-center border">Clinch</th>
                  </tr>
                </thead>
                <tbody>
                  {gymRecords.map((gym) => (
                    <tr key={gym.gym_id} className="hover:bg-muted/50">
                      <td className="p-2 border">{gym.gym_name}</td>
                      <td className="p-2 text-center border">{gym.wins}</td>
                      <td className="p-2 text-center border">{gym.losses}</td>
                      <td className="p-2 text-center border">{gym.nc}</td>
                      <td className="p-2 text-center border">{gym.dq}</td>
                      <td className="p-2 text-center border">{gym.total_fighters}</td>
                      <td className="p-2 text-center border">{gym.total_boxing}</td>
                      <td className="p-2 text-center border">{gym.total_kicks}</td>
                      <td className="p-2 text-center border">{gym.total_clinch}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}