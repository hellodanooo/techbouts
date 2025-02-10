// components/ui/AuthDisplay.tsx
'use client';

import GoogleAuthButton from './GoogleAuthButton';

interface AuthDisplayProps {
  user: { email: string | null } | null;
  isAdmin: boolean;
  isNewUser: boolean;
  isPromoter?: boolean;
}

export default function AuthDisplay({ user, isAdmin }: AuthDisplayProps) {
  if (!user?.email) {
    return (
      <aside aria-hidden="true" className="fixed bottom-4 right-4 z-50">
        <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 rounded-lg shadow-md">   
    <GoogleAuthButton />

        </div>
      </aside>
    );
  }

  let displayText = `User: ${user.email}`;
  let bgColor = 'bg-green-100 dark:bg-green-900';
  let textColor = 'text-green-600 dark:text-green-300';

  if (isAdmin) {
    displayText = `Admin: ${user.email}`;
    bgColor = 'bg-red-100 dark:bg-red-900';
    textColor = 'text-red-600 dark:text-red-300';
  }

  return (
    <aside aria-hidden="true" className="fixed bottom-4 right-4 z-50">
      <div className={`${bgColor} px-4 py-2 rounded-lg shadow-md transition-all duration-200`}>
        <p className={`text-sm ${textColor}`}>{displayText}</p>
      </div>
    </aside>
  );
}