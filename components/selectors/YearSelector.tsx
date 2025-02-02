// components/YearSelector.tsx
'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const YearSelector = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentYear = searchParams.get('year') || '2024';

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newYear = e.target.value;
    // Create a new URL search string with the updated year.
    const params = new URLSearchParams(searchParams.toString());
    params.set('year', newYear);
    router.push(`?${params.toString()}`);
  };

  return (
    <div>
      <label htmlFor="year-select" className="mr-2 font-medium">
        Select Year:
      </label>
      <select id="year-select" value={currentYear} onChange={handleChange}>
        <option value="2025">2025</option>
        <option value="2024">2024</option>
        <option value="2023">2023</option>
        <option value="2022">2022</option>
      </select>
    </div>
  );
};

export default YearSelector;