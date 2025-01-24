export interface Event {
  competition_type: 'FightCard' | 'Tournament';
  event_name: string;
  venue_name?: string;
  address: string;
  eventId: string;
  id: string;
  city: string;
  state: string;
  date: string;
  flyer: string;
  coordinates?: { latitude: number; longitude: number };
  registration_link?: string;
  matches_link?: string;
  weighin_date: string;
  weighin_start_time: string;
  weighin_end_time: string;
  rules_meeting_time: string;
  bouts_start_time: string;
  docId: string;
  doors_open: string;
  spectator_info: string;
  registration_enabled: boolean;
  registration_fee: number;
  tickets_enabled: boolean;
  ticket_price: number;
  ticket_price_description: string;
  ticket_price2: number;
  ticket_price2_description: string;
  event_details: string;
  coach_price: number;
  coach_enabled: boolean;
  photos_enabled: boolean;
  photos_price: number;
  sanctioning: string;
  promotion: string;
  email: string;
  promoterId: string;
  promoterEmail: string;
  status?: string;
  street?: string;
  postal_code?: string;
  country?: string;
  colonia?: string;
  municipality?: string;
  ticket_enabled: boolean;
  ticket_system_option: 'inHouse' | 'thirdParty' | 'none';
  ticket_link?: string;
  zip?: string;
  name?: string;
  numMats?: number;
}

export interface Promoter  {
  city: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  promoterId: string;
  promotion: string;
  sanctioning: string;
  state: string;
  createdAt?: string;
};

export interface BasicSanctioningBody {
  id: string;
  name: string;
  email: string;
  website: string;
  region: string;
}

export interface DetailedSanctioningBody extends BasicSanctioningBody {
  officialName: string;
  registeredAddress: string;
  corporateUrl: string;
  yearsActive: number;
  combatSportsTypes: string[];
  representativeName: string;
  representativeTitle: string;
  licenseNumber?: string;
  insuranceProvider?: string;
  stateAffiliations: string[];
  mainOfficePhone: string;
  emergencyContact: string;
}

export interface BaseFighter {
  first: string;
  last: string;
  gym: string;
  gender: string;
  win: number;
  loss: number;
  age: number;
  dob: string;
  email: string;
  weightclass: number;
  coach_email: string;
}

export interface FighterProfile extends BaseFighter {
  mtp_id: string;
  dq: string;
  ex: string;
  mtp_rank: number;
  winsByCityState: CityStateWinCount[];
  photo?: string;

}

// Competition result specific properties
export interface ResultsFighter extends BaseFighter {
  // IDs and References
  pmt_id: string;
  id: string;
  docId: string;
  eventDocId: string;
  gym_id: string;
  
  // Bout specific information
  weighin: number;
  result: string;
  opponent_id: string;
  event: string;
  boutid: string;
  boutmat: string;
  bout: number;
  mat: number;
  bout_type: string;
  
  // Location information
  comp_city: string;
  comp_state: string;
  street1?: string;
  city?: string;
  state: string;
  post_code?: string;
  
  // Contact information
  phone?: string;
  coach_name: string;
  coach_phone?: string;
  trainer?: string;
  website?: string;
  
  // Physical attributes
  height?: number;
  
  // Competition details
  fighternum: 'fighter1' | 'fighter2' | 'unmatched' | 'bye';
  ammy: number;
  years_exp: number;
  registrationFee?: number;
  paymentIntentId?: string;
  paired?: boolean;
  photo_package: boolean;
  class: 'A' | 'B' | 'C';
  confirmed: boolean;
  day: number;
  age_gender: 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS';
  
  // Skill metrics
  legkick: number;
  bodykick: number;
  headkick: number;
  clinch: number;
  defense: number;
  kicks: number;
  footwork: number;
  boxing: number;
  knees: number;
  ringawareness: number;
  
  // Additional information
  address?: string;
  photo?: string;
  other?: string;
  championship_result?: string;
  bracket?: number;
  ikf_wins?: number;
  ikf_losses?: number;
}

// Helper type for fighter display in the profile page
export interface FighterDisplay extends BaseFighter {
  fighter_id: string;
  photo?: string;
  city?: string;
  state?: string;
  bouts?: {
    result: string;
    opponentName: string;
    date: string;
    promotionName: string;
    sanctioningBody: string;
  }[];
}

// export type PuristFighter = {
//   first: string;
//   last: string;
//   gym: string;
//   dob: string;
//   gender: string;
 
//   weightclass: number;
//   mtp_id: string;
//   email: string;
//   age: number;
//   city:string;
//   state: string;
//   photo?: string;
//   gymlogo: string;
//   gymwebsite: string;
//   gymaddress: string;
  
//   height: number;
//   heightFoot?: number;
//   heightInch?: number;

//   win: number;
//   loss: number;
//   pmt_win: number;
//   pmt_loss: number;
//   mma_win: number;
//   mma_loss: number;
//   boxing_win: number;
//   boxing_loss: number;

//   docId: string;
//   boutNum?:number;
//   confirmed?:boolean;
  
//   gym_id:string;
//   fighterId?:string;
//   titleFight?:boolean;
//   result?: 'W' | 'L' | 'NC' | 'DQ';
//   phone: string;

//     coach_email?: string;
//   coach_name: string;
//   coach_phone: string;
//   website:string;
//   address:string;

//   score?: number;
//   bracket?: number;
//   bout?: number;
//   fighterNum?:number;
//   id?: string;
//   class: string;
//   division: string;


//   } 

  export type GymProfile = {
    gym: string;
    win: number;
    loss: number;
    logo: string;
    website: string;
    address: string;
    city: string;
    state: string;
    docId?: string;
    boysWin: number;
    boysLoss: number;
    girlsWin: number;
    girlsLoss: number;
    menWin: number;
    menLoss: number;
    womanLoss: number;
    womanWin: number;
    latitude: number;
    longitude: number;
    id: string;
    suspended: boolean;
    suspensionLength: number;
    suspensionDate: string;
    suspensionReason: string;
    athletes: ResultsFighter[];
    coach_name?: string;
    coach_phone?: string;
    coach_email: string;
  }







export interface FighterFormData {
  first: string;
  last: string;
  email: string;
  dob: string;
  gym: string;
  age: number;
  weightclass: number;
  mtp_id: string;
  win: number;
  loss: number;
  mmaWin: number;
  mmaLoss: number;
  gender: string;
  years_exp: number;
  other: string;
  height: number;
  heightFoot: number;
  heightInch: number;
  phone: string;
  coach_phone: string;
  coach_name: string;
  coach_email?: string;
  city?: string;
  state?: string;
  gym_id: string;
  website?: string;
  address?: string;
}

export type CityStateWinCount = {
  city: string;
  state: string;
  winCount: number;
};