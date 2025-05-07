// components/PotentialMatchesModal.tsx
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db as techboutsDb } from '@/lib/firebase_techbouts/config';
import type { Fighter } from '@/utils/records/fetchTechBoutsFighters';

interface ModalProps {
  fighter: {
    first?: string;
    last?: string;
    weightclass?: string | number;
    gender?: string;
    gym?: string;
    age?: number;
    mt_loss?: number;
    mt_win?: number;
  };
  onClose: () => void;
}

// Function to find similar fighters
const findSimilarTechBoutsFighters = async (
  weightclass: number,
  gender: string
): Promise<Fighter[]> => {
  try {
    console.log('Finding similar fighters with:', { weightclass, gender });
    
    const fightersRef = collection(techboutsDb, 'techbouts_fighters');
    
    // Query only by gender first
    const fightersQuery = query(
      fightersRef,
      where('gender', '==', gender)
    );

    const snapshot = await getDocs(fightersQuery);
    const matches: Fighter[] = [];

    // Filter weight class in memory
    const weightTolerance = 5; // ±2 lbs
    const minWeight = weightclass - weightTolerance;
    const maxWeight = weightclass + weightTolerance;

    snapshot.forEach((doc) => {
      const data = doc.data();
      const fighterWeight = Number(data.weightclass) || 0;
      
      // Only add fighters within the weight tolerance
      if (fighterWeight >= minWeight && fighterWeight <= maxWeight) {
        matches.push({
          fighter_id: data.fighter_id || doc.id,
          first: data.first || '',
          last: data.last || '',
          gym: data.gym || '',
          weightclass: fighterWeight,
          gender: data.gender || '',
          wins: data.win || 0,
          losses: data.loss || 0,
          age: Number(data.age) || 0,
          // Add other required fields with defaults
          address: '',
          city: '',
          coach: '',
          coach_phone: '',
          coach_email: '',
          dob: '',
          docId: doc.id,
          email: '',
          gym_id: '',
          height: 0,
          mtp_id: '',
          photo: '',
          state: '',
          website: '',
        });
      }
    });

    console.log(`Found ${matches.length} potential matches`);
    return matches;

  } catch (error) {
    console.error('Error finding similar fighters:', error);
    return [];
  }
};

export default function FindPotentialMatchesModal({ fighter, onClose }: ModalProps) {
  const [potentialMatches, setPotentialMatches] = useState<Fighter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchMatches = async () => {
      try {
        setLoading(true);
        if (!fighter.weightclass || !fighter.gender) {
          throw new Error('Missing required fighter details');
        }
        
        const matches = await findSimilarTechBoutsFighters(
          Number(fighter.weightclass),
          fighter.gender
        );
        
        setPotentialMatches(matches);
        
      } catch (err) {
        console.error('Error fetching matches:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch matches');
      } finally {
        setLoading(false);
      }
    };

    fetchMatches();
  }, [fighter]);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            <div><div>Potential Matches for {fighter.first} {fighter.last} {fighter.weightclass} {fighter.gym}</div>
            <div>{fighter.gender} {fighter.age} ({fighter.mt_win} - {fighter.mt_loss})</div>
            </div>
          </DialogTitle>
          <DialogDescription>
            Showing fighters with similar weightclass ({fighter.weightclass} lbs)
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900" />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-4">
            {error}
          </div>
        )}

        {!loading && !error && potentialMatches.length === 0 && (
          <div className="text-center py-4 text-gray-500">
            No potential matches found
          </div>
        )}

        {!loading && !error && potentialMatches.length > 0 && (
          <div className="overflow-y-auto max-h-96">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Gym</TableHead>
                  <TableHead>Weight</TableHead>
                  <TableHead>Record</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {potentialMatches.map((match) => (
                  <TableRow key={match.fighter_id}>
                    <TableCell>
                      {match.first} {match.last}
                    </TableCell>
                    <TableCell>{match.gym}</TableCell>
                    <TableCell>{match.weightclass} lbs</TableCell>
                    <TableCell>
                      {match.wins}-{match.losses}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}