// utils/types.ts

export interface FullContactFighter {
  fighter_id: string;
  first: string;
  last: string;
  dob: string;
  age: number;
  gender: 'MALE' | 'FEMALE';
  photo: string;
  heightFoot?: number;
  heightInch?: number;
  heightCm?: number;
  gym: string;
  gym_id: string;
  coach: string;
  coach_email: string;
  coach_name: string;
  state: string;
  city: string;
  weightclass: number;
  age_gender: 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS';
  docId: string;
  // Record
  mt_win: number;
  mt_loss: number;
  boxing_win: number;
  boxing_loss: number;
  mma_win: number;
  mma_loss: number;
  pmt_win: number;
  pmt_loss: number;
  pb_win: number;
  pb_loss: number;
  other_exp: string;
  nc: number;
  dq: number;
  years_exp: number;
  pmt_fights: PMTFight[];
  fullContactbouts?: RosterFighter[];
  // contact
  email: string;
  phone: string;
  coach_phone: string;
  gym_website: string;
  gym_address: string;

}

export interface RosterFighter extends FullContactFighter {
result: 'W' | 'L' | 'NC' | 'DQ' | 'DRAW' | '-';
weighin: number;
photo_package?: boolean;
date_registered?: string;
payment_info: {
  paymentIntentId: string | '';
  paymentAmount: number | 0;
  paymentCurrency: string | '';
};
}

export interface PmtFighterRecord {
  pmt_id: string;
  first: string;
  last: string;
  gym?: string;
  email?: string;
  age?: number;
  weightclass?: number; // Single weight class instead of an array
  weighin?: number;
  win?: number;

  loss?: number;
  tournament_win?: number;
  tournament_loss?: number;
  nc?: number;
  dq?: number;
  lastUpdated?: string;

  // Skill Ratings (Optional)
  bodykick?: number;
  boxing?: number;
  clinch?: number;
  defense?: number;
  footwork?: number;
  headkick?: number;
  kicks?: number;
  knees?: number;
  legkick?: number;
  ringawareness?: number;

  // Fight History
  fights?: Array<{
    eventId: string;
    eventName: string;
    date: string;
    result: string;
    weightclass: number;
    opponent_id?: string;
    bout_type: string;
    bodykick?: number;
    boxing?: number;
    clinch?: number;
    defense?: number;
    footwork?: number;
    headkick?: number;
    kicks?: number;
    knees?: number;
    legkick?: number;
    ringawareness?: number;
  }>;
}

export interface Bout {
  boutId: string;
  weightclass: number;
  ringNum: number;
  boutNum: number;
  red: RosterFighter | null;
  blue: RosterFighter | null;
  scrapeVerificationScore?: number;
methodOfVictory: string;
confirmed?: boolean;
eventId: string;
  eventName: string;
  url: string;
  date: string;
  promotionId: string;
  promotionName: string;
  sanctioning: string;
  bout_ruleset: string;
  bracket_bout_type?: 'semifinal' | 'final'| 'qualifier' | '';
  bracket_bout_fighters?: RosterFighter[]; // ORDER OF FIGHTERS IS THE SEEDS
  dayNum: number;
  class: 'A' | 'B' | 'C' | '';
}

export interface Bracket {
bouts: Bout[];
bye?: RosterFighter;
}


export interface EventType {
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
  currency?: string;
  disableRegistration: boolean;
  registration_link?: string;
  matches_link?: string;
  weighin_date?: string;
  weighin_start_time?: string;
  weighin_end_time?: string;
  rules_meeting_time?: string;
  bouts_start_time?: string;
  docId?: string;
  doors_open?: string;
  spectator_info?: string;
  registration_enabled: boolean;
  registration_fee: number;
  tickets_enabled: boolean;
  ticket_price: number;
  ticket_price_description?: string;
  ticket_price2?: number;
  ticket_price2_description?: string;
  event_details?: string;
  coachRegPrice: number;
  coachRegEnabled?: boolean;
  photos_enabled?: boolean;
  photos_price?: number;
  sanctioning: string;
  sanctioningEmail?: string;
  email: string;
  promoterId: string;
  promoterEmail: string;
  promotionName: string;
  status?: string;
  street?: string;
  postal_code?: string;
  country: string;
  colonia?: string;
  municipality?: string;
  ticket_enabled?: boolean;
  ticket_system_option?: 'inHouse' | 'thirdParty' | 'none';
  ticket_link?: string;
  zip?: string;
  name?: string;
  numMats: number;
  locale: string;
  photoPackagePrice: number;
  photoPackageEnabled: boolean;
  payLaterEnabled?: boolean;
  sanctioningLogoUrl?: string;
  promotionLogoUrl?: string;
  stripeAccountId?: string;
  customWaiver?: string;
  bout_type?: string;
  redirect_url?: string;
  display_roster?: boolean;
  display_matches: boolean;
  recieve_email_notifications: boolean;
}

