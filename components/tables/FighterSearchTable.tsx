// components/tables/FighterSearchTable.tsx
'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import FighterTable from '@/components/tables/FightersTable';
import { Input } from "@/components/ui/input";
import { FullContactFighter } from '@/utils/types';
import { Button } from "@/components/ui/button";

interface FighterSearchProps {
  initialFighters: FullContactFighter[];
  year: string;
  totalCount?: number;
}

const ITEMS_PER_PAGE = 50; // Number of fighters to load at once

const FighterSearchTable: React.FC<FighterSearchProps> = ({ initialFighters, year, totalCount = 0 }) => {
  const [searchInput, setSearchInput] = useState('');
  const [terms, setTerms] = useState<string[]>([]);
  const [allFighters, setAllFighters] = useState<FullContactFighter[]>(initialFighters);
  const [displayedFighters, setDisplayedFighters] = useState<FullContactFighter[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const observer = useRef<IntersectionObserver | null>(null);
  const lastFighterElementRef = useRef<HTMLDivElement>(null);

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

  // Load more fighters when scrolling
  const loadMoreFighters = useCallback(() => {
    if (loading) return;
    
    setLoading(true);
    
    const start = (page - 1) * ITEMS_PER_PAGE;
    const end = page * ITEMS_PER_PAGE;
    const newFighters = allFighters.slice(start, end);
    
    // If we're at page 1, replace the displayed fighters
    // Otherwise, append the new fighters
    if (page === 1) {
      setDisplayedFighters(newFighters);
    } else {
      setDisplayedFighters(prev => [...prev, ...newFighters]);
    }
    
    setHasMore(end < allFighters.length);
    setLoading(false);
    setPage(prevPage => prevPage + 1);
  }, [allFighters, loading, page]);

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
            `/api/fighters/searchFighters?year=${year}&terms=${encodeURIComponent(queryParam)}`
          );
          
          const data = await res.json();
          if (res.ok) {
            setAllFighters(data.fighters);
            setPage(1); // Reset pagination
            setDisplayedFighters(data.fighters.slice(0, ITEMS_PER_PAGE));
            setHasMore(data.fighters.length > ITEMS_PER_PAGE);
          } else {
            console.error(data.error);
          }
        } else {
          // Reset to initial fighters if no search terms
          setAllFighters(initialFighters);
          setPage(1); // Reset pagination
          setDisplayedFighters(initialFighters.slice(0, ITEMS_PER_PAGE));
          setHasMore(initialFighters.length > ITEMS_PER_PAGE);
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
  }, [terms, initialFighters, year]);

  // Load the first page when the component mounts
  useEffect(() => {
    setAllFighters(initialFighters);
    setDisplayedFighters(initialFighters.slice(0, ITEMS_PER_PAGE));
    setHasMore(initialFighters.length > ITEMS_PER_PAGE);
  }, [initialFighters]);

  return (
    <div>
      <div className="mb-4 sticky top-0 bg-white z-10 p-4 shadow-md">
        <Input
          placeholder="Search fighters..."
          value={searchInput}
          onChange={handleSearchChange}
          className="w-full"
        />
        <div className="text-sm text-gray-500 mt-2">
          Showing {displayedFighters.length} of {allFighters.length} fighters
          {totalCount > allFighters.length && ` (${totalCount} total in database)`}
        </div>
      </div>
      
      {searchLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          <FighterTable fighters={displayedFighters} />
          
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

export default FighterSearchTable;