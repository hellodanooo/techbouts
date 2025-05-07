// @/utils/handleFighterClick.ts
import { RosterFighter } from '@/utils/types';

export const fighterClick = (
  isAuthorized: boolean,
  router: any, // Use 'any' type to avoid specific router type issues
  setRed: (fighter: RosterFighter | null) => void,
  setBlue: (fighter: RosterFighter | null) => void,
  setThird: (fighter: RosterFighter | null) => void, // Add third fighter state
  setFourth: (fighter: RosterFighter | null) => void, // Add fourth fighter state
  setSelectedFighter: (fighter: RosterFighter | null) => void,
  red: RosterFighter | null,
  blue: RosterFighter | null,
  third: RosterFighter | null,
  fourth: RosterFighter | null
) => {
  return (fighter: RosterFighter) => {
    // If user is authorized (admin, promoter, or sanctioning), handle as admin
    if (isAuthorized) {
      // Select fighter for creating/editing bouts or brackets
      if (!red) {
        setRed(fighter);
        setSelectedFighter(fighter);
        console.log("First fighter selected", fighter);
      } else if (!blue) {
        setBlue(fighter);
        setSelectedFighter(fighter);
        console.log("Second fighter selected", fighter);
      } else if (!third) {
        setThird(fighter);
        setSelectedFighter(fighter);
        console.log("Third fighter selected - placed in Bye position", fighter);
      } else if (!fourth) {
        setFourth(fighter);
        setSelectedFighter(fighter);
        
        // Log the entire bracket when the 4th fighter is selected
        console.log("Bracket complete! Here are the matchups:");
        console.log("Semifinal 1:", `${red.first} ${red.last} vs ${blue.first} ${blue.last}`);
        console.log("Semifinal 2:", `${third.first} ${third.last} vs ${fighter.first} ${fighter.last}`);
        
        // Print full details of all four fighters
        console.log("Fighter Details:");
        console.log("Red:", red);
        console.log("Blue:", blue);
        console.log("Third:", third);
        console.log("Fourth:", fighter);
      } else {
        // All fighter slots filled, restart with this fighter
        setRed(fighter);
        setBlue(null);
        setThird(null);
        setFourth(null);
        setSelectedFighter(fighter);
        console.log("Reset selection, new first fighter:", fighter);
      }
    } else {
      // Non-admin users - maybe just navigate to fighter profile
      if (fighter.fighter_id) {
        router.push(`/fighter/${fighter.fighter_id}`);
      }
    }
  };
};