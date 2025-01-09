
// utils/weightDivisions.ts

type WeightDivision = {
    name: string;
    min: number;
    max: number;
  };
  
  export const weightDivisions: WeightDivision[] = [
    { name: '70 lbs', min: 5, max: 70 },
    { name: '80 lbs', min: 70.1, max: 80 },
    { name: '90 lbs', min: 80.1, max: 90 },
    { name: '100 lbs', min: 90.1, max: 100 },
    { name: '108 lbs', min: 100.1, max: 108 },
    { name: 'Atomweight 112 lbs', min: 108.1, max: 112 },
    { name: 'Bantamweight 117 lbs', min: 112.1, max: 117 },
    { name: 'Bantamweight 122 lbs', min: 117.1, max: 122 },
    { name: 'Featherweight 127 lbs ', min: 122.1, max: 127 },
    { name: 'Lightweight 132 lbs', min: 127.1, max: 132 },
    { name: 'Super Lightweight 137 lbs', min: 132.1, max: 137 },
    { name: 'Light Welterweight 142 lbs', min: 137.1, max: 142 },
    { name: 'Welterweight 147 lbs', min: 142.1, max: 147 },
    { name: 'Super Welterweight 153 lbs', min: 147.2, max: 153 },
    { name: 'Light Middleweight 159 lbs', min: 153.1, max: 159 },
    { name: 'Middleweight 165 lbs', min: 159.1, max: 165 },
    { name: 'Super Middleweight 172 lbs', min: 165.1, max: 172 },
    { name: 'Light Heavyweight 179 lbs', min: 172.1, max: 179 },
    { name: 'Light Cruiserweight 186 lbs', min: 179.1, max: 186 },
    { name: 'Cruiserweight 195 lbs', min: 186.1, max: 195 },
    { name: 'Super Cruiserweight 215 lbs', min: 195.1, max: 215 },
    { name: 'Heavyweight 235 lbs', min: 215.1, max: 235 },
    { name: 'Supper Heavyweight 400 lbs', min: 235.1, max: 400 }
  ];

  export const weightClass: number[] = weightDivisions.map(division => division.max);
