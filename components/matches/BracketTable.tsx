// components/matches/BracketTable.tsx

import React, { useMemo, useState } from 'react';
import { RosterFighter, Bracket, Bout } from '@/utils/types';
import { FullBracketDisplay } from './FullBracketDisplay';
import { Button } from "@/components/ui/button";

// Define the allowed age_gender types to match the type in RosterFighter
type AgeGenderType = 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS';

interface BracketTableProps {
  roster: RosterFighter[];
  handleFighterClick?: (fighter: RosterFighter) => void;
  isAdmin?: boolean;
  onBoutSelect?: (bout: Bout) => void;
}

// Define a clear structure for our grouped categories
interface WeightClassCategory {
  categoryKey: string;       // Composite key for the category
  weightClassValue: number;  // Numeric weight class for sorting
  weightClass: string;       // Weight class as a string (e.g., "125")
  ageGenderGroup: AgeGenderType; // Age/gender group with proper type
  displayName: string;       // Formatted display name
  bracketGroups: Bracket[];  // Array of brackets in this category
}

export function BracketTable({
  roster,
  handleFighterClick = () => {},
  isAdmin = false,
  onBoutSelect,
}: BracketTableProps) {
  // Add state for the current filter
  const [activeFilter, setActiveFilter] = useState<AgeGenderType | 'ALL'>('ALL');
  
  // Group fighters by weightclass and age_gender
  const groupedFightersByCategory = useMemo(() => {
    const fighterGroups: { [categoryKey: string]: RosterFighter[] } = {};
    
    roster.forEach(fighter => {
      if (!fighter.weightclass || !fighter.age_gender) return;
      
      // Create a category key combining weightclass and age_gender
      const categoryKey = `${fighter.weightclass}_${fighter.age_gender}`;
      
      if (!fighterGroups[categoryKey]) {
        fighterGroups[categoryKey] = [];
      }
      
      fighterGroups[categoryKey].push(fighter);
    });
    
    return fighterGroups;
  }, [roster]);
  
  // Generate brackets from grouped fighters
  const weightClassCategories = useMemo(() => {
    const categoryList: WeightClassCategory[] = [];
    
    // Process each fighter group by category
    Object.entries(groupedFightersByCategory).forEach(([categoryKey, fightersInCategory]) => {
      const categoryParts = categoryKey.split('_');
      const weightClass = categoryParts[0];
      const gender = fightersInCategory[0]?.gender || 'UNKNOWN';
      
      // Ensure ageGenderGroup is one of the valid types
      const ageGenderPart = categoryParts[1]; 
      // Type guard to ensure we have a valid age_gender value
      const isValidAgeGender = (value: string): value is AgeGenderType => {
        return ['MEN', 'WOMEN', 'BOYS', 'GIRLS'].includes(value);
      };
      
      // If we don't have a valid age_gender, skip this category
      if (!isValidAgeGender(ageGenderPart)) {
        console.warn(`Invalid age_gender value detected: ${ageGenderPart}`);
        return;
      }
      
      const ageGenderGroup: AgeGenderType = ageGenderPart;
      const displayName = `${weightClass} - ${ageGenderGroup}`;
      const weightClassValue = parseFloat(weightClass); // Convert to numeric for sorting
      
      // Calculate how many brackets we need for this category
      const numBracketsNeeded = Math.ceil(fightersInCategory.length / 4);
      const bracketGroups: Bracket[] = [];
      
      // Create brackets of 4 fighters each
      for (let bracketIndex = 0; bracketIndex < numBracketsNeeded; bracketIndex++) {
        // Get up to 4 fighters for this bracket
        const fightersInBracket = fightersInCategory.slice(bracketIndex * 4, (bracketIndex + 1) * 4);
        
        // Fill in vacant spots if needed
        while (fightersInBracket.length < 4) {
          // Determine gender based on age_gender
          
          fightersInBracket.push({
            fighter_id: `vacant-${bracketIndex}-${fightersInBracket.length}`,
            first: 'VACANT',
            last: 'SPACE',
            weightclass: weightClassValue,
            age: 0,
            gender: gender, 
            result: '-',
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
            age_gender: ageGenderGroup, // Properly typed now
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
        
        // Create bracket bouts with temporary bout numbers (will be assigned later)
        // Semifinal 1: Fighter 0 vs Fighter 1
        const semifinal1: Bout = {
          boutNum: 0, // Temporary value
          red: fightersInBracket[0],
          blue: fightersInBracket[1],
          weightclass: weightClassValue,
          bracket_bout_fighters: [
            fightersInBracket[0],
            fightersInBracket[1],
            fightersInBracket[2],
            fightersInBracket[3]
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
          bracket_bout_type: 'semifinal'
        };
        
        // Semifinal 2: Fighter 2 vs Fighter 3
        const semifinal2: Bout = {
          boutNum: 0, // Temporary value
          red: fightersInBracket[2],
          blue: fightersInBracket[3],
          weightclass: weightClassValue,
          bracket_bout_fighters: [
            fightersInBracket[0],
            fightersInBracket[1],
            fightersInBracket[2],
            fightersInBracket[3]
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
          bracket_bout_type: 'semifinal'
        };
        
        // Finals: Winners of semifinals (not yet determined)
        const final: Bout = {
          boutNum: 0, // Temporary value
          weightclass: weightClassValue,
          bracket_bout_fighters: [
            fightersInBracket[0],
            fightersInBracket[1],
            fightersInBracket[2],
            fightersInBracket[3]
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
          blue: null,
          bracket_bout_type: 'final'
        };
        
        // Create the complete bracket with all bouts
        const bracketGroup: Bracket = {
          bouts: [semifinal1, semifinal2, final]
        };
        
        bracketGroups.push(bracketGroup);
      }
      
      // Add this category with all its brackets to our list
      categoryList.push({
        categoryKey,
        weightClassValue,
        weightClass,
        ageGenderGroup,
        displayName,
        bracketGroups
      });
    });
    
    // Sort categories by weight class in ascending order
    return categoryList.sort((a, b) => a.weightClassValue - b.weightClassValue);
  }, [groupedFightersByCategory]);
  
  // Assign bout numbers after sorting
  const processedCategories = useMemo(() => {
    let boutNumberCounter = 1;
    
    // Create a deep copy to avoid modifying the original
    const categoriesWithBoutNumbers = [...weightClassCategories];
    
    // Assign bout numbers sequentially
    categoriesWithBoutNumbers.forEach(category => {
      category.bracketGroups.forEach(bracket => {
        // First assign semifinal bout numbers
        bracket.bouts.forEach((bout, boutIndex) => {
          if (boutIndex < 2) { // Semifinals
            bout.boutNum = boutNumberCounter++;
          }
        });
        
        // Then assign final bout numbers after all semifinals
        bracket.bouts[2].boutNum = boutNumberCounter++;
      });
    });
    
    return categoriesWithBoutNumbers;
  }, [weightClassCategories]);
  
  // Filter the categories based on the active filter
  const filteredCategories = useMemo(() => {
    if (activeFilter === 'ALL') {
      return processedCategories;
    }
    return processedCategories.filter(
      category => category.ageGenderGroup === activeFilter
    );
  }, [processedCategories, activeFilter]);
  
  // Count the number of brackets in each age/gender category
  const categoryCount = useMemo(() => {
    const counts: Record<AgeGenderType, number> = {
      'MEN': 0,
      'WOMEN': 0,
      'BOYS': 0,
      'GIRLS': 0
    };
    
    processedCategories.forEach(category => {
      counts[category.ageGenderGroup] += 1;
    });
    
    return counts;
  }, [processedCategories]);
  
  // No fighters in the roster
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


<h2 className="text-2xl font-bold mb-4 text-center">
        Bracket Display
        </h2>

      {/* Filter buttons at the top */}
      <div className="flex flex-wrap gap-2 justify-center mb-6">
        <Button
          variant={activeFilter === 'ALL' ? "default" : "outline"}
          onClick={() => setActiveFilter('ALL')}
          className="min-w-24"
        >
          ALL ({processedCategories.length})
        </Button>
        
        <Button
          variant={activeFilter === 'MEN' ? "default" : "outline"}
          onClick={() => setActiveFilter('MEN')}
          className="min-w-24 hover:bg-blue-700"
        >
          MEN ({categoryCount.MEN})
        </Button>
        
        <Button
          variant={activeFilter === 'WOMEN' ? "default" : "outline"}
          onClick={() => setActiveFilter('WOMEN')}
          className="min-w-24 hover:bg-pink-600"
        >
          WOMEN ({categoryCount.WOMEN})
        </Button>
        
        <Button
          variant={activeFilter === 'BOYS' ? "default" : "outline"}
          onClick={() => setActiveFilter('BOYS')}
          className="min-w-24 hover:bg-blue-500"
        >
          BOYS ({categoryCount.BOYS})
        </Button>
        
        <Button
          variant={activeFilter === 'GIRLS' ? "default" : "outline"}
          onClick={() => setActiveFilter('GIRLS')}
          className="min-w-24 hover:bg-pink-400"
        >
          GIRLS ({categoryCount.GIRLS})
        </Button>
      </div>
      
      {/* Display filtered categories */}
      {filteredCategories.map(({ categoryKey, displayName, bracketGroups }) => (
        <div key={categoryKey} className="border rounded-lg p-4">
          <h2 className="text-xl font-bold mb-4 bg-black text-white rounded-lg p-2 text-center">{displayName}</h2>
          
          {bracketGroups.length > 1 ? (
            <div className="space-y-6">
              {bracketGroups.map((bracket, index) => (
                <div key={`${categoryKey}-${index}`}>
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
              bracket={bracketGroups[0]}
              handleFighterClick={handleFighterClick}
              isAdmin={isAdmin}
              onBoutSelect={onBoutSelect}
            />
          )}
        </div>
      ))}
      
      {processedCategories.length === 0 && (
        <div className="border border-dashed rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">
            No valid brackets could be created. Ensure fighters have weightclass and age_gender assigned.
          </p>
        </div>
      )}
      
      {filteredCategories.length === 0 && processedCategories.length > 0 && (
        <div className="border border-dashed rounded-lg bg-gray-50 p-4 text-center">
          <p className="text-sm text-gray-500">
            No {activeFilter.toLowerCase()} brackets found. Try another filter.
          </p>
        </div>
      )}
    </div>
  );
}