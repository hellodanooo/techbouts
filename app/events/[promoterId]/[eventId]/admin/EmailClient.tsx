'use client'

import React from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { RosterFighter } from '@/utils/types';



interface EmailTableProps {
  data: RosterFighter[];
}

const EmailTable: React.FC<EmailTableProps> = ({ data }) => {
  const downloadCSV = () => {
    const headers = [
      'First Name', 'Last Name', 'Email', 'Coach Email', 'Phone', 'Coach Phone',
      'Age', 'Age Gender', 'Boxing Loss', 'Boxing Win', 'City', 'Coach', 
      'Coach Name', 'Date Registered', 'DOB', 'Doc ID', 'Fighter ID', 
      'Gender', 'Gym', 'Gym ID', 'ID', 'MMA Loss', 'MMA Win', 
      'MT Loss', 'MT Win', 'Payment Amount', 'Payment Currency', 
      'Payment Intent ID', 'PMT Loss', 'PMT Win', 'State', 
      'Weight Class', 'Years Experience'
    ];
    
    const rows = data.map(fighter => [
      String(fighter.first || ''),
      String(fighter.last || ''),
      String(fighter.email || ''),
      String(fighter.coach_email || ''),
      String(fighter.phone || ''),
      String(fighter.coach_phone || ''),
      String(fighter.age || ''),
      String(fighter.age_gender || ''),
      String(fighter.boxing_loss || ''),
      String(fighter.boxing_win || ''),
      String(fighter.city || ''),
      String(fighter.coach || ''),
      String(fighter.coach_name || ''),
      String(fighter.date_registered || ''),
      String(fighter.dob || ''),
      String(fighter.docId || ''),
      String(fighter.fighter_id || ''),
      String(fighter.gender || ''),
      String(fighter.gym || ''),
      String(fighter.gym_id || ''),
      String(fighter.mma_loss || ''),
      String(fighter.mma_win || ''),
      String(fighter.mt_loss || ''),
      String(fighter.mt_win || ''),
      String(fighter.pmt_loss || ''),
      String(fighter.pmt_win || ''),
      String(fighter.state || ''),
      String(fighter.weightclass || ''),
      String(fighter.years_exp || '')
    ]);

    // Handle CSV string escaping for fields that might contain commas
    const escapeCSV = (rows: string[][]) => {
      return rows.map(row => 
        row.map(field => {
          // If field contains commas, quotes, or newlines, wrap in quotes and escape any quotes
          if (typeof field === 'string' && (field.includes(',') || field.includes('"') || field.includes('\n'))) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        }).join(',')
      ).join('\n');
    };

    const csvContent = [headers, ...escapeCSV(rows).split('\n')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'fighters_data.csv');
    link.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Fighter Data</CardTitle>
          <Button onClick={downloadCSV}>Download Complete CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>City</TableHead>
                <TableHead>State</TableHead>
                <TableHead>Age</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Weight</TableHead>
                <TableHead>Gym</TableHead>
                <TableHead>Coach</TableHead>
                <TableHead>Experience</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((fighter, index) => (
                <TableRow key={index}>
                  <TableCell>{fighter.first || '-'}</TableCell>
                  <TableCell>{fighter.last || '-'}</TableCell>
                  <TableCell>{fighter.email || '-'}</TableCell>
                  <TableCell>{fighter.city || '-'}</TableCell>
                  <TableCell>{fighter.state || '-'}</TableCell>
                  <TableCell>{fighter.age || '-'}</TableCell>
                  <TableCell>{fighter.gender || '-'}</TableCell>
                  <TableCell>{fighter.weightclass || '-'}</TableCell>
                  <TableCell>{fighter.gym || '-'}</TableCell>
                  <TableCell>{fighter.coach_name || fighter.coach || '-'}</TableCell>
                  <TableCell>{fighter.years_exp || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        <div className="mt-4 text-sm text-gray-500">
          <p>Note: The CSV download includes all fighter data fields. The table above shows a simplified view.</p>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTable;