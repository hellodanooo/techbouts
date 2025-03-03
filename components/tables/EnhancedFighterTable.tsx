'use client';

import React, { useState, useEffect, useRef, useCallback, useMemo, memo } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import { FullContactFighter } from '@/utils/types';

interface FighterTableProps {
  initialFighters: FullContactFighter[];
  totalCount?: number;
  editable?: boolean;
  onEditFighter?: (fighter: FullContactFighter) => void;
  onDeleteFighter?: (fighterId: string) => void;
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
    router.push(`/fighter/${fighter.fighter_id}`);
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
              onDeleteFighter?.(fighter.fighter_id);
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
  onDeleteFighter
}) => {
  // Search and API state
  const [searchInput, setSearchInput] = useState('');
  const [terms, setTerms] = useState<string[]>([]);
  const [allFighters, setAllFighters] = useState<FullContactFighter[]>(initialFighters);
  const [displayedFighters, setDisplayedFighters] = useState<FullContactFighter[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
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

  // Extract unique values for filters from all fighters
  const filterOptions = useMemo(() => {
    return {
      gyms: [...new Set(allFighters.map(f => f.gym))].filter(Boolean).sort(),
      weightClasses: [...new Set(allFighters.map(f => f.weightclass))].sort((a, b) => Number(a) - Number(b)),
      genders: [...new Set(allFighters.map(f => {
        const gender = f.gender || '';
        return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
      }))].filter(Boolean).sort(),
      states: [...new Set(allFighters.map(f => f.state || 'Unknown'))].filter(Boolean).sort(),
    };
  }, [allFighters]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchInput(value);
    
    // Convert input to search terms
    const newTerms = value
      .trim()
      .split(/\s+/)
      .filter(term => term.length > 0);
    
    setTerms(newTerms);
    setPage(1); // Reset pagination when search changes
  };

  // Handle sorting
  const handleSort = (key: keyof FullContactFighter) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
    setPage(1); // Reset pagination when sorting changes
  };

  // Filter fighters based on filters and search
  const filteredFighters = useMemo(() => {
    return allFighters.filter(fighter => {
      // Search term filtering
      const searchMatch = terms.length === 0 || terms.every(term => {
        const searchableText = `
          ${fighter.first?.toLowerCase() || ''} 
          ${fighter.last?.toLowerCase() || ''} 
          ${fighter.gym?.toLowerCase() || ''}
          ${fighter.email?.toLowerCase() || ''}
          ${fighter.class?.toLowerCase() || ''}
        `;
        return searchableText.includes(term.toLowerCase());
      });
      
      // Dropdown filtering
      const gymMatch = !selectedGym || fighter.gym === selectedGym;
      const weightMatch = !selectedWeightClass || fighter.weightclass === Number(selectedWeightClass);
      const genderMatch = !selectedGender || fighter.gender?.toLowerCase() === selectedGender.toLowerCase();
      const stateMatch = !selectedState || fighter.state === selectedState;
      
      return searchMatch && gymMatch && weightMatch && genderMatch && stateMatch;
    });
  }, [allFighters, terms, selectedGym, selectedWeightClass, selectedGender, selectedState]);

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

  // Load more fighters when scrolling
  const loadMoreFighters = useCallback(() => {
    if (loading) return;
    
    setLoading(true);
    
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = page * ITEMS_PER_PAGE;
    const newFighters = sortedFighters.slice(start, end);
    
    // If we're at page 1, replace the displayed fighters
    // Otherwise, append the new fighters
    if (page === 1) {
      setDisplayedFighters(newFighters);
    } else {
      setDisplayedFighters(prev => [...prev, ...newFighters]);
    }
    
    setHasMore(end < sortedFighters.length);
    setLoading(false);
    setPage(prevPage => prevPage + 1);
  }, [sortedFighters, loading, page]);

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

  // When the search terms change, call the API to search for matching fighters
  useEffect(() => {
    const fetchSearchResults = async () => {
      setSearchLoading(true);
      try {
        if (terms.length > 0) {
          // Build a comma-separated string of terms
          const queryParam = terms.join(',');
          const res = await fetch(
            `/api/fighters/searchFighters?year=${'2025'}&terms=${encodeURIComponent(queryParam)}`
          );
          
          const data = await res.json();
          if (res.ok) {
            setAllFighters(data.fighters);
            setPage(1); // Reset pagination
          } else {
            console.error(data.error);
          }
        } else {
          // Reset to initial fighters if no search terms
          setAllFighters(initialFighters);
          setPage(1); // Reset pagination
        }
      } catch (error) {
        console.error('Error fetching search results:', error);
      } finally {
        setSearchLoading(false);
      }
    };

    // Add a small delay to prevent too many API calls while typing
    const timeoutId = setTimeout(fetchSearchResults, 300);
    return () => clearTimeout(timeoutId);
  }, [terms, initialFighters]);

  // Reset displayed fighters when filters or sorting changes
  useEffect(() => {
    setDisplayedFighters(sortedFighters.slice(0, page * ITEMS_PER_PAGE));
    setHasMore(page * ITEMS_PER_PAGE < sortedFighters.length);
  }, [sortedFighters, page]);

  // Load the first page when the component mounts
  useEffect(() => {
    setAllFighters(initialFighters);
    setPage(1);
  }, [initialFighters]);

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
        {/* Main search */}
        <Input
          placeholder="Search fighters..."
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full"
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
          Showing {displayedFighters.length} of {filteredFighters.length} fighters
          {totalCount > allFighters.length && ` (${totalCount} total in database)`}
        </div>
      </div>
      
      {searchLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
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
                {displayedFighters.length === 0 ? (
                  <tr>
                    <td colSpan={editable ? 10 : 9} className="text-center py-8">
                      No fighters found
                    </td>
                  </tr>
                ) : (
                  displayedFighters.map((fighter) => (
                    <FighterRow
                      key={fighter.fighter_id}
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
          
          {/* Load more trigger element */}
          <div ref={lastFighterElementRef} className="h-20 flex items-center justify-center">
            {loading && hasMore && (
              <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
            )}
          </div>
          
          {/* Manual load more button as fallback */}
          {hasMore && !loading && (
            <div className="flex justify-center pb-8">
              <Button 
                onClick={loadMoreFighters}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                Load More
              </Button>
            </div>
          )}
          
          {!hasMore && displayedFighters.length > 0 && (
            <div className="text-center text-gray-500 pb-8">
              No more fighters to load
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default EnhancedFighterTable;