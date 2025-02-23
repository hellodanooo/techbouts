import React from 'react';
import { Metadata } from 'next';
import YearSelector from '@/components/selectors/YearSelector';
import FighterSearchTable from '@/components/tables/FighterSearchTable';
import { fetchPMTFighters, Fighter } from '@/utils/records/fetchFighters';
import {fetchTechBoutsFighters} from '@/utils/records/fetchFighters';
//import {gatherPuristRosters} from '@/utils/records/gatherPuristRosters';



import Image from 'next/image';

export async function generateMetadata(props: { 
  params: Promise<{ sanctioning: string }>;
  searchParams: Promise<{ year?: string }>;
}): Promise<Metadata> {
  const sanctioning = (await props.params).sanctioning.toLowerCase();
  const searchParams = await props.searchParams;

  let fighters: Fighter[] = [];
  if (sanctioning === 'pmt') {
    const year = searchParams.year || '2024';

    fighters = await fetchPMTFighters(year);

  } else if (sanctioning === 'ikf') {

   console.log("Metadata sanctioning IKF: Fetching fighters");
     fighters = await fetchTechBoutsFighters();
console.log("Metadata sanctioning IKF Fighters", fighters);
  } else {
    return {
      title: 'Invalid Sanctioning Body',
      description: 'Invalid sanctioning body specified.',
    };
  }

  const sanctioningUpper = sanctioning.toUpperCase();
  return {
    title: `${sanctioningUpper} Fighter Database - ${fighters.length} Fighters`,
    description: `Explore our ${sanctioningUpper} fighter database with ${fighters.length} fighters grouped by weight class, gym, and more.`,
  };
}

export default async function FighterDatabase(props: {
  params: Promise<{ sanctioning: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const sanctioning = (await props.params).sanctioning.toLowerCase();
  const searchParams = await props.searchParams;
  let fighters: Fighter[] = [];
  let selectedYear = '2024';

  if (!['pmt', 'ikf'].includes(sanctioning)) {
    return <div>Invalid sanctioning body specified</div>;
  }

  if (sanctioning === 'pmt') {
    selectedYear = searchParams.year || '2024';
    fighters = await fetchPMTFighters(selectedYear);
  } else if (sanctioning === 'ikf') {
  
      fighters = await fetchTechBoutsFighters();

    //fighters = await gatherPuristRosters();

  } else {
    return <div>Invalid sanctioning body specified</div>
  }

  return (
    <div className="w-full flex flex-col items-center space-y-6">
      <h1 className="text-2xl font-bold">{sanctioning.toUpperCase()} Fighter Database</h1>
      
      {sanctioning === 'pmt' && (
        <Image
          src="/logos/pmt_logo_2024_sm.png"
          alt="PMT Database"
          width={250}
          height={125}
          className="rounded-lg shadow-lg"
        />
      )}
      
      {sanctioning === 'ikf' && (
        <Image
          src="/logos/ikf_logo.png"
          alt="IKF Database"
          width={250}
          height={125}
          className="rounded-lg shadow-lg"
        />
      )}

      <YearSelector />
      
      <div className="text-center">
        {sanctioning === 'pmt' && (
          <p>Total Fighters for {selectedYear}: {fighters.length}</p>
        )}
        {sanctioning === 'ikf' && (
          <p>Total Fighters: {fighters.length}</p>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        <FighterSearchTable 
          initialFighters={fighters} 
          sanctioning={sanctioning} 
          year={selectedYear} 
        />
      </div>
    </div>
);
}