'use client';

import React from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';

type Fighter = {
  fighter_id: string;
  mtp_id?: string;
  first: string;
  last: string;
  weightclass: string;
  gym: string;
  age: number;
  gender: string;
  win: number;
  loss: number;
  city?: string;
  state?: string;
  photo?: string;
};

type FighterTableProps = {
  fighters: Fighter[];
  editable?: boolean;
  onEditFighter?: (fighter: Fighter) => void;
  onDeleteFighter?: (fighterId: string) => void;
};

const defaultPhotoUrl =
  'https://firebasestorage.googleapis.com/v0/b/pmt-app2.appspot.com/o/Fighter_Photos%2FIcon_grey.png?alt=media&token=8e8beffa-a6b3-4329-93fc-db64b7045c0a';

const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const FighterTable: React.FC<FighterTableProps> = ({ fighters, editable, onEditFighter, onDeleteFighter }) => {
  const router = useRouter();

  return (
    <div style={{ overflowX: 'auto' }}>
      <table>
        <thead>
          <tr>
            <th>Photo</th>
            <th>First Name</th>
            <th>Last Name</th>
            <th>Weight</th>
            <th>Gym</th>
            <th>Age</th>
            <th>Gender</th>
            <th>Wins</th>
            <th>Losses</th>
            <th>City</th>
            <th>State</th>
            <th>Fighter ID</th>
            {editable && <th>Actions</th>}
          </tr>
        </thead>
        <tbody>
          {fighters.map((fighter) => (
            <tr 
              key={fighter.fighter_id} 
              onClick={() => router.push(`/fighter/${fighter.fighter_id}`)}
              style={{ cursor: 'pointer' }}
            >
              <td>
                <Image
                  src={isValidUrl(fighter.photo || '') ? fighter.photo! : defaultPhotoUrl}
                  alt={`${fighter.first} ${fighter.last}`}
                  width={50}
                  height={50}
                  style={{ objectFit: 'cover' }}
                />
              </td>
              <td>{fighter.first}</td>
              <td>{fighter.last}</td>
              <td>{fighter.weightclass}</td>
              <td>{fighter.gym}</td>
              <td>{fighter.age}</td>
              <td>{fighter.gender}</td>
              <td>{fighter.win}</td>
              <td>{fighter.loss}</td>
              <td>{fighter.city}</td>
              <td>{fighter.state}</td>
              <td>{fighter.fighter_id}</td>
              {editable && (
                <td>
                  <button onClick={() => onEditFighter?.(fighter)}>Edit</button>
                  <button onClick={() => onDeleteFighter?.(fighter.fighter_id)}>Delete</button>
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default FighterTable;