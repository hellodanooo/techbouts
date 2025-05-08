'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { 
  collection, 
  getDocs, 
  query, 
  limit, 
  orderBy, 
  startAfter,
  getCountFromServer,
  where,
  DocumentData,
  QueryDocumentSnapshot,
  Query,
} from 'firebase/firestore';
import { db as pmtDb } from '@/lib/firebase_pmt/config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PmtFighterRecord } from '@/utils/types';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Loader2, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import debounce from 'lodash/debounce';

// Constants
const INITIAL_LIMIT = 15;
const LOAD_MORE_LIMIT = 15;
const SEARCH_MIN_CHARS = 3;

// Type for the collection metadata
interface CollectionMetadata {
  year: string;
  totalFighters: number;
  processedEvents: { eventId: string; eventName?: string }[];
}

// Sort type
type SortField = 'win' | 'last' | 'events_participated';
type SortDirection = 'asc' | 'desc';

// Search type
type SearchField = 'first' | 'last' | 'gym' | 'all';

const TabbedFighterDatabase = () => {
  // State for available years
  const [availableYears, setAvailableYears] = useState<string[]>([]);
  const [selectedYear, setSelectedYear] = useState<string>('');
  const [yearMetadata, setYearMetadata] = useState<Record<string, CollectionMetadata>>({});
  
  // State for fighters data
  const [fighters, setFighters] = useState<PmtFighterRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  
  // Sorting
  const [sortField, setSortField] = useState<SortField>('win');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  
  // Search
  const [searchTerm, setSearchTerm] = useState('');
  const [searchField, setSearchField] = useState<SearchField>('all');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<PmtFighterRecord[]>([]);
  const [noSearchResults, setNoSearchResults] = useState(false);

  // Discover available year collections
  useEffect(() => {
    const discoverYearCollections = async () => {
      try {
        setInitialLoading(true);
        
        // Get current year
        const currentYear = new Date().getFullYear();
        const possibleYears = [];
        const yearData: Record<string, CollectionMetadata> = {};
        
        // Check collections for years 2022 up to current year
        for (let year = 2022; year <= currentYear; year++) {
          const collectionName = `pmt_records_${year}`;
          try {
            // Try to get metadata document to check if collection exists and has data
            const metadataDoc = await getDocs(
              query(collection(pmtDb, collectionName), where('__name__', '==', 'metadata'))
            );
            
            if (!metadataDoc.empty) {
              const metadata = metadataDoc.docs[0].data() as CollectionMetadata;
              possibleYears.push(year.toString());
              yearData[year.toString()] = {
                year: year.toString(),
                totalFighters: metadata.totalFighters || 0,
                processedEvents: metadata.processedEvents || []
              };
            } else {
              // If no metadata, check if collection has any documents
              const snapshot = await getDocs(query(collection(pmtDb, collectionName), limit(1)));
              if (!snapshot.empty) {
                possibleYears.push(year.toString());
                
                // Get count
                const countSnapshot = await getCountFromServer(collection(pmtDb, collectionName));
                yearData[year.toString()] = {
                  year: year.toString(),
                  totalFighters: countSnapshot.data().count,
                  processedEvents: []
                };
              }
            }
          } catch (error) {
            console.log(`Collection ${collectionName} doesn't exist or is empty:`, error);
          }
        }
        
        // Sort years in descending order (most recent first)
        setAvailableYears(possibleYears.sort((a, b) => parseInt(b) - parseInt(a)));
        setYearMetadata(yearData);
        
        // Set initial selected year to most recent
        if (possibleYears.length > 0) {
          const initialYear = possibleYears[0]; // First year is most recent after sorting
          setSelectedYear(initialYear);
          
          // Load fighters for the selected year
          await loadFighters(initialYear, true);
        }
        
        setInitialLoading(false);
      } catch (error) {
        console.error('Error discovering year collections:', error);
        setInitialLoading(false);
      }
    };
    
    discoverYearCollections();
  }, []);
  
  // Load fighters for the selected year
  const loadFighters = useCallback(async (year: string, isInitial = false) => {
    if (loading || (!isInitial && !hasMore)) return;
    
    if (isInitial) {
      setFighters([]);
      setLastDoc(null);
      setHasMore(true);
    }
    
    setLoading(true);
    
    try {
      const collectionName = `pmt_records_${year}`;
      
      // When sorting by win, we'll use Firestore's orderBy for better performance
      // For consistency, we'll use 'desc' ordering for the Firebase query
      // We'll apply additional sorting in memory if needed
      const queryField = sortField === 'win' ? 'win' : 'last';
      const queryDirection = sortField === 'win' ? 'desc' : 'asc';
      
      let fightersQuery = query(
        collection(pmtDb, collectionName),
        orderBy(queryField, queryDirection),
        limit(isInitial ? INITIAL_LIMIT : LOAD_MORE_LIMIT)
      );
      
      // Add startAfter if we have a lastDoc and it's not initial load
      if (lastDoc && !isInitial) {
        fightersQuery = query(
          collection(pmtDb, collectionName),
          orderBy(queryField, queryDirection),
          startAfter(lastDoc),
          limit(LOAD_MORE_LIMIT)
        );
      }
      
      const snapshot = await getDocs(fightersQuery);
      
      // Set the last document for pagination
      const lastVisible = snapshot.docs[snapshot.docs.length - 1];
      setLastDoc(lastVisible || null);
      
      // Set hasMore based on if we got the full requested amount
      setHasMore(snapshot.docs.length === (isInitial ? INITIAL_LIMIT : LOAD_MORE_LIMIT));
      
      // Process fighter documents
      const newFighters = snapshot.docs
        .filter(doc => doc.id !== 'metadata' && doc.id !== 'errors') // Filter out metadata and errors docs



        .map(doc => {
          const data = doc.data();


          let eventsParticipated = data.events_participated || [];

          if (eventsParticipated.length > 0 && typeof eventsParticipated[0] === 'string') {
            eventsParticipated = eventsParticipated.map((eventId: string) => ({ eventId }));
          }

          return {
            pmt_id: data.pmt_id || doc.id,
            first: data.first || '',
            last: data.last || '',
            gym: data.gym || '',
            email: data.email || '',
            weightclasses: data.weightclasses || [],
            weightclass: data.weightclass || (data.weightclasses && data.weightclasses.length > 0 ? data.weightclasses[0] : 0),
            age: data.age || 0,
            gender: data.gender || '',
            win: data.win || 0,
            loss: data.loss || 0,
            nc: data.nc || 0,
            dq: data.dq || 0,
            photo: data.photo || '',
            fights: data.fights || [],
            events_participated: eventsParticipated,
            bodykick: data.bodykick || 0,
            boxing: data.boxing || 0,
            clinch: data.clinch || 0,
            defense: data.defense || 0,
            footwork: data.footwork || 0,
            headkick: data.headkick || 0,
            kicks: data.kicks || 0,
            knees: data.knees || 0,
            legkick: data.legkick || 0,
            ringawareness: data.ringawareness || 0,
            searchKeywords: data.searchKeywords || [],
            dob: data.dob || '',
            lastUpdated: data.lastUpdated || '',
          } as PmtFighterRecord;
        });
      
      // Only apply additional sorting if the server sort is different from client sort
      let sortedFighters = newFighters;
      if (
        (sortField === 'win' && sortDirection === 'asc') || 
        (sortField !== 'win' && queryField !== sortField)
      ) {
        sortedFighters = sortFighters(newFighters, sortField, sortDirection);
      }
      
      if (isInitial) {
        setFighters(sortedFighters);
      } else {
        setFighters(prev => {
          const combined = [...prev, ...sortedFighters];
          return sortFighters(combined, sortField, sortDirection);
        });
      }
    } catch (error) {
      console.error(`Error loading fighters for ${year}:`, error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, lastDoc, sortField, sortDirection]);
  
  // Function to sort fighters by different fields
  const sortFighters = (fighters: PmtFighterRecord[], field: SortField, direction: SortDirection) => {
    return [...fighters].sort((a, b) => {
      let valueA, valueB;
      
      switch (field) {
        case 'win':
          valueA = a.win || 0;
          valueB = b.win || 0;
          break;
        case 'last':
          valueA = a.last || '';
          valueB = b.last || '';
          break;
        case 'events_participated':
          valueA = Array.isArray(a.events_participated) ? a.events_participated.length : (a.fights?.length || 0);
          valueB = Array.isArray(b.events_participated) ? b.events_participated.length : (b.fights?.length || 0);
          break;
        default:
          valueA = a[field] || 0;
          valueB = b[field] || 0;
      }
      
      if (typeof valueA === 'string' && typeof valueB === 'string') {
        return direction === 'asc' 
          ? valueA.localeCompare(valueB) 
          : valueB.localeCompare(valueA);
      }
      
      return direction === 'asc' 
        ? (valueA as number) - (valueB as number) 
        : (valueB as number) - (valueA as number);
    });
  };
  
  // Search fighters in the current collection
  const searchFighters = useCallback(async (term: string, year: string, field: SearchField) => {
    if (!term || term.length < SEARCH_MIN_CHARS) {
      // Clear search results if term is too short
      setIsSearching(false);
      setSearchResults([]);
      setNoSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      const collectionName = `pmt_records_${year}`;
      
      const searchTermUpper = term.toUpperCase();
      
      // Different query strategies based on field
      let searchQuery: Query<DocumentData>;
      
      // For better search, we'll leverage searchKeywords if available
      if (field === 'all') {
        // Try to use a query that orders by win count directly if searching all fields
        let initialQuery;
        
        try {
          // First attempt to query ordered by win (most wins first), filtered by keywords
          // This provides a win-sorted result by default
          initialQuery = query(
            collection(pmtDb, collectionName),
            orderBy('win', 'desc'),
            where('searchKeywords', 'array-contains', searchTermUpper),
            limit(20)
          );
          
          const initialSnapshot = await getDocs(initialQuery);
          
          // If we got results, process them
          if (!initialSnapshot.empty) {
            const results = initialSnapshot.docs
              .filter(doc => doc.id !== 'metadata' && doc.id !== 'errors')
              .map(doc => {
                const data = doc.data();
                return {
                  pmt_id: data.pmt_id || doc.id,
                  first: data.first || '',
                  last: data.last || '',
                  gym: data.gym || '',
                  email: data.email || '',
                  weightclasses: data.weightclasses || [],
                  weightclass: data.weightclass || (data.weightclasses && data.weightclasses.length > 0 ? data.weightclasses[0] : 0),
                  age: data.age || 0,
                  gender: data.gender || '',
                  win: data.win || 0,
                  loss: data.loss || 0,
                  nc: data.nc || 0,
                  dq: data.dq || 0,
                  photo: data.photo || '',
                  fights: data.fights || [],
                  events_participated: data.events_participated || [],
                  bodykick: data.bodykick || 0,
                  boxing: data.boxing || 0,
                  clinch: data.clinch || 0,
                  defense: data.defense || 0,
                  footwork: data.footwork || 0,
                  headkick: data.headkick || 0,
                  kicks: data.kicks || 0,
                  knees: data.knees || 0,
                  legkick: data.legkick || 0,
                  ringawareness: data.ringawareness || 0,
                  searchKeywords: data.searchKeywords || [],
                  dob: data.dob || '',
                  lastUpdated: data.lastUpdated || '',
                } as PmtFighterRecord;
              });
            
            setSearchResults(results);
            setNoSearchResults(results.length === 0);
            setIsSearching(false);
            return; // Exit early if we found results this way
          }
        } catch (initialError) {
          console.log('Initial win-sorted search failed, falling back to standard search:', initialError);
          // Continue with standard multi-query approach
        }
        
        // We can't really do an OR query directly in Firestore, so we'll do multiple queries
        // and combine results client-side
        const queries = [
          // Search by first name
          query(
            collection(pmtDb, collectionName),
            orderBy('first'),
            where('first', '>=', searchTermUpper),
            where('first', '<=', searchTermUpper + '\uf8ff'),
            limit(10)
          ),
          // Search by last name
          query(
            collection(pmtDb, collectionName),
            orderBy('last'),
            where('last', '>=', searchTermUpper),
            where('last', '<=', searchTermUpper + '\uf8ff'),
            limit(10)
          ),
          // Search by gym
          query(
            collection(pmtDb, collectionName),
            orderBy('gym'),
            where('gym', '>=', searchTermUpper),
            where('gym', '<=', searchTermUpper + '\uf8ff'),
            limit(10)
          ),
          // Search by searchKeywords if available
          query(
            collection(pmtDb, collectionName),
            where('searchKeywords', 'array-contains', searchTermUpper),
            limit(10)
          )
        ];
        
        // Execute all queries in parallel
        const queryResults = await Promise.all(queries.map(q => getDocs(q)));
        
        // Combine results and remove duplicates (using a Map with pmt_id as key)
        const searchResultsMap = new Map<string, PmtFighterRecord>();
        
        queryResults.forEach(snapshot => {
          snapshot.docs.forEach(doc => {
            if (doc.id === 'metadata' || doc.id === 'errors') return;
            
            const data = doc.data();
            const fighterId = data.pmt_id || doc.id;
            
            if (!searchResultsMap.has(fighterId)) {
              searchResultsMap.set(fighterId, {
                pmt_id: fighterId,
                first: data.first || '',
                last: data.last || '',
                gym: data.gym || '',
                email: data.email || '',
                weightclasses: data.weightclasses || [],
                weightclass: data.weightclass || (data.weightclasses && data.weightclasses.length > 0 ? data.weightclasses[0] : 0),
                age: data.age || 0,
                gender: data.gender || '',
                win: data.win || 0,
                loss: data.loss || 0,
                nc: data.nc || 0,
                dq: data.dq || 0,
                photo: data.photo || '',
                fights: data.fights || [],
                events_participated: data.events_participated || [],
                bodykick: data.bodykick || 0,
                boxing: data.boxing || 0,
                clinch: data.clinch || 0,
                defense: data.defense || 0,
                footwork: data.footwork || 0,
                headkick: data.headkick || 0,
                kicks: data.kicks || 0,
                knees: data.knees || 0,
                legkick: data.legkick || 0,
                ringawareness: data.ringawareness || 0,
                searchKeywords: data.searchKeywords || [],
                dob: data.dob || '',
                lastUpdated: data.lastUpdated || '',
              } as PmtFighterRecord);
            }
          });
        });
        
        // Convert map to array and sort by wins
        const results = Array.from(searchResultsMap.values());
        const sortedResults = sortFighters(results, 'win', 'desc');
        
        setSearchResults(sortedResults);
        setNoSearchResults(sortedResults.length === 0);
      } else {
        // Single field search
        const fieldToSearch = field;
        
        try {
          // First try a win-sorted query if it's supported in Firestore
          const winSortedQuery = query(
            collection(pmtDb, collectionName),
            orderBy('win', 'desc'),
            orderBy(fieldToSearch),
            where(fieldToSearch, '>=', searchTermUpper),
            where(fieldToSearch, '<=', searchTermUpper + '\uf8ff'),
            limit(20)
          );
          
          const snapshot = await getDocs(winSortedQuery);
          
          // Process results
          const results = snapshot.docs
            .filter(doc => doc.id !== 'metadata' && doc.id !== 'errors')
            .map(doc => {
              const data = doc.data();
              return {
                pmt_id: data.pmt_id || doc.id,
                first: data.first || '',
                last: data.last || '',
                gym: data.gym || '',
                email: data.email || '',
                weightclasses: data.weightclasses || [],
                weightclass: data.weightclass || (data.weightclasses && data.weightclasses.length > 0 ? data.weightclasses[0] : 0),
                age: data.age || 0,
                gender: data.gender || '',
                win: data.win || 0,
                loss: data.loss || 0,
                nc: data.nc || 0,
                dq: data.dq || 0,
                photo: data.photo || '',
                fights: data.fights || [],
                events_participated: data.events_participated || [],
                bodykick: data.bodykick || 0,
                boxing: data.boxing || 0,
                clinch: data.clinch || 0,
                defense: data.defense || 0,
                footwork: data.footwork || 0,
                headkick: data.headkick || 0,
                kicks: data.kicks || 0,
                knees: data.knees || 0,
                legkick: data.legkick || 0,
                ringawareness: data.ringawareness || 0,
                searchKeywords: data.searchKeywords || [],
                dob: data.dob || '',
                lastUpdated: data.lastUpdated || '',
              } as PmtFighterRecord;
            });
          
          // Results are already sorted by win (desc) from Firestore
          setSearchResults(results);
          setNoSearchResults(results.length === 0);
        } catch (winSortError) {
          console.log('Win-sorted query failed, falling back to field-only query:', winSortError);
          
          // Fall back to simple field query if compound index doesn't exist
          searchQuery = query(
            collection(pmtDb, collectionName),
            orderBy(fieldToSearch),
            where(fieldToSearch, '>=', searchTermUpper),
            where(fieldToSearch, '<=', searchTermUpper + '\uf8ff'),
            limit(20)
          );
          
          const snapshot = await getDocs(searchQuery);
          
          // Process results
          const results = snapshot.docs
            .filter(doc => doc.id !== 'metadata' && doc.id !== 'errors')
            .map(doc => {
              const data = doc.data();
              return {
                pmt_id: data.pmt_id || doc.id,
                first: data.first || '',
                last: data.last || '',
                gym: data.gym || '',
                email: data.email || '',
                weightclasses: data.weightclasses || [],
                weightclass: data.weightclass || (data.weightclasses && data.weightclasses.length > 0 ? data.weightclasses[0] : 0),
                age: data.age || 0,
                gender: data.gender || '',
                win: data.win || 0,
                loss: data.loss || 0,
                nc: data.nc || 0,
                dq: data.dq || 0,
                photo: data.photo || '',
                fights: data.fights || [],
                events_participated: data.events_participated || [],
                bodykick: data.bodykick || 0,
                boxing: data.boxing || 0,
                clinch: data.clinch || 0,
                defense: data.defense || 0,
                footwork: data.footwork || 0,
                headkick: data.headkick || 0,
                kicks: data.kicks || 0,
                knees: data.knees || 0,
                legkick: data.legkick || 0,
                ringawareness: data.ringawareness || 0,
                searchKeywords: data.searchKeywords || [],
                dob: data.dob || '',
                lastUpdated: data.lastUpdated || '',
              } as PmtFighterRecord;
            });
          
          // Sort client-side by win count
          const sortedResults = sortFighters(results, 'win', 'desc');
          
          setSearchResults(sortedResults);
          setNoSearchResults(sortedResults.length === 0);
        }
      }
    } catch (error) {
      console.error('Error searching fighters:', error);
      setSearchResults([]);
      setNoSearchResults(true);
    } finally {
      setIsSearching(false);
    }
  }, []);
  
  // Create a debounced version of the search function
  const debouncedSearch = useMemo(() => {
    return debounce((term: string, year: string, field: SearchField) => {
      searchFighters(term, year, field);
    }, 500);
  }, [searchFighters]);
  
  // Handle search input changes
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const term = e.target.value;
    setSearchTerm(term);
    
    if (term.length < SEARCH_MIN_CHARS) {
      // Clear search results if term is too short
      setIsSearching(false);
      setSearchResults([]);
      setNoSearchResults(false);
      return;
    }
    
    setIsSearching(true);
    debouncedSearch(term, selectedYear, searchField);
  };
  
  // Handle search field changes
  const handleSearchFieldChange = (field: SearchField) => {
    setSearchField(field);
    
    // Re-run search with new field if we have a term
    if (searchTerm.length >= SEARCH_MIN_CHARS) {
      setIsSearching(true);
      debouncedSearch(searchTerm, selectedYear, field);
    }
  };
  
  // Clear search
  const clearSearch = () => {
    setSearchTerm('');
    setIsSearching(false);
    setSearchResults([]);
    setNoSearchResults(false);
  };
  
  // Handle sort change
  const handleSortChange = (field: SortField) => {
    if (field === sortField) {
      // Toggle direction if clicking the same field
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new field with default direction (desc for win, asc for name)
      setSortField(field);
      setSortDirection(field === 'win' ? 'desc' : 'asc');
    }
    
    // If searching, sort search results
    if (searchTerm.length >= SEARCH_MIN_CHARS && searchResults.length > 0) {
      setSearchResults(sortFighters(searchResults, field, 
        field === sortField && sortDirection === 'asc' ? 'desc' : 
        field === 'win' ? 'desc' : 'asc'
      ));
    } else {
      // Re-fetch data with new sort (and reset pagination)
      loadFighters(selectedYear, true);
    }
  };
  
  // Handle tab change
  const handleYearChange = async (year: string) => {
    if (year !== selectedYear) {
      setSelectedYear(year);
      
      // If searching, re-run search with new year
      if (searchTerm.length >= SEARCH_MIN_CHARS) {
        setIsSearching(true);
        debouncedSearch(searchTerm, year, searchField);
      } else {
        await loadFighters(year, true);
      }
    }
  };

  // Handle load more
  const handleLoadMore = () => {
    if (!loading && hasMore && !isSearching) {
      loadFighters(selectedYear);
    }
  };

  // If still in initial loading state
  if (initialLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <Loader2 className="animate-spin h-12 w-12 mb-4 text-primary" />
        <p>Discovering available fighter databases...</p>
      </div>
    );
  }

  // If no years are available
  if (availableYears.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64">
        <p className="text-xl font-semibold">No fighter databases found</p>
        <p className="text-muted-foreground">Please process fighter records first</p>
      </div>
    );
  }

  // Render sort icon
  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' 
      ? <ChevronUp className="ml-1 h-4 w-4 inline" />
      : <ChevronDown className="ml-1 h-4 w-4 inline" />;
  };

  // Calculate which fighters to display
  const displayedFighters = searchTerm.length >= SEARCH_MIN_CHARS ? searchResults : fighters;

  return (
    <div className="w-full">
      <Tabs defaultValue={selectedYear} onValueChange={handleYearChange}>
        <div className="flex justify-center items-center mb-4">
         
         
        <TabsList className="flex bg-gray-100 p-1 rounded-lg">
  {availableYears.map(year => (
    <TabsTrigger 
      key={year} 
      value={year} 
      className="relative px-5 py-2 text-sm font-medium text-gray-600 transition-all
      data-[state=active]:text-gray-900 data-[state=active]:font-semibold
      hover:text-gray-900"
    >
      <div className="absolute inset-0 bg-white rounded-md opacity-0 transition-opacity data-[state=active]:opacity-100"></div>
      <div className="relative flex items-center">
        {year}
      </div>
    </TabsTrigger>
  ))}
</TabsList>



        </div>

        {availableYears.map(year => (
          <TabsContent key={year} value={year} className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
                  <div>
                    <CardTitle
                    className='text-center md:text-left text-lg font-semibold'
                    >
                      {year} Fighter Records
                    </CardTitle>
                    <CardDescription className='text-center'>
                      {yearMetadata[year] && (
                        <>
                          {yearMetadata[year].totalFighters} fighters
                          {yearMetadata[year].processedEvents?.length > 0 && 
                            ` from ${yearMetadata[year].processedEvents.length} events`}
                        </>
                      )}
                    </CardDescription>
                  </div>
                  
                  {/* Search Bar */}
                  <div className="relative w-full md:w-72">
                    <div className="relative">
                      <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="text"
                        placeholder="Search fighters..."
                        value={searchTerm}
                        onChange={handleSearchChange}
                        className="pl-8 pr-8"
                      />
                      {searchTerm && (
                        <button 
                          onClick={clearSearch}
                          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    
                    {/* Search options */}
                    <div className="flex gap-1 mt-1">
                      <Badge 
                        variant={searchField === 'all' ? 'default' : 'outline'} 
                        className="cursor-pointer text-xs"
                        onClick={() => handleSearchFieldChange('all')}
                      >
                        All
                      </Badge>
                      <Badge 
                        variant={searchField === 'first' ? 'default' : 'outline'} 
                        className="cursor-pointer text-xs"
                        onClick={() => handleSearchFieldChange('first')}
                      >
                        First Name
                      </Badge>
                      <Badge 
                        variant={searchField === 'last' ? 'default' : 'outline'} 
                        className="cursor-pointer text-xs"
                        onClick={() => handleSearchFieldChange('last')}
                      >
                        Last Name
                      </Badge>
                      <Badge 
                        variant={searchField === 'gym' ? 'default' : 'outline'} 
                        className="cursor-pointer text-xs"
                        onClick={() => handleSearchFieldChange('gym')}
                      >
                        Gym
                      </Badge>
                    </div>
                    
                    {/* Minimum character indicator */}
                    {searchTerm && searchTerm.length < SEARCH_MIN_CHARS && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Type at least {SEARCH_MIN_CHARS} characters to search
                      </div>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Search status */}
                {isSearching && (
                  <div className="flex items-center justify-center py-2 mb-2">
                    <Loader2 className="animate-spin h-4 w-4 mr-2" />
                    <span className="text-sm">Searching...</span>
                  </div>
                )}
                
                {searchTerm.length >= SEARCH_MIN_CHARS && !isSearching && (
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-sm">
                      {noSearchResults 
                        ? `No fighters found matching "${searchTerm}"` 
                        : `Found ${searchResults.length} fighter${searchResults.length !== 1 ? 's' : ''} matching "${searchTerm}"`}
                    </div>
                    {searchResults.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={clearSearch}>
                        Clear Search
                      </Button>
                    )}
                  </div>
                )}
                
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-muted/50">
                        <th className="p-2">Name</th>
                        <th className="p-2">Gym</th>
                        <th className="p-2">Weight</th>
                        <th 
                          className="p-2 cursor-pointer select-none" 
                          onClick={() => handleSortChange('win')}
                        >
                          Record <SortIcon field="win" />
                        </th>
                        <th 
                          className="p-2 cursor-pointer select-none"
                          onClick={() => handleSortChange('events_participated')}
                        >
                          Events <SortIcon field="events_participated" />
                        </th>

                        <th className="p-2">Skill</th>
                      
                      </tr>
                    </thead>
                    <tbody>
                      {displayedFighters.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="text-center py-8">
                            {loading ? 'Loading fighters...' : noSearchResults ? 'No matching fighters found' : 'No fighters found'}
                          </td>
                        </tr>
                      ) : (
                        displayedFighters.map((fighter) => (
                          <tr key={fighter.pmt_id} className="hover:bg-muted/50 cursor-pointer border-b">
                            <td className="p-2">
                              <div className="font-medium">{fighter.first} {fighter.last}</div>
                              <div className="text-xs text-muted-foreground">{fighter.gender}, {fighter.age || 'N/A'}</div>
                            </td>
                            <td className="p-2">{fighter.gym}</td>
                            <td className="p-2">
                              {Array.isArray(fighter.weightclasses) && fighter.weightclasses.length > 0 
                                ? fighter.weightclasses.join(', ') 
                                : fighter.weightclass || 'N/A'}
                            </td>
                            <td className="p-2">
                            <span className="font-medium">{fighter.win || 0}-{fighter.loss || 0}</span>
                              {((fighter.nc ?? 0) > 0 || (fighter.dq ?? 0) > 0) && (
                                <span className="text-xs text-muted-foreground ml-1">
                                  {(fighter.nc ?? 0) > 0 ? `-${fighter.nc}NC` : ''}
                                  {(fighter.dq ?? 0) > 0 ? `-${fighter.dq}DQ` : ''}
                                </span>
                              )}
                            </td>

                           <td className="p-2">
  {(() => {
    if (Array.isArray(fighter.events_participated)) {
      if (fighter.events_participated.length > 0) {
        // Check if it's an array of objects or strings
        if (typeof fighter.events_participated[0] === 'string') {
          return fighter.events_participated.length;
        } else if (typeof fighter.events_participated[0] === 'object') {
          return fighter.events_participated.length;
        }
      }
      return fighter.events_participated.length;
    }
    return fighter.fights?.length || 0;
  })()}
  Event
</td>


                            <td className="p-2 flex flex-col">
                            {fighter.bodykick != null && fighter.bodykick > 0 && <span className="text-xs text-muted-foreground">Bodykick-{fighter.bodykick ?? 0}</span>}
                            {fighter.boxing != null && fighter.boxing > 0 && <span className="text-xs text-muted-foreground">Boxing-{fighter.boxing ?? 0}</span>}
                            {fighter.clinch != null && fighter.clinch > 0 && <span className="text-xs text-muted-foreground">Clinch-{fighter.clinch ?? 0}</span>}
                            {fighter.defense != null && fighter.defense > 0 && <span className="text-xs text-muted-foreground">Defense-{fighter.defense ?? 0}</span>}
                            {fighter.footwork != null && fighter.footwork > 0 && <span className="text-xs text-muted-foreground">Footwork-{fighter.footwork ?? 0}</span>}
                            {fighter.headkick != null && fighter.headkick > 0 && <span className="text-xs text-muted-foreground">Headkick-{fighter.headkick ?? 0}</span>}
                            {fighter.kicks != null && fighter.kicks > 0 && <span className="text-xs text-muted-foreground">Kicks-{fighter.kicks ?? 0}</span>}
                            {fighter.knees != null && fighter.knees > 0 && <span className="text-xs text-muted-foreground">Knees-{fighter.knees ?? 0}</span>}
                            {fighter.legkick != null && fighter.legkick > 0 && <span className="text-xs text-muted-foreground">Legkick-{fighter.legkick ?? 0}</span>}
                            {fighter.ringawareness != null && fighter.ringawareness > 0 && <span className="text-xs text-muted-foreground">Ring Awareness-{fighter.ringawareness ?? 0}</span>}

                         
                           
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                {/* Load more button - Only show when not searching */}
                {!searchTerm && hasMore && (
                  <div className="flex justify-center mt-6">
                    <Button 
                      variant="outline" 
                      onClick={handleLoadMore} 
                      disabled={loading}
                      className="gap-2"
                    >
                      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                      Load More Fighters
                    </Button>
                  </div>
                )}
                
                {!hasMore && fighters.length > 0 && !searchTerm && (
                  <div className="text-center text-muted-foreground mt-6">
                    {fighters.length >= yearMetadata[year]?.totalFighters 
                      ? 'All fighters loaded' 
                      : `Showing ${fighters.length} of ${yearMetadata[year]?.totalFighters} fighters`}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
};

export default TabbedFighterDatabase;