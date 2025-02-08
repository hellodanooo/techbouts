import React from 'react';
import { Metadata } from 'next';
import YearSelector from '@/components/selectors/YearSelector';
import MultiTermSearch from '@/components/searchbars/FighterSearch';
import { fetchPMTFighters, fetchIKFFighters, Fighter } from '@/utils/records/fetchFighters';

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
    fighters = await fetchIKFFighters();
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
    fighters = await fetchIKFFighters();
  } else {
    return <div>Invalid sanctioning body specified</div>
  }

  return (
    <div className="database_page">
      <h1>{sanctioning.toUpperCase()} Fighter Database</h1>
      {sanctioning === 'pmt' && (
        <div>
          <YearSelector />
          <p>Total Fighters for {selectedYear}: {fighters.length}</p>
        </div>
      )}
      {sanctioning === 'ikf' && <p>Total Fighters: {fighters.length}</p>}
      <MultiTermSearch initialFighters={fighters} sanctioning={sanctioning} year={selectedYear} />
    </div>
  );
}