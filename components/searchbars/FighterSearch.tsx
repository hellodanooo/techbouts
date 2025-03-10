
// components/searchbars/FighterSearch.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';
import { db } from '@/lib/firebase_techbouts/config';
import { FullContactFighter } from '@/utils/types';
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FighterSearchProps {
  onFighterSelect: (fighter: FullContactFighter) => void;
  searchResultLimit?: number;
  showCard?: boolean;
  cardTitle?: string;
  cardDescription?: string;
}

const FighterSearch: React.FC<FighterSearchProps> = ({
  onFighterSelect,
  showCard = true,
  cardTitle = "Returning Athletes",
  cardDescription = "(double check your information)",
}) => {
  const [fighterSearchTerm, setFighterSearchTerm] = useState<string>('');
  const [fighterSearchResults, setFighterSearchResults] = useState<FullContactFighter[]>([]);
  const [searchType, setSearchType] = useState<'email' | 'last'>('email');
  const [isSearching, setIsSearching] = useState<boolean>(false);

  useEffect(() => {
    const fetchFighters = async () => {
      if (fighterSearchTerm.length >= 3) {
        setIsSearching(true);
        console.log(`Searching for ${searchType} containing:`, fighterSearchTerm);

        try {
          const colRef = collection(db, 'techbouts_fighters');
          let optimizedSearchTerm = fighterSearchTerm;
          
          if (searchType === 'email') {
            optimizedSearchTerm = fighterSearchTerm.toLowerCase();
          }
          if (searchType === 'last') {
            optimizedSearchTerm = fighterSearchTerm.toUpperCase();
          }

          const fightersQuery = query(
            colRef,
            where(searchType, '>=', optimizedSearchTerm),
            where(searchType, '<=', optimizedSearchTerm + '\uf8ff')
          );

          console.log('Executing query...');
          const querySnapshot = await getDocs(fightersQuery);
          console.log('Query returned', querySnapshot.size, 'results');

          const originalCaseQuery = query(
            colRef,
            where(searchType, '>=', fighterSearchTerm),
            where(searchType, '<=', fighterSearchTerm + '\uf8ff')
          );

          const originalCaseSnapshot = await getDocs(originalCaseQuery);
          console.log('Original case query returned', originalCaseSnapshot.size, 'results');

          const combinedResults = new Map();

          const mapDocToFighterData = (doc: QueryDocumentSnapshot<DocumentData>): FullContactFighter => {
            const data = doc.data();
            return {
              id: data.fighter_id || doc.id,
              fighter_id: data.fighter_id || doc.id,
              first: data.first || '',
              last: data.last || '',
              dob: data.dob || '',
              age: data.age || 0,
              gender: data.gender || '',
              email: data.email || '',
              gym: data.gym || '',
              gym_id: data.gym_id || '',
              coach: data.coach || '',
              coach_email: data.coach_email || '',
              coach_name: data.coach_name || '',
              coach_phone: data.coach_phone || '',
              state: data.state || '',
              city: data.city || '',
              address: data.address || '',
              weighin: data.weighin || 0,
              weightclass: Number(data.weightclass) || 0,
              height: Number(data.height) || 0,
              mt_win: data.mt_win || data.win || 0,
              mt_loss: data.mt_loss || data.loss || 0,
              boxing_win: data.boxing_win || 0,
              boxing_loss: data.boxing_loss || 0,
              mma_win: data.mma_win || data.mmawin || 0,
              mma_loss: data.mma_loss || data.mmaloss || 0,
              pmt_win: data.pmt_win || 0,
              pmt_loss: data.pmt_loss || 0,
              nc: data.nc || 0,
              dq: data.dq || 0,
              years_exp: data.years_exp || 0,
              class: (data.class as 'A' | 'B' | 'C') || 'C',
              age_gender: (data.age_gender as 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS') || 'MEN',
              confirmed: data.confirmed || false,
              photo: data.photo || '',
              photo_package: data.photo_package || false,
              docId: doc.id,
              fights: data.pmt_fights || data.fights || [],
              payment_info: {
                paymentIntentId: '',
                paymentAmount: 0,
                paymentCurrency: ''
              }
            };
          };

          querySnapshot.docs.forEach(doc => {
            combinedResults.set(doc.id, mapDocToFighterData(doc));
          });

          originalCaseSnapshot.docs.forEach(doc => {
            if (!combinedResults.has(doc.id)) {
              combinedResults.set(doc.id, mapDocToFighterData(doc));
            }
          });

          const fighters = Array.from(combinedResults.values()).slice(0);

          console.log('Total combined fighters:', fighters.length);

          setFighterSearchResults(fighters);
        } catch (error) {
          console.error("Error fetching fighters:", error);
          setFighterSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      } else {
        setFighterSearchResults([]);
      }
    };

    const debounceTimeout = setTimeout(() => {
      fetchFighters();
    }, 300);

    return () => clearTimeout(debounceTimeout);
  }, [fighterSearchTerm, searchType]);

  const handleFighterSelect = (selectedFighter: FullContactFighter) => {
    setFighterSearchResults([]);
    setFighterSearchTerm('');
    
    onFighterSelect(selectedFighter);
  };

  const searchContent = (
    <div className="space-y-4">
      <Tabs defaultValue="email" onValueChange={(value) => setSearchType(value as 'email' | 'last')}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="email">Search by Email</TabsTrigger>
          <TabsTrigger value="last">Search by Last Name</TabsTrigger>
        </TabsList>
        <TabsContent value="email" className="space-y-2">
          <Label htmlFor="emailSearch">Search by Email</Label>
          <Input
            id="emailSearch"
            value={searchType === 'email' ? fighterSearchTerm : ''}
            onChange={(e) => {
              const value = e.target.value;
              setFighterSearchTerm(value);
              if (value.length < 3) setFighterSearchResults([]);
            }}
            placeholder="Enter email address..."
          />
        </TabsContent>
        <TabsContent value="last" className="space-y-2">
          <Label htmlFor="lastNameSearch">Search by Last Name</Label>
          <Input
            id="lastNameSearch"
            value={searchType === 'last' ? fighterSearchTerm : ''}
            onChange={(e) => {
              const value = e.target.value.toUpperCase();
              setFighterSearchTerm(value);
              if (value.length < 3) setFighterSearchResults([]);
            }}
            placeholder="Enter last name..."
          />
        </TabsContent>
      </Tabs>

      {isSearching && (
        <div className="flex justify-center p-4">
          <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      )}

      {fighterSearchResults.length > 0 && (
        <ScrollArea className="h-[200px] rounded-md border">
          <div className="p-4">
            {fighterSearchResults.map((fighter, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left"
                onClick={() => handleFighterSelect(fighter)}
              >
                <div className="flex flex-col items-start">
                  <div className="font-medium">{fighter.first} {fighter.last}</div>
                  <div className="text-sm text-muted-foreground">
                    Email: {fighter.email || 'N/A'} | Age: {fighter.age || 'N/A'} | Gym: {fighter.gym || 'N/A'}
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </ScrollArea>
      )}

      {fighterSearchTerm.length >= 3 && fighterSearchResults.length === 0 && !isSearching && (
        <div className="text-center p-4 text-muted-foreground">
          No fighters found. Try a different search term.
        </div>
      )}
    </div>
  );

  return showCard ? (
    <Card>
      <CardHeader>
        <CardTitle>{cardTitle}</CardTitle>
        <CardDescription>{cardDescription}</CardDescription>
      </CardHeader>
      <CardContent>
        {searchContent}
      </CardContent>
    </Card>
  ) : searchContent;
};

export default FighterSearch;