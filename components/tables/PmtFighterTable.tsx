// components/tables/PmtFighterTable.tsx

'use client';
import React, { useState, useMemo } from 'react';
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from "lucide-react";
import { useRouter } from 'next/navigation';
import { PmtFighterRecord } from '@/utils/types';

type PmtFighterTableProps = {
  fighters: PmtFighterRecord[];
  editable?: boolean;
  onEditFighter?: (fighter: PmtFighterRecord) => void;
  onDeleteFighter?: (pmt_id: string) => void;
};

type SortConfig = {
  key: keyof PmtFighterRecord;
  direction: 'asc' | 'desc';
};

const PmtFighterTable: React.FC<PmtFighterTableProps> = ({ fighters, editable, onEditFighter, onDeleteFighter }) => {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGym, setSelectedGym] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState<number | ''>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'last', direction: 'asc' });

  // Extract unique values for filters
  const gyms = [...new Set(fighters.map(f => f.gym).filter(Boolean))].sort();
  const weightClasses = [...new Set(fighters.map(f => f.weightclass).filter(Boolean))].sort((a, b) => Number(a) - Number(b));

  // Handle sorting
  const handleSort = (key: keyof PmtFighterRecord) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  // Filter and sort fighters
  const filteredAndSortedFighters = useMemo(() => {
    return fighters
      .filter(fighter => {
        const matchesSearch = `${fighter.first} ${fighter.last}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
        const matchesGym = !selectedGym || fighter.gym === selectedGym;
        const matchesWeight = selectedWeightClass === '' || fighter.weightclass === selectedWeightClass;
        
        return matchesSearch && matchesGym && matchesWeight;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        // Handle string values
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        // Handle number values
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortConfig.direction === 'asc'
            ? aValue - bValue
            : bValue - aValue;
        }
        
        // Handle undefined/null values
        if (aValue === undefined || aValue === null) return sortConfig.direction === 'asc' ? -1 : 1;
        if (bValue === undefined || bValue === null) return sortConfig.direction === 'asc' ? 1 : -1;
        
        // Default return for incomparable types
        return 0;
      });
  }, [fighters, searchTerm, selectedGym, selectedWeightClass, sortConfig]);

  const SortIcon = ({ column }: { column: keyof PmtFighterRecord }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="inline w-4 h-4" /> : 
      <ChevronDown className="inline w-4 h-4" />;
  };

  // Handle weight class selection with proper type conversion
  const handleWeightClassChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedWeightClass(value === '' ? '' : Number(value));
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          placeholder="Search fighters..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full"
        />
        
        <select
          value={selectedGym}
          onChange={(e) => setSelectedGym(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="">All Gyms</option>
          {gyms.map(gym => (
            <option key={gym} value={gym}>{gym}</option>
          ))}
        </select>

        <select
          value={selectedWeightClass === '' ? '' : selectedWeightClass.toString()}
          onChange={handleWeightClassChange}
          className="w-full p-2 border rounded"
        >
          <option value="">All Weight Classes</option>
          {weightClasses.map(weight => (
            <option key={String(weight)} value={String(weight)}>{weight}</option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 cursor-pointer" onClick={() => handleSort('first')}>
                First Name <SortIcon column="first" />
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort('last')}>
                Last Name <SortIcon column="last" />
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort('weightclass')}>
                Weight Class <SortIcon column="weightclass" />
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort('gym')}>
                Gym <SortIcon column="gym" />
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort('wins')}>
                Wins <SortIcon column="wins" />
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort('losses')}>
                Losses <SortIcon column="losses" />
              </th>
            
              {editable && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {filteredAndSortedFighters.map((fighter) => (
              <tr 
                key={fighter.pmt_id} 
                className="hover:bg-gray-50 cursor-pointer border-b"
                onClick={() => router.push(`/fighter/${fighter.pmt_id}`)}
              >
                <td className="p-2">{fighter.first}</td>
                <td className="p-2">{fighter.last}</td>
                <td className="p-2">{fighter.weightclass}</td>
                <td className="p-2">{fighter.gym}</td>
                <td className="p-2">{fighter.wins}</td>
                <td className="p-2">{fighter.losses}</td>
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
                        onDeleteFighter?.(fighter.pmt_id);
                      }}
                      className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                    >
                      Delete
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-sm text-gray-500">
        Showing {filteredAndSortedFighters.length} of {fighters.length} fighters
      </div>
    </div>
  );
};

export default PmtFighterTable;