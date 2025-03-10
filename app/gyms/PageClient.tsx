'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsList,
  TabsTrigger,
  
} from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Loader2, Search, TrendingUp, Trophy, Users, MapPin, Globe, 
  BarChart4, CircleUser, Info, Medal, Calendar
} from 'lucide-react';
import { toast } from 'sonner';
import {
  collection,
  query,
  orderBy,
  limit,
  startAfter,
  getDocs,
  where,
  QuerySnapshot,
  DocumentData,
  FirestoreError
} from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';

interface GymRecord {
  id: string;
  name: string;
  pmt_wins?: number;
  pmt_losses?: number;
  pmt_nc?: number;
  pmt_dq?: number;
  wins: number;
  losses: number;
  nc: number;
  dq: number;
  totalFighters: number;
  pmt_total_fighters?: number;
  stats?: {
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
  };
  pmt_stats?: {
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
  };
  yearlyStats?: {
    [year: string]: {
      wins: number;
      losses: number;
      nc: number;
      dq: number;
      tournament_wins: number;
      tournament_losses: number;
      total_fighters: number;
      fights: number;
    }
  };
  pmt_yearly_stats?: {
    [year: string]: {
      wins: number;
      losses: number;
      nc: number;
      dq: number;
      tournament_wins: number;
      tournament_losses: number;
      total_fighters: number;
      fights: number;
      by_location?: {
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
  pmt_location_stats?: {
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
  pmt_top_locations?: Array<{
    name: string;
    win_percentage: number;
    wins: number;
    losses: number;
    fights: number;
  }>;
  fighters?: Array<{
    pmt_id: string;
    first: string;
    last: string;
    email: string;
  }>;
  pmt_fighters?: Array<{
    pmt_id: string;
    first: string;
    last: string;
    email: string;
  }>;
  lastUpdated: string;
  source: string;
}

const GYMS_PER_PAGE = 12;
const YEARS = Array.from({ length: new Date().getFullYear() - 2015 + 1 }, (_, i) => String(2015 + i)).reverse();

export default function GymsPageClient() {
  const [gyms, setGyms] = useState<GymRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'wins' | 'fighters' | 'winRate'>('wins');
  const [viewMode, setViewMode] = useState<'card' | 'grid'>('grid');
  
  const lastDocRef = useRef<QuerySnapshot<DocumentData> | null>(null);
  const observer = useRef<IntersectionObserver | null>(null);
  const loadMoreTriggerRef = useCallback((node: HTMLDivElement | null) => {
    if (loadingMore) return;
    
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) {
        loadMoreGyms();
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loadingMore, hasMore, loading]);

  // Handle search debounce
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);

    return () => clearTimeout(timerId);
  }, [searchQuery]);

  // Reset when filters change
  useEffect(() => {
    setGyms([]);
    setLoading(true);
    setHasMore(true);
    lastDocRef.current = null;
    loadGyms();
  }, [debouncedQuery, selectedYear, sortBy]);

  // Show a helper toast message if year is selected
  useEffect(() => {
    if (selectedYear !== 'all') {
      toast.info(`Showing data for ${selectedYear}`, {
        description: 'Data from PMT sanctioning body'
      });
    }
  }, [selectedYear]);

  const loadGyms = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Build the query
      const gymsQuery = collection(db, 'Gym_Profiles');
      const constraints = [];
      
      // Apply search filter if present
      if (debouncedQuery) {
        const upperQuery = debouncedQuery.toUpperCase();
        constraints.push(where('name', '>=', upperQuery));
        constraints.push(where('name', '<=', upperQuery + '\uf8ff'));
      }
      
      // Apply sorting - always use all-time values for sorting to avoid index issues
      let sortField = 'pmt_wins';
      if (sortBy === 'fighters') {
        sortField = 'pmt_total_fighters';
      }
      
      // For ALL filter scenarios, just use a simple base query without year filters
      // This avoids index errors completely
      const finalQuery = query(
        gymsQuery,
        ...constraints,
        orderBy(sortField, 'desc'),
        // Get more items if we need to filter by year later
        limit(selectedYear !== 'all' ? GYMS_PER_PAGE * 3 : GYMS_PER_PAGE)
      );
      
      const snapshot = await getDocs(finalQuery);
      lastDocRef.current = snapshot;
      
      let loadedGyms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GymRecord));
      
      // For year filtering, filter entirely client-side
      if (selectedYear !== 'all') {
        loadedGyms = loadedGyms.filter(gym => 
          gym.pmt_yearly_stats && gym.pmt_yearly_stats[selectedYear]
        );
        
        // Sort by year-specific wins if needed
        if (sortBy === 'wins') {
          loadedGyms.sort((a, b) => {
            const aWins = a.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            const bWins = b.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            return bWins - aWins;
          });
        } else if (sortBy === 'fighters') {
          loadedGyms.sort((a, b) => {
            const aFighters = a.pmt_yearly_stats?.[selectedYear]?.total_fighters || 0;
            const bFighters = b.pmt_yearly_stats?.[selectedYear]?.total_fighters || 0;
            return bFighters - aFighters;
          });
        }
      }
      
      // Handle win rate sorting client-side
      if (sortBy === 'winRate') {
        if (selectedYear === 'all') {
          loadedGyms.sort((a, b) => {
            const aWins = a.pmt_wins || 0;
            const aLosses = a.pmt_losses || 0;
            const bWins = b.pmt_wins || 0;
            const bLosses = b.pmt_losses || 0;
            
            const aRate = aWins / (aWins + aLosses || 1);
            const bRate = bWins / (bWins + bLosses || 1);
            
            // If win rates are equal, sort by total fights
            if (Math.abs(aRate - bRate) < 0.001) {
              return (bWins + bLosses) - (aWins + aLosses);
            }
            
            return bRate - aRate;
          });
        } else {
          loadedGyms.sort((a, b) => {
            const aWins = a.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            const aLosses = a.pmt_yearly_stats?.[selectedYear]?.losses || 0;
            const bWins = b.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            const bLosses = b.pmt_yearly_stats?.[selectedYear]?.losses || 0;
            
            const aRate = aWins / (aWins + aLosses || 1);
            const bRate = bWins / (bWins + bLosses || 1);
            
            // If win rates are equal, sort by total fights
            if (Math.abs(aRate - bRate) < 0.001) {
              return (bWins + bLosses) - (aWins + aLosses);
            }
            
            return bRate - aRate;
          });
        }
      }
      
      // Limit to display count after all filtering
      loadedGyms = loadedGyms.slice(0, GYMS_PER_PAGE);
      
      setGyms(loadedGyms);
      
      // Only set hasMore if we had enough results or if we're in all-time mode
      // For year filtering, we get a bigger initial batch, so only mark as "more" if we filtered to exactly the page size
      setHasMore(
        selectedYear === 'all' 
          ? (!snapshot.empty && snapshot.docs.length === GYMS_PER_PAGE)
          : (loadedGyms.length === GYMS_PER_PAGE)
      );
      
    } catch (err) {
      console.error('Error loading gyms:', err);
      setError(err instanceof FirestoreError ? err.message : 'Failed to load gyms');
    } finally {
      setLoading(false);
    }
  };

  const loadMoreGyms = async () => {
    if (!hasMore || loadingMore || !lastDocRef.current) return;
    
    try {
      setLoadingMore(true);
      
      // Build the query with startAfter using the last document
      const gymsQuery = collection(db, 'Gym_Profiles');
      const constraints = [];
      
      if (debouncedQuery) {
        const upperQuery = debouncedQuery.toUpperCase();
        constraints.push(where('name', '>=', upperQuery));
        constraints.push(where('name', '<=', upperQuery + '\uf8ff'));
      }
      
      // Apply sorting - always use all-time values for sorting
      let sortField = 'pmt_wins';
      if (sortBy === 'fighters') {
        sortField = 'pmt_total_fighters';
      }
      
      // Simple query without year filtering to avoid index errors
      const finalQuery = query(
        gymsQuery,
        ...constraints,
        orderBy(sortField, 'desc'),
        startAfter(lastDocRef.current.docs[lastDocRef.current.docs.length - 1]),
        limit(selectedYear !== 'all' ? GYMS_PER_PAGE * 3 : GYMS_PER_PAGE)
      );
      
      const snapshot = await getDocs(finalQuery);
      lastDocRef.current = snapshot;
      
      let newGyms = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as GymRecord));
      
      // For year filtering, filter entirely client-side
      if (selectedYear !== 'all') {
        newGyms = newGyms.filter(gym => 
          gym.pmt_yearly_stats && gym.pmt_yearly_stats[selectedYear]
        );
        
        // Sort by year-specific wins if needed
        if (sortBy === 'wins') {
          newGyms.sort((a, b) => {
            const aWins = a.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            const bWins = b.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            return bWins - aWins;
          });
        } else if (sortBy === 'fighters') {
          newGyms.sort((a, b) => {
            const aFighters = a.pmt_yearly_stats?.[selectedYear]?.total_fighters || 0;
            const bFighters = b.pmt_yearly_stats?.[selectedYear]?.total_fighters || 0;
            return bFighters - aFighters;
          });
        }
      }
      
      // Handle win rate sorting client-side
      if (sortBy === 'winRate') {
        if (selectedYear === 'all') {
          newGyms.sort((a, b) => {
            const aWins = a.pmt_wins || 0;
            const aLosses = a.pmt_losses || 0;
            const bWins = b.pmt_wins || 0;
            const bLosses = b.pmt_losses || 0;
            
            const aRate = aWins / (aWins + aLosses || 1);
            const bRate = bWins / (bWins + bLosses || 1);
            
            // If win rates are equal, sort by total fights
            if (Math.abs(aRate - bRate) < 0.001) {
              return (bWins + bLosses) - (aWins + aLosses);
            }
            
            return bRate - aRate;
          });
        } else {
          newGyms.sort((a, b) => {
            const aWins = a.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            const aLosses = a.pmt_yearly_stats?.[selectedYear]?.losses || 0;
            const bWins = b.pmt_yearly_stats?.[selectedYear]?.wins || 0;
            const bLosses = b.pmt_yearly_stats?.[selectedYear]?.losses || 0;
            
            const aRate = aWins / (aWins + aLosses || 1);
            const bRate = bWins / (bWins + bLosses || 1);
            
            // If win rates are equal, sort by total fights
            if (Math.abs(aRate - bRate) < 0.001) {
              return (bWins + bLosses) - (aWins + aLosses);
            }
            
            return bRate - aRate;
          });
        }
      }
      
      // Limit to display count after all filtering
      newGyms = newGyms.slice(0, GYMS_PER_PAGE);
      
      setGyms(prev => [...prev, ...newGyms]);
      
      // Only set hasMore if we had enough results or if we're in all-time mode
      setHasMore(
        selectedYear === 'all' 
          ? (!snapshot.empty && snapshot.docs.length === GYMS_PER_PAGE)
          : (newGyms.length === GYMS_PER_PAGE) 
      );
      
    } catch (err) {
      console.error('Error loading more gyms:', err);
      setError(err instanceof FirestoreError ? err.message : 'Failed to load more gyms');
    } finally {
      setLoadingMore(false);
    }
  };

  // Calculate win percentage helper
  const calculateWinPercentage = (wins: number, losses: number) => {
    if (wins + losses === 0) return 0;
    return Math.round((wins / (wins + losses)) * 100);
  };

  // Get yearly stats helper
  const getYearlyStats = (gym: GymRecord, year: string) => {
    if (year === 'all' || !gym.pmt_yearly_stats || !gym.pmt_yearly_stats[year]) {
      return {
        wins: gym.pmt_wins || 0,
        losses: gym.pmt_losses || 0,
        nc: gym.pmt_nc || 0,
        dq: gym.pmt_dq || 0,
        total_fighters: gym.pmt_total_fighters || 0,
        tournament_wins: 0,
        tournament_losses: 0,
        fights: 0
      };
    }
    
    return gym.pmt_yearly_stats[year];
  };

  // Get top location for a gym
  const getTopLocation = (gym: GymRecord) => {
    if (!gym.pmt_top_locations || gym.pmt_top_locations.length === 0) {
      return null;
    }
    
    return gym.pmt_top_locations[0];
  };

  // Function to render the card view for a gym
  const renderGymCard = (gym: GymRecord) => {
    const stats = getYearlyStats(gym, selectedYear);
    const totalFights = stats.wins + stats.losses + stats.nc + stats.dq;
    const winPercent = calculateWinPercentage(stats.wins, stats.losses);
    const topLocation = getTopLocation(gym);
    
    return (
      <Card className="h-full overflow-hidden hover:border-primary transition-colors">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <CardTitle className="text-xl">{gym.name}</CardTitle>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary">
                {winPercent}%
              </div>
              <div className="text-xs text-muted-foreground">
                Win Rate
              </div>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-2 mb-4">
            <Badge variant="secondary" className="flex items-center">
              <Trophy className="mr-1 h-3 w-3" /> 
              {stats.wins} W
            </Badge>
            <Badge variant="outline" className="flex items-center">
              {stats.losses} L
            </Badge>
            {(stats.nc > 0 || stats.dq > 0) && (
              <Badge variant="outline" className="flex items-center">
                {stats.nc + stats.dq} NC/DQ
              </Badge>
            )}
            <Badge variant="secondary" className="flex items-center">
              <Users className="mr-1 h-3 w-3" /> 
              {stats.total_fighters || 0}
            </Badge>
          </div>
          
          {/* Skills & Metrics Section */}
          {selectedYear === 'all' && gym.pmt_stats && (
            <div className="grid grid-cols-3 gap-3 my-3">
              <div className="bg-muted rounded-md p-2">
                <div className="text-xs text-muted-foreground">Boxing</div>
                <div className="font-medium text-sm">{gym.pmt_stats.boxing}</div>
              </div>
              <div className="bg-muted rounded-md p-2">
                <div className="text-xs text-muted-foreground">Kicks</div>
                <div className="font-medium text-sm">{gym.pmt_stats.kicks}</div>
              </div>
              <div className="bg-muted rounded-md p-2">
                <div className="text-xs text-muted-foreground">Clinch</div>
                <div className="font-medium text-sm">{gym.pmt_stats.clinch}</div>
              </div>
            </div>
          )}
          
          {/* Top Location */}
          {topLocation && (
            <div className="mt-2 flex items-center text-sm">
              <MapPin className="h-3 w-3 mr-1 text-muted-foreground" />
              <span className="text-muted-foreground mr-1">Best at:</span>
              <span className="font-medium">{topLocation.name}</span>
              <Badge variant="outline" className="ml-2 text-xs">
                {Math.round(topLocation.win_percentage)}% Win
              </Badge>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="pt-0">
          {/* Show year context if year is selected */}
          {selectedYear !== 'all' && (
            <div className="w-full text-sm text-muted-foreground flex items-center justify-between">
              <div className="flex items-center">
                <Calendar className="h-3 w-3 mr-1" />
                {selectedYear}
              </div>
              <div>{stats.fights || totalFights} fights</div>
            </div>
          )}
        </CardFooter>
      </Card>
    );
  };

  // Function to render the grid view (more detailed) for a gym
  const renderGymGrid = (gym: GymRecord) => {
    const stats = getYearlyStats(gym, selectedYear);
    const totalFights = stats.wins + stats.losses + stats.nc + stats.dq;
    const winPercent = calculateWinPercentage(stats.wins, stats.losses);
    const topLocation = getTopLocation(gym);
    
    return (
      <Card className="overflow-hidden hover:border-primary transition-colors">
        <CardContent className="p-0">
          <div className="flex flex-col md:flex-row">
            {/* Left Stats Column */}
            <div className="p-6 md:w-2/3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-bold mb-2">{gym.name}</h3>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <Badge variant="secondary" className="flex items-center">
                      <Trophy className="mr-1 h-3 w-3" /> 
                      {stats.wins} W
                    </Badge>
                    <Badge variant="outline" className="flex items-center">
                      {stats.losses} L
                    </Badge>
                    {(stats.nc > 0 || stats.dq > 0) && (
                      <Badge variant="outline" className="flex items-center">
                        {stats.nc + stats.dq} NC/DQ
                      </Badge>
                    )}
                    {stats.tournament_wins > 0 && (
                      <Badge variant="default" className="flex items-center">
                        <Medal className="mr-1 h-3 w-3" />
                        {stats.tournament_wins} Tournament Wins
                      </Badge>
                    )}
                    <Badge variant="secondary" className="flex items-center">
                      <Users className="mr-1 h-3 w-3" /> 
                      {stats.total_fighters || 0} Fighters
                    </Badge>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="text-3xl font-bold text-primary">
                    {winPercent}%
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Win Rate
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {totalFights} total fights
                  </div>
                </div>
              </div>
              
              {/* Skills section - in a grid for better visualization */}
              {selectedYear === 'all' && gym.pmt_stats && (
                <div className="mt-4 pt-4 border-t">
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <BarChart4 className="h-4 w-4 mr-1 text-muted-foreground" />
                    Fight Metrics
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    <div className="bg-muted/50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Boxing</div>
                      <div className="font-medium">{gym.pmt_stats.boxing}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Kicks</div>
                      <div className="font-medium">{gym.pmt_stats.kicks}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Clinch</div>
                      <div className="font-medium">{gym.pmt_stats.clinch}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Defense</div>
                      <div className="font-medium">{gym.pmt_stats.defense}</div>
                    </div>
                    <div className="bg-muted/50 p-2 rounded-md text-center">
                      <div className="text-xs text-muted-foreground">Ring IQ</div>
                      <div className="font-medium">{gym.pmt_stats.ringawareness}</div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Show year context if year is selected */}
              {selectedYear !== 'all' && (
                <div className="mt-4 pt-4 border-t flex items-center text-sm text-muted-foreground">
                  <Calendar className="h-4 w-4 mr-1" />
                  <span>Showing data for {selectedYear} • {stats.fights || totalFights} fights</span>
                </div>
              )}
            </div>
            
            {/* Right Location Column */}
            <div className="p-6 md:w-1/3 bg-muted/10 md:border-l flex flex-col">
              {topLocation ? (
                <>
                  <h4 className="text-sm font-medium mb-3 flex items-center">
                    <MapPin className="h-4 w-4 mr-1 text-muted-foreground" />
                    Top Location
                  </h4>
                  <div className="bg-muted/30 rounded-md p-3 mb-3">
                    <div className="font-medium mb-1">{topLocation.name}</div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Win Rate:</span>
                        <span className="ml-1 font-medium">{Math.round(topLocation.win_percentage)}%</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Fights:</span>
                        <span className="ml-1 font-medium">{topLocation.fights}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Wins:</span>
                        <span className="ml-1 font-medium">{topLocation.wins}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Losses:</span>
                        <span className="ml-1 font-medium">{topLocation.losses}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* Additional locations */}
                  {gym.pmt_top_locations && gym.pmt_top_locations.length > 1 && (
                    <div className="mt-auto">
                      <h5 className="text-xs font-medium mb-2 text-muted-foreground">
                        OTHER LOCATIONS ({gym.pmt_top_locations.length - 1})
                      </h5>
                      <div className="space-y-1">
                        {gym.pmt_top_locations.slice(1, 4).map((loc, i) => (
                          <div key={i} className="flex justify-between text-xs">
                            <span className="truncate max-w-[70%]">{loc.name}</span>
                            <span className="font-medium">{Math.round(loc.win_percentage)}% Win</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                  <Globe className="h-8 w-8 mb-2 opacity-50" />
                  <div className="text-sm text-center">
                    No location data available
                  </div>
                </div>
              )}
              
              {/* Fighter count with icon */}
              <div className="mt-auto pt-4 flex items-center justify-between text-sm">
                <div className="flex items-center">
                  <CircleUser className="h-4 w-4 mr-1 text-muted-foreground" />
                  <span>{stats.total_fighters || gym.pmt_total_fighters || 0} Fighters</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Source:</span>
                  <span className="ml-1 text-xs">PMT</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header with title */}
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Gym Profiles</h1>
        <p className="text-muted-foreground">
          Browse and search Muay Thai gyms with comprehensive competition records.
        </p>
      </div>
      
      {/* Filters and Search */}
      <div className="bg-card border rounded-lg p-4 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search gyms..."
                className="pl-8"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            
            <Select value={selectedYear} onValueChange={setSelectedYear}>
              <SelectTrigger className="w-full sm:w-36">
                <Calendar className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Time</SelectItem>
                {YEARS.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <Select value={viewMode} onValueChange={(value) => setViewMode(value as 'card' | 'grid')}>
              <SelectTrigger className="w-full sm:w-36">
                <SelectValue placeholder="View Mode" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="grid">Detailed View</SelectItem>
                <SelectItem value="card">Card View</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <Tabs value={sortBy} onValueChange={(value) => setSortBy(value as 'wins' | 'fighters' | 'winRate')}>
            <TabsList>
              <TabsTrigger value="wins">
                <Trophy className="mr-2 h-4 w-4" />
                Wins
              </TabsTrigger>
              <TabsTrigger value="fighters">
                <Users className="mr-2 h-4 w-4" />
                Fighters
              </TabsTrigger>
              <TabsTrigger value="winRate">
                <TrendingUp className="mr-2 h-4 w-4" />
                Win Rate
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        {/* Info message for selected filters */}
        {selectedYear !== 'all' && (
          <div className="mt-4 flex items-center gap-2 text-sm text-primary border border-primary/30 bg-primary/5 rounded px-3 py-2">
            <Info className="h-4 w-4" />
            <p>
              <strong>Filtered by {selectedYear}:</strong> Showing PMT data for this specific year. 
              {sortBy === 'wins' ? ' Sorted by wins.' : 
               sortBy === 'fighters' ? ' Sorted by fighter count.' :
               ' Sorted by win percentage.'}
            </p>
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <div className="bg-red-50 p-4 rounded-md text-red-500">
          {error}
        </div>
      )}

      {/* Gym list */}
      <div className={viewMode === 'card' 
        ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" 
        : "space-y-4"
      }>
        {loading && gyms.length === 0 ? (
          // Initial loading skeletons
          Array.from({ length: viewMode === 'card' ? 8 : 5 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <CardContent className={viewMode === 'card' ? "p-4" : "p-6"}>
                <Skeleton className="h-7 w-48 mb-4" />
                <div className="flex flex-wrap gap-2 mb-4">
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                  <Skeleton className="h-5 w-16" />
                </div>
                {viewMode === 'grid' && (
                  <>
                    <Skeleton className="h-5 w-32 mb-2" />
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                      <Skeleton className="h-16 w-full" />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))
        ) : gyms.length === 0 ? (
          // No results state
          <Card className="col-span-full">
            <CardContent className="flex flex-col items-center justify-center p-12">
              <div className="rounded-full bg-muted p-3 mb-4">
                <Search className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-1">No gyms found</h3>
              <p className="text-muted-foreground mb-4 text-center">
                We couldnt find any gyms matching your current filters
              </p>
              <Button variant="outline" onClick={() => {
                setSearchQuery('');
                setSelectedYear('all');
                setSortBy('wins');
              }}>
                Reset Filters
              </Button>
            </CardContent>
          </Card>
        ) : (
          // Gym results
          gyms.map((gym) => (
            <div key={gym.id}>
              {viewMode === 'card' 
                ? renderGymCard(gym) 
                : renderGymGrid(gym)
              }
            </div>
          ))
        )}
      </div>
        
      {/* Load more trigger */}
      {hasMore && !loading && (
        <div ref={loadMoreTriggerRef} className="flex justify-center py-4">
          {loadingMore ? (
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          ) : (
            <Button variant="outline" className="gap-2" onClick={loadMoreGyms}>
              <span>Load More Gyms</span>
              {viewMode === 'grid' ? <span className="text-xs text-muted-foreground">({GYMS_PER_PAGE} per page)</span> : null}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}