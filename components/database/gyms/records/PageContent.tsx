// app/database/[sanctioning]/gyms/records/GymRecordsClient.tsx
'use client';

import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase_pmt/config';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2 } from 'lucide-react';

interface GymRecord {
  gym_id: string;
  gym_name: string;
  wins: number;
  losses: number;
  nc: number;
  dq: number;
  tournament_wins: number;
  tournament_losses: number;
  total_fighters: number;
  total_bodykick: number;
  total_boxing: number;
  total_clinch: number;
  total_defense: number;
  total_footwork: number;
  total_headkick: number;
  total_kicks: number;
  total_knees: number;
  total_legkick: number;
  total_ringawareness: number;
  fighters: Array<{
    pmt_id: string;
    first: string;
    last: string;
    email: string;
  }>;
}

interface GymRecordsClientProps {
  sanctioning: string;
}

export default function GymRecordsClient({ sanctioning }: GymRecordsClientProps) {
  const [year, setYear] = useState('2024');
  const [loading, setLoading] = useState(true);
  const [gymRecords, setGymRecords] = useState<GymRecord[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchGymRecords() {
      setLoading(true);
      setError(null);
      try {
        const recordsRef = collection(db, `records_${sanctioning}_gyms_${year}`);
        const q = query(recordsRef, orderBy('wins', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const records: GymRecord[] = [];
        querySnapshot.forEach((doc) => {
          records.push(doc.data() as GymRecord);
        });
        
        setGymRecords(records);
      } catch (error) {
        console.error('Error fetching gym records:', error);
        setError('Failed to load gym records');
      } finally {
        setLoading(false);
      }
    }

    fetchGymRecords();
  }, [year, sanctioning]);

  return (
    <div className="container mx-auto py-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{sanctioning.toUpperCase()} Gym Records</CardTitle>
            <Select
              value={year}
              onValueChange={setYear}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select year" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="2025">2025</SelectItem>
                <SelectItem value="2024">2024</SelectItem>
                <SelectItem value="2023">2023</SelectItem>
                <SelectItem value="2022">2022</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : error ? (
            <div className="text-red-500 text-center py-4">{error}</div>
          ) : gymRecords.length === 0 ? (
            <div className="text-center py-4">No records found for this year</div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gym Name</TableHead>
                    <TableHead className="text-right">Fighters</TableHead>
                    <TableHead className="text-right">Wins</TableHead>
                    <TableHead className="text-right">Losses</TableHead>
                    <TableHead className="text-right">Tournament Wins</TableHead>
                    <TableHead className="text-right">Tournament Losses</TableHead>
                    <TableHead className="text-right">NC</TableHead>
                    <TableHead className="text-right">DQ</TableHead>
                    <TableHead className="text-right">Total Score</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {gymRecords.map((gym) => {
                    const totalScore = 
                      gym.total_bodykick +
                      gym.total_boxing +
                      gym.total_clinch +
                      gym.total_defense +
                      gym.total_footwork +
                      gym.total_headkick +
                      gym.total_kicks +
                      gym.total_knees +
                      gym.total_legkick +
                      gym.total_ringawareness;

                    return (
                      <TableRow key={gym.gym_id}>
                        <TableCell className="font-medium">{gym.gym_name}</TableCell>
                        <TableCell className="text-right">{gym.total_fighters}</TableCell>
                        <TableCell className="text-right">{gym.wins}</TableCell>
                        <TableCell className="text-right">{gym.losses}</TableCell>
                        <TableCell className="text-right">{gym.tournament_wins}</TableCell>
                        <TableCell className="text-right">{gym.tournament_losses}</TableCell>
                        <TableCell className="text-right">{gym.nc}</TableCell>
                        <TableCell className="text-right">{gym.dq}</TableCell>
                        <TableCell className="text-right">{totalScore}</TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}