export type GymRecord = {
  boysWin: number;
  boysLoss: number;
  girlsWin: number;
  girlsLoss: number;
  menWin: number;
  menLoss: number;
  womanWin: number;
  womanLoss: number;
  address: string;
  city: string;
  state: string;
  id: string;
  name: string;
  logo: string;
  pmt_win?: number;
  pmt_loss?: number;
  pmt_nc?: number;
  pmt_dq?: number;
  win: number;
  loss: number;
  nc: number;
  dq: number;
  totalFighters: number;
  pmt_total_fighters?: number;
  pmt_stats?: {
    bodykick: number;
    boxing: number;
    clinch: number;
    defense: number;
    footwork: number;
    headkick: number;
    kicks: number;
    knees: number;
    legkick: number;
    ringawareness: number;
  };
  yearlyStats?: {
    [year: string]: {
      win: number;
      loss: number;
      nc: number;
      dq: number;

      total_fighters: number;
      fights: number;
    }
  };
  pmt_yearly_stats?: {
    [year: string]: {
      win: number;
      loss: number;
      nc: number;
      dq: number;
 
      total_fighters: number;
      fights: number;
      by_location?: {
        [locationKey: string]: {
          win: number;
          loss: number;
          nc: number;
          dq: number;
    
          fights: number;
        }
      }
    }
  };
  pmt_location_stats?: {
    [locationKey: string]: {
      win: number;
      loss: number;
      nc: number;
      dq: number;
      fights: number;
    }
  };
  pmt_top_locations?: Array<{
    name: string;
    win_percentage: number;
    win: number;
    loss: number;
    fights: number;
  }>;
  fighters?: FullContactFighter[];
  lastUpdated: string;
  source: string;
  website: string;
}




////////////////////////////





export interface PMTFight {
  eventId: string;
  eventName: string;
  date: string;
  result: string;
  weightclass: number;
  opponent_id?: string;
  bout_type: string;
  bodykick?: number;
  boxing?: number;
  clinch?: number;
  defense?: number;
  footwork?: number;
  headkick?: number;
  kicks?: number;
  knees?: number;
  legkick?: number;
  ringawareness?: number;
}

export type Official = {
  email: string;
  city: string;
  first: string;
  last: string;
  payment: string;
  paymentId: string;
  phone: string;
  photo: string;
  position?: string;
  state: string;
  official_id: string;
  id: string;
  bouts_judged: number;
  bouts_reffed: number;
  facebookUrl: string;
  mat?: number;
  location?: string;
  judgedBefore: boolean;
  muayThaiExperience: string;
  paymentType: string;
  officialId: string;
  quizScore?: number;

}

interface EmailCampaign {
  id: string;
  promotion: string;
  subject: string;
  sentAt: string;
  totalSent: number;
  totalOpened: number;
  sentEmails: string[];
  openedEmails: string[];
  isTest: boolean;
}


export interface FightRecord {
  date: string;
  eventName: string;
  result: string;
  opponent_id?: string;
  weightclass?: number;
  bout_type?: string;
}



export interface Promoter {
  city: string;
  email: string;
  firstName: string;
  lastName: string;
  name: string;
  phone: string;
  promoterId: string;
  promotionName: string;
  sanctioning: string[];
  state: string;
  createdAt?: string;
  promotion?: string;
  logo?: string;
  website?: string;
  facebook: string;
  instagram: string;


};





export interface SanctioningBody {
  id: string;
  name: string;
  email: string;
  website: string;
  region: string;
  country: string;
  state: string;
  city: string;
  address: string;
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
  rulesUrl: string;
}


// export interface EventType {
//   competition_type: 'FightCard' | 'Tournament';
//   event_name: string;
//   venue_name?: string;
//   address: string;
//   eventId: string;
//   id: string;
//   city: string;
//   state: string;
//   date: string;
//   flyer: string;
//   coordinates?: { latitude: number; longitude: number };
//   currency?: string;
//   disableRegistration: boolean;
//   registration_link?: string;
//   matches_link?: string;
//   weighin_date?: string;
//   weighin_start_time?: string;
//   weighin_end_time?: string;
//   rules_meeting_time?: string;
//   bouts_start_time?: string;
//   docId?: string;
//   doors_open?: string;
//   spectator_info?: string;
//   registration_enabled: boolean;
//   registration_fee: number;
//   tickets_enabled: boolean;
//   ticket_price: number;
//   ticket_price_description?: string;
//   ticket_price2?: number;
//   ticket_price2_description?: string;
//   event_details?: string;
//   coachRegPrice: number;
//   coachRegEnabled?: boolean;
//   photos_enabled?: boolean;
//   photos_price?: number;
//   sanctioning: string;
//   sanctioningEmail?: string;
//   email: string;
//   promoterId: string;
//   promoterEmail: string;
//   promotionName: string;
//   status?: string;
//   street?: string;
//   postal_code?: string;
//   country: string;
//   colonia?: string;
//   municipality?: string;
//   ticket_enabled?: boolean;
//   ticket_system_option?: 'inHouse' | 'thirdParty' | 'none';
//   ticket_link?: string;
//   zip?: string;
//   name?: string;
//   numMats: number;
//   locale: string;
//   photoPackagePrice: number;
//   photoPackageEnabled: boolean;
//   payLaterEnabled?: boolean;
//   sanctioningLogoUrl?: string;
//   promotionLogoUrl?: string;
//   stripeAccountId?: string;
// }

