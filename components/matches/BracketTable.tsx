// components/matches/BracketTable.tsx

import React, { useMemo } from 'react';
import { RosterFighter, Bracket, Bout } from '@/utils/types';
import { FullBracketDisplay } from './FullBracketDisplay';

interface BracketTableProps {
  roster: RosterFighter[];
  handleFighterClick?: (fighter: RosterFighter) => void;
  isAdmin?: boolean;
  onBoutSelect?: (bout: Bout) => void;

}

export function BracketTable({
  roster,
  handleFighterClick = () => {},
  isAdmin = false,
  onBoutSelect,

}: BracketTableProps) {
  // Group fighters by weightclass and age_gender
  const groupedFighters = useMemo(() => {
    const groups: { [key: string]: RosterFighter[] } = {};
    
    roster.forEach(fighter => {
      if (!fighter.weightclass || !fighter.age || !fighter.gender) return;
      
      // Create a category key combining weightclass and age_gender
      const key = `${fighter.weightclass}_${fighter.age}_${fighter.gender}`;
      
      if (!groups[key]) {
        groups[key] = [];
      }
      
      groups[key].push(fighter);
    });
    
    return groups;
  }, [roster]);
  
  // Generate brackets from grouped fighters
  const brackets = useMemo(() => {
    const result: {
      category: string;
      displayName: string;
      brackets: Bracket[];
      weightValue: number; // Add this to sort by weight value
    }[] = [];
    
    // For each group, create brackets of 4 fighters
    Object.entries(groupedFighters).forEach(([key, fighters]) => {
      const categoryParts = key.split('_');
      const weightclass = categoryParts[0];
      const age = categoryParts[1];
      const gender = categoryParts[2];
      const displayName = `${weightclass} - ${age}yr ${gender === 'M' ? 'Male' : 'Female'}`;
      const weightValue = parseFloat(weightclass); // Convert to numeric for sorting
      
      // Calculate how many brackets we need
      const numBrackets = Math.ceil(fighters.length / 4);
      const brackets: Bracket[] = [];
      
      for (let i = 0; i < numBrackets; i++) {
        // Get up to 4 fighters for this bracket
        const bracketFighters = fighters.slice(i * 4, (i + 1) * 4);
        
        // Fill in vacant spots if needed
        while (bracketFighters.length < 4) {
          bracketFighters.push({
            fighter_id: `vacant-${i}-${bracketFighters.length}`,
            first: 'Vacant',
            last: '',
            weightclass: weightValue,
            age: parseInt(age, 10),
            gender: gender === 'M' ? 'MALE' : 'FEMALE',
            result: 'W',
            weighin: 0,
            payment_info: {
              paymentIntentId: '',
              paymentAmount: 0,
              paymentCurrency: ''
            },
            dob: '',
            photo: '',
            gym: '',
            gym_id: '',
            coach: '',
            coach_email: '',
            coach_name: '',
            state: '',
            city: '',
            age_gender: gender === 'M' ? 'MEN' : 'WOMEN',
            docId: '',
            mt_win: 0,
            mt_loss: 0,
            boxing_win: 0,
            boxing_loss: 0,
            mma_win: 0,
            mma_loss: 0,
            pmt_win: 0,
            pmt_loss: 0,
            pb_win: 0,
            pb_loss: 0,
            other_exp: '',
            nc: 0,
            dq: 0,
            years_exp: 0,
            pmt_fights: [],
            email: '',
            phone: '',
            coach_phone: '',
            gym_website: '',
            gym_address: ''
          });
        }
        
        // Placeholder for bout numbers - we'll assign them after sorting
        const semifinal1: Bout = {
          boutNum: 0, // Temporary value
          red: bracketFighters[0],
          blue: bracketFighters[1],
          weightclass: weightValue,
          bracket_bout_fighters: [
            bracketFighters[0],
            bracketFighters[1],
            bracketFighters[2],
            bracketFighters[3]
          ],
          boutId: '',
          ringNum: 0,
          methodOfVictory: '',
          eventId: '',
          eventName: '',
          url: '',
          date: '',
          promotionId: '',
          promotionName: '',
          sanctioning: '',
          bout_ruleset: '',
          dayNum: 0,
          class: ''
        };
        
        const semifinal2: Bout = {
          boutNum: 0, // Temporary value
          red: bracketFighters[2],
          blue: bracketFighters[3],
          weightclass: weightValue,
          bracket_bout_fighters: [
            bracketFighters[0],
            bracketFighters[1],
            bracketFighters[2],
            bracketFighters[3]
          ],
          boutId: '',
          ringNum: 0,
          methodOfVictory: '',
          eventId: '',
          eventName: '',
          url: '',
          date: '',
          promotionId: '',
          promotionName: '',
          sanctioning: '',
          bout_ruleset: '',
          dayNum: 0,
          class: ''
        };
        
        // Create a placeholder final bout
        const final: Bout = {
          boutNum: 0, // Temporary value
          weightclass: weightValue,
          bracket_bout_fighters: [
            bracketFighters[0],
            bracketFighters[1],
            bracketFighters[2],
            bracketFighters[3]
          ],
          boutId: '',
          ringNum: 0,
          methodOfVictory: '',
          eventId: '',
          eventName: '',
          url: '',
          date: '',
          promotionId: '',
          promotionName: '',
          sanctioning: '',
          bout_ruleset: '',
          dayNum: 0,
          class: '',
          red: null,
          blue: null
        };
        
        // Create the bracket - using only the bouts property since the error suggests 'id' doesn't exist in Bracket
        const bracket: Bracket = {
          bouts: [semifinal1, semifinal2, final]
        };
        
        brackets.push(bracket);
      }
      
      result.push({
        category: key,
        displayName,
        brackets,
        weightValue
      });
    });
    
    // Sort result by weight value (ascending)
    return result.sort((a, b) => a.weightValue - b.weightValue);
  }, [groupedFighters]);
  
  // Assign bout numbers after sorting
  const processedBrackets = useMemo(() => {
    let boutCounter = 1;
    
    // Create a deep copy to avoid modifying the original
    const processedResults = [...brackets];
    
    // Assign bout numbers
    processedResults.forEach(categoryGroup => {
      categoryGroup.brackets.forEach(bracket => {
        // First assign semifinals
        bracket.bouts.forEach((bout, index) => {
          if (index < 2) { // Semifinals
            bout.boutNum = boutCounter++;
          }
        });
        
        // Then assign finals (they come after all semifinals)
        bracket.bouts[2].boutNum = boutCounter++;
      });
    });
    
    return processedResults;
  }, [brackets]);
  
  if (roster.length === 0) {
    return (
      <div className="border border-dashed rounded-lg bg-gray-50 p-4 text-center">
        <p className="text-sm text-gray-500">
          No fighters in the roster. Add fighters to create brackets.
        </p>
      </div>
    );
  }
  
  return (
    <div className="space-y-8">
      {processedBrackets.map(({ category, displayName, brackets }) => (
        <div key={category} className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4">{displayName}</h2>
          
          {brackets.length > 1 ? (
            <div className="space-y-6">
              {brackets.map((bracket, index) => (
                <div key={`${category}-${index}`}>
                  <h3 className="text-lg font-semibold mb-2">Bracket {index + 1}</h3>
                  <FullBracketDisplay
                    bracket={bracket}
                    handleFighterClick={handleFighterClick}
                    isAdmin={isAdmin}
                    onBoutSelect={onBoutSelect}
             
                  />
                </div>
              ))}
            </div>
          ) : (
            <FullBracketDisplay
              bracket={brackets[0]}
              handleFighterClick={handleFighterClick}
              isAdmin={isAdmin}
              onBoutSelect={onBoutSelect}
             
            />
          )}
        </div>
      ))}
      
      {processedBrackets.length === 0 && (
        <div className="border border-dashed rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">
            No valid brackets could be created. Ensure fighters have weightclass, age, and gender assigned.
          </p>
        </div>
      )}
    </div>
  );
}