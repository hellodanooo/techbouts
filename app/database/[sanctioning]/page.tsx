import React from 'react';
import { Metadata } from 'next';
import YearSelector from '@/components/selectors/YearSelector';
import FighterSearchTable from '@/components/tables/FighterSearchTable';
import { fetchPMTFighters } from '@/utils/records/fetchFighters';
import { fetchTechBoutsFighters } from '@/utils/records/fetchFighters';
import { FullContactFighter, PmtFighterRecord } from '@/utils/types';
import Image from 'next/image';

export async function generateMetadata(props: { 
  params: Promise<{ sanctioning: string }>;
  searchParams: Promise<{ year?: string }>;
}): Promise<Metadata> {
  const sanctioning = (await props.params).sanctioning.toLowerCase();
  const searchParams = await props.searchParams;
  let fighterCount = 0;

  if (sanctioning === 'pmt') {
    const year = searchParams.year || '2024';
    const fighters = await fetchPMTFighters(year);
    fighterCount = fighters.length;
  } else if (sanctioning === 'ikf') {
    const fighters = await fetchTechBoutsFighters();
    fighterCount = fighters.length;
  }

  const sanctioningUpper = sanctioning.toUpperCase();
  return {
    title: `${sanctioningUpper} Fighter Database - ${fighterCount} Fighters`,
    description: `Explore our ${sanctioningUpper} fighter database with ${fighterCount} fighters grouped by weight class, gym, and more.`,
  };
}

export default async function FighterDatabase(props: {
  params: Promise<{ sanctioning: string }>;
  searchParams: Promise<{ year?: string }>;
}) {
  const sanctioning = (await props.params).sanctioning.toLowerCase();
  const searchParams = await props.searchParams;
  let pmtFighters: PmtFighterRecord[] = [];
  let techBoutsFighters: FullContactFighter[] = [];
  let selectedYear = '2024';

  if (!['pmt', 'ikf'].includes(sanctioning)) {
    return <div>Invalid sanctioning body specified</div>;
  }

  if (sanctioning === 'pmt') {
    selectedYear = searchParams.year || '2024';
    pmtFighters = await fetchPMTFighters(selectedYear);
  } else if (sanctioning === 'ikf') {
    techBoutsFighters = await fetchTechBoutsFighters();
  }

  const fighterCount = sanctioning === 'pmt' ? pmtFighters.length : techBoutsFighters.length;

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

      {sanctioning === 'pmt' && <YearSelector />}
      
      <div className="text-center">
        {sanctioning === 'pmt' && (
          <p>Total Fighters for {selectedYear}: {fighterCount}</p>
        )}
        {sanctioning === 'ikf' && (
          <p>Total Fighters: {fighterCount}</p>
        )}
      </div>

      <div className="w-full overflow-x-auto">
        {sanctioning === 'pmt' ? (
          <FighterSearchTable 
            initialFighters={pmtFighters} 
            sanctioning={sanctioning} 
            year={selectedYear} 
          />
        ) : (
          <FighterSearchTable 
            initialFighters={techBoutsFighters} 
            sanctioning={sanctioning} 
            year={selectedYear} 
          />
        )}
      </div>
    </div>
  );
}