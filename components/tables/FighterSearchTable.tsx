// components/MultiTermSearch.tsx
'use client';

import React, { useState, useEffect } from 'react';
import FighterTable from '@/components/FightersTable';
import { Fighter } from '@/utils/records/fetchFighters';

interface MultiTermSearchProps {
  initialFighters: Fighter[];
  sanctioning: string;
  year: string;
}

const FighterSearchTable: React.FC<MultiTermSearchProps> = ({ initialFighters, sanctioning, year }) => {
  const [terms, setTerms] = useState<string[]>([]);
  const [currentTerm, setCurrentTerm] = useState('');
  const [fighters, setFighters] = useState<Fighter[]>(initialFighters);
  const [loading, setLoading] = useState(false);

  // Restrict input to one word by removing spaces
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentTerm(e.target.value.replace(/\s/g, ''));
  };

  // Add the current term to the list when the user clicks the + button
  const addTerm = () => {
    if (currentTerm && !terms.includes(currentTerm)) {
      setTerms([...terms, currentTerm]);
      setCurrentTerm('');
    }
  };

  // Optionally, allow removing a term from the list
  const removeTerm = (term: string) => {
    setTerms(terms.filter((t) => t !== term));
  };

  // When the search terms change, call the API to search for matching fighters.
  useEffect(() => {
    if (terms.length > 0) {
      const fetchSearchResults = async () => {
        setLoading(true);
        try {
          // Build a comma-separated string of terms
          const queryParam = terms.join(',');
          const res = await fetch(
            `/api/pmt/fighters/searchFighters?sanctioning=${sanctioning}&year=${year}&terms=${encodeURIComponent(queryParam)}`
          );
          
          const data = await res.json();
          if (res.ok) {
            setFighters(data.fighters);
          } else {
            console.error(data.error);
          }
        } catch (error) {
          console.error('Error fetching search results:', error);
        } finally {
          setLoading(false);
        }
      };
      fetchSearchResults();
    } else {
      // Reset to the initial fighter list if no terms are entered
      setFighters(initialFighters);
    }
  }, [terms, initialFighters, sanctioning, year]);

  return (
    <div>
      <div className="flex items-center space-x-2">
        <input
          type="text"
          placeholder="Enter one word (no spaces)..."
          value={currentTerm}
          onChange={handleInputChange}
          className="border rounded px-2 py-1 w-full"
        />
        <button onClick={addTerm} className="px-4 py-1 bg-blue-500 text-white rounded">
          +
        </button>
      </div>
      {terms.length > 0 && (
        <div className="mt-2">
          <span>Search terms: </span>
          {terms.map((term, index) => (
            <span key={index} className="inline-block bg-gray-200 px-2 py-1 mr-2 rounded">
              {term}
              <button onClick={() => removeTerm(term)} className="ml-1 text-red-500">
                x
              </button>
            </span>
          ))}
        </div>
      )}
      {loading ? <p>Loading...</p> : <FighterTable fighters={fighters} />}
    </div>
  );
};

export default FighterSearchTable;