// @/utils/handleFighterClick.ts
import { RosterFighter } from '@/utils/types';

export const fighterClick = (
  isAuthorized: boolean,
  router: any, // Use 'any' type to avoid specific router type issues
  setRed: (fighter: RosterFighter | null) => void,
  setBlue: (fighter: RosterFighter | null) => void,
  setSelectedFighter: (fighter: RosterFighter | null) => void,
  red: RosterFighter | null,
  blue: RosterFighter | null
) => {
  return (fighter: RosterFighter) => {
    // If user is authorized (admin, promoter, or sanctioning), handle as admin
    if (isAuthorized) {
      // Select fighter for creating/editing bouts
      if (!red) {
        setRed(fighter);
        setSelectedFighter(fighter);
      } else if (!blue) {
        setBlue(fighter);
        setSelectedFighter(fighter);
      } else {
        // Both already selected, reset and start with this fighter
        setRed(fighter);
        setBlue(null);
        setSelectedFighter(fighter);
      }
    } else {
      // Non-admin users - maybe just navigate to fighter profile
      if (fighter.fighter_id) {
        router.push(`/fighters/${fighter.fighter_id}`);
      }
    }
  };
};