// export interface BaseFighter {
//   first: string;
//   last: string;
//   gym: string;
//   gender: string;
//   win: number;
//   loss: number;
//   age: number;
//   dob: string;
//   email: string;
//   weightclass: number;
//   coach_email: string;
//   address: string;
//   city: string;
//   coach: string;
//   coach_phone: string;
//   docId: string;
//   fighter_id: string;
//   gym_id: string;
//   height: number;
//   state: string;
//   website: string;
// }

// export interface ResultsFighter extends BaseFighter {
//   // IDs and References
//   pmt_id: string;
//   id: string;
//   docId: string;
//   eventDocId: string;
//   gym_id: string;

//   // Bout specific information
//   weighin: number;
//   result: string;
//   opponent_id: string;
//   event: string;
//   boutid: string;
//   boutmat: string;
//   bout: number;
//   mat: number;
//   bout_type: string;

//   // Location information
//   comp_city: string;
//   comp_state: string;
//   street1?: string;
//   state: string;
//   post_code?: string;

//   // Contact information
//   phone?: string;
//   coach_name: string;
//   trainer?: string;


//   // Competition details
//   fighternum: 'fighter1' | 'fighter2' | 'unmatched' | 'bye';
//   ammy: number;
//   years_exp: number;
//   registrationFee?: number;
//   paymentIntentId?: string;
//   paired?: boolean;
//   photo_package: boolean;
//   class: 'A' | 'B' | 'C';
//   confirmed: boolean;
//   day: number;
//   age_gender: 'MEN' | 'WOMEN' | 'BOYS' | 'GIRLS';

//   // Skill metrics
//   legkick: number;
//   bodykick: number;
//   headkick: number;
//   clinch: number;
//   defense: number;
//   kicks: number;
//   footwork: number;
//   boxing: number;
//   knees: number;
//   ringawareness: number;

//   // Additional information
//   photo?: string;
//   other?: string;
//   championship_result?: string;
//   bracket?: number;
//   ikf_win?: number;
//   ikf_loss?: number;
 

// }

// export interface FighterProfile {
//   fighter_id: string;
//   first: string;
//   last: string;
//   photo?: string;
//   win: number;
//   loss: number;
//   gym: string;
//   weightclass: number;
//   age: number;
//   gender: string;
//   style: 'Full-Contact' | 'Semi-Contact' | 'Both'; // Indicate competition style
//   pmt_data?: PmtFighterRecord; // Store PMT-specific fighter data
// }







// export type GymProfile = {
//   gym: string;
//   win: number;
//   loss: number;
//   logo: string;
//   website: string;
//   address: string;
//   city: string;
//   state: string;
//   docId?: string;
//   boysWin: number;
//   boysLoss: number;
//   girlsWin: number;
//   girlsLoss: number;
//   menWin: number;
//   menLoss: number;
//   womanLoss: number;
//   womanWin: number;
//   latitude: number;
//   longitude: number;
//   id: string;
//   suspended: boolean;
//   suspensionLength: number;
//   suspensionDate: string;
//   suspensionReason: string;
//   athletes: ResultsFighter[];
//   coaches_names?: string[];
//   coach_phone?: string;
//   coach_email: string;
//   coach_name?: string;

// }


// export interface FighterFormData {
//   first: string;
//   last: string;
//   email: string;
//   dob: string;
//   gym: string;
//   age: number;
//   weightclass: number;
//   mtp_id: string;
//   win: number;
//   loss: number;
//   mmaWin: number;
//   mmaLoss: number;
//   gender: string;
//   years_exp: number;
//   other: string;
//   height: number;
//   heightFoot: number;
//   heightInch: number;
//   phone: string;
//   coach_phone: string;
//   coach_name: string;
//   coach_email?: string;
//   city?: string;
//   state?: string;
//   gym_id: string;
//   website?: string;
//   address?: string;
// }

// export type CityStateWinCount = {
//   city: string;
//   state: string;
//   winCount: number;
// };