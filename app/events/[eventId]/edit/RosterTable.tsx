// components/RosterTable.tsx

import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface Fighter {
  first?: string;
  last?: string;
  gym?: string;
  weightclass?: string | number;
  age?: string | number;
  experience?: string | number;
  status?: string;
  [key: string]: string | number | undefined;
}

interface RosterTableProps {
  roster: Fighter[];
}

export default function RosterTable({ roster }: RosterTableProps) {
  if (!roster?.length) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Event Roster</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">No roster data available</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Event Roster</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Gym</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Experience</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roster.map((fighter, index) => (
                <TableRow key={index}>
                  <TableCell>
                    {`${fighter.first || ''} ${fighter.last || ''}`}
                  </TableCell>
                  <TableCell>{fighter.gym || '-'}</TableCell>
                  <TableCell>{fighter.weightclass || '-'}</TableCell>
                  <TableCell>{fighter.age || '-'}</TableCell>
                  <TableCell>{fighter.experience || '-'}</TableCell>
                  <TableCell>
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                      fighter.status === 'Confirmed' 
                        ? 'bg-green-100 text-green-700' 
                        : fighter.status === 'Pending' 
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}>
                      {fighter.status || 'Unknown'}
                    </span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}