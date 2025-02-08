'use client';
import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { Input } from "@/components/ui/input";
import { ChevronUp, ChevronDown } from "lucide-react";

type Fighter = {
  address: string;
  age: number;
  city: string;
  coach: string;
  coach_phone: string;
  coach_email: string;
  email: string;
  dob: string;
  docId: string;
  fighter_id: string;
  first: string;
  gender: string;
  gym: string;
  gym_id: string;
  height: number;
  last: string;
  loss: number;
  mtp_id: string;
  photo: string;
  state: string;
  website: string;
  weightclass: number;
  win: string | number;
};

type FighterTableProps = {
  fighters: Fighter[];
  editable?: boolean;
  onEditFighter?: (fighter: Fighter) => void;
  onDeleteFighter?: (fighterId: string) => void;
};

type SortConfig = {
  key: keyof Fighter;
  direction: 'asc' | 'desc';
};

const defaultPhotoUrl = '/images/techbouts_fighter_icon.png';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const FighterTable: React.FC<FighterTableProps> = ({ fighters, editable, onEditFighter, onDeleteFighter }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGym, setSelectedGym] = useState('');
  const [selectedWeightClass, setSelectedWeightClass] = useState('');
  const [selectedGender, setSelectedGender] = useState('');
  const [selectedState, setSelectedState] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: 'last', direction: 'asc' });

  // Extract unique values for filters
  const gyms = [...new Set(fighters.map(f => f.gym))].sort();
  const weightClasses = [...new Set(fighters.map(f => f.weightclass))].sort((a, b) => Number(a) - Number(b));
  const genders = [...new Set(fighters.map(f => {
    const gender = f.gender || '';
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  }))].sort();  const states = [...new Set(fighters.map(f => f.state || 'Unknown'))].filter(Boolean).sort();

  // Handle sorting
  const handleSort = (key: keyof Fighter) => {
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
        const matchesWeight = !selectedWeightClass || fighter.weightclass === Number(selectedWeightClass);
        const matchesGender = !selectedGender || fighter.gender?.toLowerCase() === selectedGender.toLowerCase();
        const matchesState = !selectedState || fighter.state === selectedState;
        
        return matchesSearch && matchesGym && matchesWeight && matchesGender && matchesState;
      })
      .sort((a, b) => {
        const aValue = a[sortConfig.key];
        const bValue = b[sortConfig.key];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortConfig.direction === 'asc' 
            ? aValue.localeCompare(bValue)
            : bValue.localeCompare(aValue);
        }
        
        return sortConfig.direction === 'asc'
          ? Number(aValue) - Number(bValue)
          : Number(bValue) - Number(aValue);
      });
  }, [fighters, searchTerm, selectedGym, selectedWeightClass, selectedGender, selectedState, sortConfig]);

  const SortIcon = ({ column }: { column: keyof Fighter }) => {
    if (sortConfig.key !== column) return null;
    return sortConfig.direction === 'asc' ? 
      <ChevronUp className="inline w-4 h-4" /> : 
      <ChevronDown className="inline w-4 h-4" />;
  };


  return (
    <div className="space-y-4">
     
     <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
    value={selectedWeightClass}
    onChange={(e) => setSelectedWeightClass(e.target.value)}
    className="w-full p-2 border rounded"
  >
    <option value="">All Weight Classes</option>
    {weightClasses.map((weight, index) => (
      <option key={`weight-${weight}-${index}`} value={weight}>{weight}</option>
    ))}
  </select>


  <select
  value={selectedGender.toLowerCase()}  // Convert selected value to lowercase
  onChange={(e) => setSelectedGender(e.target.value)}
  className="w-full p-2 border rounded"
>
  <option value="">All Genders</option>
  {genders.map(gender => (
    <option key={gender} value={gender.toLowerCase()}>{gender}</option>
  ))}
</select>

  <select
    value={selectedState}
    onChange={(e) => setSelectedState(e.target.value)}
    className="w-full p-2 border rounded"
  >
    <option value="">All States</option>
    {states.map(state => (
      <option key={state} value={state}>{state}</option>
    ))}
  </select>
</div>

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
              <th className="p-2 cursor-pointer" onClick={() => handleSort('win')}>
                Wins <SortIcon column="win" />
              </th>
              <th className="p-2 cursor-pointer" onClick={() => handleSort('loss')}>
                Losses <SortIcon column="loss" />
              </th>
              <th className="p-2">City</th>
              <th className="p-2">State</th>
              <th className="p-2">Fighter ID</th>
              <th className="p-2">Coach</th>
              <th className="p-2">Coach Phone</th>
              {editable && <th className="p-2">Actions</th>}
            </tr>
          </thead>
          <tbody>
  {filteredAndSortedFighters.map((fighter) => (
    <tr key={fighter.fighter_id} className="hover:bg-gray-50 cursor-pointer border-b">
      <td className="p-2">
        <Image
          key={`photo-${fighter.fighter_id}`} // Ensure a unique key
          src={isValidUrl(fighter.photo || '') ? fighter.photo! : defaultPhotoUrl}
          alt={`${fighter.first} ${fighter.last}`}
          width={50}
          height={50}
          className="rounded-full object-cover"
        />
      </td>
      <td key={`first-${fighter.fighter_id}`} className="p-2">{fighter.first}</td>
      <td key={`last-${fighter.fighter_id}`} className="p-2">{fighter.last}</td>
      <td key={`weight-${fighter.fighter_id}`} className="p-2">{fighter.weightclass}</td>
      <td key={`gym-${fighter.fighter_id}`} className="p-2">{fighter.gym}</td>
      <td key={`age-${fighter.fighter_id}`} className="p-2">{fighter.age}</td>
      <td key={`gender-${fighter.fighter_id}`} className="p-2">{fighter.gender}</td>
      <td key={`win-${fighter.fighter_id}`} className="p-2">{fighter.win}</td>
      <td key={`loss-${fighter.fighter_id}`} className="p-2">{fighter.loss}</td>
      <td key={`city-${fighter.fighter_id}`} className="p-2">{fighter.city}</td>
      <td key={`state-${fighter.fighter_id}`} className="p-2">{fighter.state}</td>
      <td key={`id-${fighter.fighter_id}`} className="p-2">{fighter.fighter_id}</td>
      <td key={`coach-${fighter.fighter_id}`} className="p-2">{fighter.coach}</td>
      <td key={`coach-phone-${fighter.fighter_id}`} className="p-2">{fighter.coach_phone}</td>
      {editable && (
        <td key={`actions-${fighter.fighter_id}`} className="p-2">
          <button
            key={`edit-${fighter.fighter_id}`}
            onClick={(e) => {
              e.stopPropagation();
              onEditFighter?.(fighter);
            }}
            className="mr-2 px-3 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Edit
          </button>
          <button
            key={`delete-${fighter.fighter_id}`}
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
  ))}
</tbody>
        </table>
      </div>
    </div>
  );
};

export default FighterTable;