// components/tables/EmailTable.tsx
'use client';

import React, { useState } from 'react';
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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Loader2 } from "lucide-react";

interface FighterEmail {
  pmt_id: string;
  first: string;
  last: string;
  email: string;
}

interface EmailData {
  emails: FighterEmail[];
  totalEmails: number;
  lastUpdated: string;
}

interface EmailsTableProps {
  emailData: EmailData | null;
  loading: boolean;
  error: string | null;
  selectedYear: string;
}

export default function EmailsTable({ emailData, loading, error, selectedYear }: EmailsTableProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const filteredEmails = emailData?.emails.filter(email =>
    email.first.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.last.toLowerCase().includes(searchTerm.toLowerCase()) ||
    email.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const totalPages = Math.ceil(filteredEmails.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedEmails = filteredEmails.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Fighter Emails Database - {selectedYear}</span>
          <div className="flex items-center space-x-4">
            <Input
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="max-w-xs"
            />
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : error ? (
          <div className="text-red-500 text-center py-4">{error}</div>
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>First Name</TableHead>
                  <TableHead>Last Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>PMT ID</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedEmails.map((email) => (
                  <TableRow key={email.pmt_id}>
                    <TableCell>{email.first}</TableCell>
                    <TableCell>{email.last}</TableCell>
                    <TableCell>{email.email}</TableCell>
                    <TableCell>{email.pmt_id}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-muted-foreground">
                Showing {startIndex + 1} to {Math.min(startIndex + itemsPerPage, filteredEmails.length)} of{" "}
                {filteredEmails.length} entries
              </div>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <div className="text-sm text-muted-foreground">
                  Page {currentPage} of {totalPages}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
            {emailData && (
              <div className="text-sm text-muted-foreground mt-4">
                Last updated: {new Date(emailData.lastUpdated).toLocaleString()}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}