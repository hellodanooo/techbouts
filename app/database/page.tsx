import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import TransferPmtToTechbouts from './TransferPmtToTechbouts';

export const metadata = {
  title: 'Fighter Database Organizations',
  description: 'Choose between IKF and PMT fighter databases',
};

export default function FighterDatabase() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4">
      <h1 className="text-3xl font-bold mb-12">Select Organization Database</h1>
      <div className="flex flex-col md:flex-row gap-8 items-center">
        <Link 
          href="/database/ikf" 
          className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        >
          <Image
            src="/logos/ikf_logo.png"
            alt="IKF Database"
            width={250}
            height={125}
            className="rounded-lg shadow-lg"
          />
        </Link>
        <Link 
          href="/database/pmt" 
          className="transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
        >
          <Image
            src="/logos/pmt_logo_2024_sm.png"
            alt="PMT Database"
            width={250}
            height={125}
            className="rounded-lg shadow-lg"
          />
        </Link>
      </div>
      <TransferPmtToTechbouts />
    </div>
  );
}