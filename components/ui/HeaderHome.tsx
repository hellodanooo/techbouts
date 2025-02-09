'use client';

import Link from 'next/link';
import Image from 'next/image';

interface HeaderHomeProps {
  isAdmin?: boolean;
  isPromoter?: boolean;
}

const HeaderHome = ({ isAdmin }: HeaderHomeProps) => {
  return (
    <header className="w-full flex justify-between items-center bg-gray-100 dark:bg-gray-900 p-4 sm:p-6 shadow-md">
      <h1 className="text-lg sm:text-2xl font-semibold">
        <Image src="/logos/techboutslogoFlat.png" alt="Logo" width={150} height={60} />
      </h1>
      <nav className="flex gap-6">
        <Link
          href="/promoters"
          className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
        >
          Promoters
        </Link>
        <Link
          href="/sanctioning"
          className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
        >
          Sanctioning
        </Link>
        <Link
          href="/database"
          className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
        >
          Database
        </Link>
        <Link
          href="/create"
          className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
        >
          Create Event
        </Link>
        {isAdmin && (
          <Link
            href="/emails/pmt"
            className="text-sm sm:text-base hover:underline text-blue-500 dark:text-blue-400"
          >
            Emails
          </Link>
        )}
      </nav>
    </header>
  );
};

export default HeaderHome;