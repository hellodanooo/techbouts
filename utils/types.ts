

export type FighterProfile = {
first: string;
last: string;
gym: string;
dob: string;
gender: string;
win: number;
loss: number;
dq: string;
ex: string;
weightclass: number;
mtp_id: string;
email: string;
mtp_rank: number;
age: number;
coach_email: string;
} 

export type PuristFighter = {
  first: string;
  last: string;
  gym: string;
  dob: string;
  gender: string;
 
  weightclass: number;
  mtp_id: string;
  email: string;
  age: number;
  city:string;
  state: string;
  photo?: string;
  gymlogo: string;
  gymwebsite: string;
  gymaddress: string;
  
  height: number;
  heightFoot?: number;
  heightInch?: number;

  win: number;
  loss: number;
  pmt_win: number;
  pmt_loss: number;
  mma_win: number;
  mma_loss: number;
  boxing_win: number;
  boxing_loss: number;

  docId: string;
  boutNum?:number;
  confirmed?:boolean;
  
  gym_id:string;
  fighterId?:string;
  titleFight?:boolean;
  result?: 'W' | 'L' | 'NC' | 'DQ';
  phone: string;

    coach_email?: string;
  coach_name: string;
  coach_phone: string;
  website:string;
  address:string;

  score?: number;
  bracket?: number;
  bout?: number;
  fighterNum?:number;
  id?: string;
  class: string;
  division: string;


  } 

  export type ResultsFighter = {
    pmt_id: string;
    first: string;
    last: string;
    gym: string;
    gender: string;
    weighin: number;
    weightclass: number;
    win: number;
    loss: number;
    age: number;
    id: string;
    dob: string;
    result: string;
    opponent_id: string;
    event: string;
    boutid: string;
    email: string;
    height?: number;
    trainer?: string;
    coachesphone?: string;
    street1?: string;
    city?: string;
    state: string;
    post_code?: string;
    phone?: string;
    fighternum: 'fighter1' | 'fighter2' | 'unmatched' | 'bye';
    boutmat: string;
    bout: number;
    mat: number;
    docId: string;
    eventDocId: string;
    comp_city: string;
    comp_state: string;
    bout_type: string;
    registrationFee?: number;
    ammy: number;
    years_exp: number;
    other?: string;
    paymentIntentId?: string;
    paired?: boolean;
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
  photo_package: boolean;
  }

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
    coach_name: string;
    coach_phone: string;
  }


export type Event = {
  event_name: string;
  venue_name?: string;
  address: string;
  id: string;
  city: string;
  state: string;
  date: string;
  flyer: string;
  coordinates?: { latitude: number; longitude: number };
  link?: string;
  matches_link?: string;
  weighin_date: string;
  weighin_start_time: string;
  weighin_end_time: string;
  rules_meeting_time: string;
  bouts_start_time: string;
  docId: string;
  doors_open: string;
  spectator_info: string;
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