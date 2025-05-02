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
      'First Name',        // 1
      'Last Name',         // 2
      'Email',             // 3
      'Coach Email',       // 4 
      'Phone',             // 5
      'Coach Phone',       // 6
      'Age',               // 7
      'Age Gender',        // 8 
      'Boxing Loss',       // 9
      'Boxing Win',        // 10
      'City',              // 11
      'Coach',             // 12
      'Coach Name',        // 13
      'Date Registered',   // 14 
      'DOB',               // 15
      'Doc ID',            // 16
      'Fighter ID',        // 17
      'Gender',            // 18
      'Gym',               // 19
      'Gym ID',            // 20
      'MMA Win',           // 22
      'MMA Loss',          // 23
      'MT Loss',           // 24
      'MT Win',            // 25
      'PMT Loss',          // 26
      'PMT Win',           // 27
      'State',             // 28
      'Weight Class',      // 29 
      'Years Experience',  // 30
      'Payment Amount',    // 31
      'Payment Currency',  // 32
      'Payment Intent ID'  // 33
    ];
    
    const rows = data.map(fighter => [
      String(fighter.first || ''),                      // 1 - First Name
      String(fighter.last || ''),                       // 2 - Last Name
      String(fighter.email || ''),                      // 3 - Email
      String(fighter.coach_email || ''),                // 4 - Coach Email
      String(fighter.phone || ''),                      // 5 - Phone
      String(fighter.coach_phone || ''),                // 6 - Coach Phone
      String(fighter.age || ''),                        // 7 - Age
      String(fighter.age_gender || ''),                 // 8 - Age Gender
      String(fighter.boxing_loss || ''),                // 9 - Boxing Loss
      String(fighter.boxing_win || ''),                 // 10 - Boxing Win
      String(fighter.city || ''),                       // 11 - City
      String(fighter.coach || ''),                      // 12 - Coach
      String(fighter.coach_name || ''),                 // 13 - Coach Name
      String(fighter.date_registered || ''),            // 14 - Date Registered
      String(fighter.dob || ''),                        // 15 - DOB
      String(fighter.docId || ''),                      // 16 - Doc ID
      String(fighter.fighter_id || ''),                 // 17 - Fighter ID
      String(fighter.gender || ''),                     // 18 - Gender
      String(fighter.gym || ''),                        // 19 - Gym
      String(fighter.gym_id || ''),                     // 20 - Gym ID
      String(fighter.mma_win || ''),                    // 22 - MMA Win
      String(fighter.mma_loss || ''),                   // 23 - MMA Loss
      String(fighter.mt_loss || ''),                    // 24 - MT Loss
      String(fighter.mt_win || ''),                     // 25 - MT Win
      String(fighter.pmt_loss || ''),                   // 26 - PMT Loss
      String(fighter.pmt_win || ''),                    // 27 - PMT Win
      String(fighter.state || ''),                      // 28 - State (was incorrectly mapped to "weightclass")
      String(fighter.weightclass || ''),                // 29 - Weight Class
      String(fighter.years_exp || ''),                  // 30 - Years Experience
      String(fighter.payment_info?.paymentAmount || ''), // 31 - Payment Amount
      String(fighter.payment_info?.paymentCurrency || ''), // 32 - Payment Currency
      String(fighter.payment_info?.paymentIntentId || '') // 33 - Payment Intent ID
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