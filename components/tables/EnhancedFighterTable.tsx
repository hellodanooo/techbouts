'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import { FullContactFighter } from '@/utils/types';
import FighterSearch from '@/components/searchbars/FighterSearch';

interface FighterTableProps {
  initialFighters: FullContactFighter[];
  totalCount?: number;
  editable?: boolean;
  onEditFighter?: (fighter: FullContactFighter) => void;
  onDeleteFighter?: (fighterId: string) => void;
  initialNextLastDocId?: string | null;
  initialHasMore?: boolean;
}

type SortConfig = {
  key: keyof FullContactFighter;
  direction: 'asc' | 'desc';
};

const ITEMS_PER_PAGE = 50; // Number of fighters to load at once
const defaultPhotoUrl = '/images/techbouts_fighter_icon.png';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Memoized individual fighter row for better performance
const FighterRow = memo(({ 
  fighter, 
  editable, 
  onEditFighter, 
  onDeleteFighter 
}: { 
  fighter: FullContactFighter;
  editable?: boolean;
  onEditFighter?: (fighter: FullContactFighter) => void;
  onDeleteFighter?: (fighterId: string) => void;
}) => {
  const router = useRouter();
  
  const handleRowClick = () => {
    if (fighter.fighter_id) {
      router.push(`/fighter/${fighter.fighter_id}`);
    }
  };
  
  return (
    <tr 
      className="hover:bg-gray-50 cursor-pointer border-b"
      onClick={handleRowClick}
    >
      <td className="p-2">
        <Image
          src={isValidUrl(fighter.photo || '') ? fighter.photo! : defaultPhotoUrl}
          alt={`${fighter.first} ${fighter.last}`}
          width={50}
          height={50}
          className="rounded-full object-cover"
        />
      </td>
      <td className="p-2">{fighter.first}</td>
      <td className="p-2">{fighter.last}</td>
      <td className="p-2">{fighter.weightclass}</td>
      <td className="p-2">{fighter.gym}</td>
      <td className="p-2">{fighter.age}</td>
      <td className="p-2">{fighter.gender}</td>
      <td className="p-2">{fighter.mt_win}</td>
      <td className="p-2">{fighter.mt_loss}</td>
      
      {editable && (
        <td className="p-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onEditFighter?.(fighter);
            }}
            className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (fighter.fighter_id) {
                onDeleteFighter?.(fighter.fighter_id);
              }
            }}
            className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
          >
            Delete
          </button>
        </td>
      )}
    </tr>
  );
});

FighterRow.displayName = 'FighterRow';

const EnhancedFighterTable: React.FC<FighterTableProps> = ({ 
  initialFighters, 
  totalCount = 0,
  editable = false,
  onEditFighter,
  onDeleteFighter,
  initialNextLastDocId = null,
  initialHasMore = true
}) => {
  // Fighter state
  const [fighters, setFighters] = useState<FullContactFighter[]>(initialFighters);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [nextLastDocId, setNextLastDocId] = useState<string | null>(initialNextLastDocId);
  const [searchMode, setSearchMode] = useState(false);
  
  // Filtering state
  const [selectedGym, setSelectedGym] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedState, setSelectedState] = useState('');
  
  // Sorting state
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'last', direction: 'asc' });
  
  // Refs for infinite scrolling
  const observer = useRef<IntersectionObserver | null>(null);
  const lastFighterElementRef = useRef<HTMLDivElement>(null);

  // Extract unique values for filters from fighters
  const filterOptions = useMemo(() => {
    return {
      gyms: [...new Set(fighters.map(f => f.gym))].filter(Boolean).sort(),
      weightClasses: [...new Set(fighters.map(f => f.weightclass))]
        .filter(Boolean)
        .sort((a, b) => Number(a) - Number(b)),
      genders: [...new Set(fighters.map(f => {
        const gender = f.gender || '';
        return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      }))].filter(Boolean).sort(),
      states: [...new Set(fighters.map(f => f.state || 'Unknown'))].filter(Boolean).sort(),
    };
  }, [fighters]);

  // Handle sorting
  const handleSort = (key: keyof FullContactFighter) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter fighters based on filters
  const filteredFighters = useMemo(() => {
    return fighters.filter(fighter => {
      // Dropdown filtering
      const gymMatch = !selectedGym || fighter.gym === selectedGym;
      const weightMatch = !selectedWeightClass || fighter.weightclass === Number(selectedWeightClass);
      const genderMatch = !selectedGender || 
        fighter.gender?.toLowerCase() === selectedGender.toLowerCase();
      const stateMatch = !selectedState || fighter.state === selectedState;
      
      return gymMatch && weightMatch && genderMatch && stateMatch;
    });
  }, [fighters, selectedGym, selectedWeightClass, selectedGender, selectedState]);

  // Sort filtered fighters
  const sortedFighters = useMemo(() => {
    return [...filteredFighters].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortConfig.direction === 'asc' 
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }
      
      return sortConfig.direction === 'asc'
        ? Number(aValue || 0) - Number(bValue || 0)
        : Number(bValue || 0) - Number(aValue || 0);
    });
  }, [filteredFighters, sortConfig]);

  // Load more fighters from the API
  const loadMoreFighters = useCallback(async () => {
    if (loading || !hasMore || !nextLastDocId || searchMode) return;
    
    setLoading(true);
    
    try {
      const res = await fetch(`/api/fighters?pageSize=${ITEMS_PER_PAGE}&lastDocId=${nextLastDocId}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch more fighters');
      }
      
      const data = await res.json();
      const newFighters = data.fighters;
      
      if (newFighters && newFighters.length > 0) {
        setFighters(prev => [...prev, ...newFighters]);
        setNextLastDocId(data.pagination.nextLastDocId);
        setHasMore(data.pagination.hasMore);
      } else {
        setHasMore(false);
      }
    } catch (error) {
      console.error('Error loading more fighters:', error);
      setHasMore(false);
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, nextLastDocId, searchMode]);

  // Handler for fighter selection from search component
  const handleFighterSelect = (selectedFighter: FullContactFighter) => {
    // When a fighter is selected from search, we'll show just that fighter
    setFighters([selectedFighter]);
    setSearchMode(true);
    setHasMore(false);
  };

  // Reset search results
  const resetSearch = () => {
    setSearchMode(false);
    setFighters(initialFighters);
    setNextLastDocId(initialNextLastDocId);
    setHasMore(initialHasMore);
  };

  // Set up intersection observer for infinite scrolling
  useEffect(() => {
    if (loading) return;
    
    if (observer.current) {
      observer.current.disconnect();
    }
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreFighters();
      }
    }, { threshold: 0.1 });
    
    if (lastFighterElementRef.current) {
      observer.current.observe(lastFighterElementRef.current);
    }
    
    return () => {
      if (observer.current) {
        observer.current.disconnect();
      }
    };
  }, [hasMore, loading, loadMoreFighters]);

  // Reset filters when fighters change significantly (like after a search)
  useEffect(() => {
    if (searchMode) {
      setSelectedGym('');
      setSelectedWeightClass('');
      setSelectedGender('');
      setSelectedState('');
    }
  }, [searchMode]);

  // Sort icon component
  const SortIcon = ({ column }: { column: keyof FullContactFighter }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="inline w-4 h-4" /> : 
      <ChevronDown className="inline w-4 h-4" />;
  };

  return (
    <div className="space-y-4">
      <div className="sticky top-0 bg-white z-10 p-4 shadow-md space-y-4">
        {/* Main search - Using the FighterSearch component */}
        <FighterSearch 
          onFighterSelect={handleFighterSelect}
          showCard={false}
          searchResultLimit={10}
        />
        
        {/* Filter options */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <select
            value={selectedGym}
            onChange={(e) => setSelectedGym(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All Gyms</option>
            {filterOptions.gyms.map(gym => (
              <option key={gym} value={gym}>{gym}</option>
            ))}
          </select>

          <select
            value={selectedWeightClass}
            onChange={(e) => setSelectedWeightClass(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All Weight Classes</option>
            {filterOptions.weightClasses.map((weight, index) => (
              <option key={`weight-${weight}-${index}`} value={weight}>{weight}</option>
            ))}
          </select>

          <select
            value={selectedGender}
            onChange={(e) => setSelectedGender(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All Genders</option>
            {filterOptions.genders.map(gender => (
              <option key={gender} value={gender.toLowerCase()}>{gender}</option>
            ))}
          </select>

          <select
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full p-2 border rounded"
          >
            <option value="">All States</option>
            {filterOptions.states.map(state => (
              <option key={state} value={state}>{state}</option>
            ))}
          </select>
        </div>
        
        {/* Status display */}
        <div className="text-sm text-gray-500">
          {searchMode ? (
            `Found ${sortedFighters.length} matching fighters`
          ) : (
            `Showing ${sortedFighters.length} fighters ${totalCount > 0 ? `(${totalCount} total)` : ''}`
          )}
        </div>
      </div>
      
      {/* {searchLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : ( 
        <>*/}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-100">
                  <th className="p-2">Photo</th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('first')}>
                    First Name <SortIcon column="first" />
                  </th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('last')}>
                    Last Name <SortIcon column="last" />
                  </th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('weightclass')}>
                    Weight <SortIcon column="weightclass" />
                  </th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('gym')}>
                    Gym <SortIcon column="gym" />
                  </th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('age')}>
                    Age <SortIcon column="age" />
                  </th>
                  <th className="p-2">Gender</th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('mt_win')}>
                    Wins <SortIcon column="mt_win" />
                  </th>
                  <th className="p-2 cursor-pointer" onClick={() => handleSort('mt_loss')}>
                    Losses <SortIcon column="mt_loss" />
                  </th>
                  {editable && <th className="p-2">Actions</th>}
                </tr>
              </thead>
              <tbody>
                {sortedFighters.length === 0 ? (
                  <tr>
                    <td colSpan={editable ? 10 : 9} className="text-center py-8">
                      No fighters found
                    </td>
                  </tr>
                ) : (
                  sortedFighters.map((fighter) => (
                    <FighterRow
                      key={fighter.fighter_id || fighter.docId}
                      fighter={fighter}
                      editable={editable}
                      onEditFighter={onEditFighter}
                      onDeleteFighter={onDeleteFighter}
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
          
          {/* Infinite scroll trigger element */}
          {!searchMode && (
            <div ref={lastFighterElementRef} className="h-20 flex items-center justify-center">
              {loading && hasMore && (
                <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
              )}
            </div>
          )}
          
          {/* Manual load more button as fallback */}
          {!searchMode && hasMore && !loading && (
            <div className="flex justify-center pb-8">
              <Button 
                onClick={() => loadMoreFighters()}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Load More
              </Button>
            </div>
          )}
          
          {!hasMore && fighters.length > 0 && !searchMode && (
            <div className="text-center text-gray-500 pb-8">
              All fighters loaded
            </div>
          )}
          
          {/* Reset search button when in search mode */}
          {searchMode && (
            <div className="flex justify-center pb-8">
              <Button 
                onClick={resetSearch}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
              >
                Clear Search
              </Button>
            </div>
          )}
        {/* </>
      )} */}
    </div>
  );
};

export default EnhancedFighterTable;