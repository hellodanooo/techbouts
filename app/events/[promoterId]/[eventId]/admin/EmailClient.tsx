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

interface FighterEmailData {
  first?: string;
  last?: string;
  email?: string;
  coach_email?: string;
  phone?: string;
  coach_phone?: string;
}

interface EmailTableProps {
  data: FighterEmailData[];
}

const EmailTable: React.FC<EmailTableProps> = ({ data }) => {
  const downloadCSV = () => {
    const headers = ['First Name', 'Last Name', 'Email', 'Coach Email', 'Phone', 'Coach Phone'];
    const rows = data.map(fighter => [
      fighter.first || '',
      fighter.last || '',
      fighter.email || '',
      fighter.coach_email || '',
      fighter.phone || '',
      fighter.coach_phone || ''
    ]);

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', 'contact_list.csv');
    link.click();
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Email Contact List</CardTitle>
          <Button onClick={downloadCSV}>Download CSV</Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>First Name</TableHead>
                <TableHead>Last Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Coach Email</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Coach Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.map((fighter, index) => (
                <TableRow key={index}>
                  <TableCell>{fighter.first || '-'}</TableCell>
                  <TableCell>{fighter.last || '-'}</TableCell>
                  <TableCell>{fighter.email || '-'}</TableCell>
                  <TableCell>{fighter.coach_email || '-'}</TableCell>
                  <TableCell>{fighter.phone || '-'}</TableCell>
                  <TableCell>{fighter.coach_phone || '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default EmailTable;
