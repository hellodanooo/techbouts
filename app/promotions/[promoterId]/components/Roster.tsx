// Roster.tsx
'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PmtFighterRecord } from '@/utils/types';

type PmtRosterEntry = PmtFighterRecord & {
  id: string;
  years_exp?: number;
  division?: string;
};

interface RosterProps {
  rosterData: PmtRosterEntry[];
  isLoading?: boolean;
}

export default function Roster({ rosterData, isLoading = false }: RosterProps) {
  const [roster, setRoster] = useState<PmtRosterEntry[]>([]);

  useEffect(() => {
    if (rosterData) {
      // Sort roster by gym name, handling undefined gyms
      const sortedRoster = [...rosterData].sort((a, b) => {
        const gymA = (a.gym || '').toLowerCase();
        const gymB = (b.gym || '').toLowerCase();
        return gymA < gymB ? -1 : gymA > gymB ? 1 : 0;
      });
      setRoster(sortedRoster);
    }
  }, [rosterData]);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6">
            Loading roster...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!roster.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Event Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-6 text-gray-500">
            No fighters registered yet
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Roster</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gym</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Division</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((fighter) => (
                <TableRow key={fighter.id}>
                  <TableCell className="font-medium">
                    {`${fighter.first} ${fighter.last}`}
                  </TableCell>
                  <TableCell>{fighter.gym || 'N/A'}</TableCell>
                  <TableCell>{fighter.weightclass ? `${fighter.weightclass} lbs` : 'N/A'}</TableCell>
                  <TableCell>{fighter.age || 'N/A'}</TableCell>
                  <TableCell>
                    {typeof fighter.win === 'number' || typeof fighter.win === 'number' 
                      ? `${fighter.win || fighter.win || 0} fights` 
                      : 'N/A'}
                  </TableCell>
                  <TableCell>{fighter.years_exp || 'N/A'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}