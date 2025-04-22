// utils/handleFighterClick.ts
import { RosterFighter } from '@/utils/types';
// Import the router type using typeof
import { useRouter } from 'next/navigation';

// Define the router type using the return type of useRouter
type AppRouter = ReturnType<typeof useRouter>;

/**
 * Creates a reusable fighter selection handler for match creation and fighter detail navigation
 * 
 * @param isAdmin Whether the current user is an admin
 * @param router Next router for navigation (used for non-admin navigation)
 * @param setRed Function to set the red corner fighter
 * @param setBlue Function to set the blue corner fighter
 * @param setSelectedFighter Function to set the currently selected fighter
 * @param red Current red corner fighter
 * @param blue Current blue corner fighter
 * @returns A handler function for fighter clicks
 */
export const fighterClick = (
  isAdmin: boolean = false,
  router?: AppRouter,
  setRed?: (fighter: RosterFighter | null) => void,
  setBlue?: (fighter: RosterFighter | null) => void,
  setSelectedFighter?: (fighter: RosterFighter | null) => void,
  red?: RosterFighter | null,
  blue?: RosterFighter | null
) => {
  return (fighter: RosterFighter) => {
    // For non-admin users, navigate to fighter detail page
    if (!isAdmin) {
      navigateToFighterDetail(fighter, router);
      return;
    }
    
    console.log('Fighter clicked:', fighter);

    // For admin users, handle fighter selection for match creation
    if (setRed && setBlue && setSelectedFighter) {
      // If no fighter is selected yet, or if red & blue are both set, pick fighter for red
      if (!red || (red && blue)) {
        setRed(fighter);
        setBlue(null);
        setSelectedFighter(fighter);
      }
      // If red is set but blue isn't, pick this fighter for blue
      else if (!blue) {
        setBlue(fighter);
        setSelectedFighter(fighter);
      }
    }
  };
};

/**
 * Navigates to the fighter detail page
 * 
 * @param fighter The fighter to navigate to
 * @param router Next router instance
 */
export const navigateToFighterDetail = (fighter: RosterFighter, router?: AppRouter) => {
  const fighterId = fighter.fighter_id;
  if (fighterId && router) {
    router.push(`/fighter/${fighterId}`);
  } else {
    console.error("Fighter ID not available for navigation or router not provided");
  }
};