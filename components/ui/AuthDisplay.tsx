// components/ui/AuthDisplay.tsx
'use client';

import { useMultiFirebase } from '@/context/MultiFirebaseContext';

export default function AuthDisplay() {
  const { user, authState } = useMultiFirebase();

  let displayText = 'Non User';
  let bgColor = 'bg-gray-100 dark:bg-gray-800';
  let textColor = 'text-gray-600 dark:text-gray-400';

  if (user.techbouts) {
    if (authState.isAdmin) {
      displayText = `Admin: ${user.techbouts.email}`;
      bgColor = 'bg-red-100 dark:bg-red-900';
      textColor = 'text-red-600 dark:text-red-300';
    } else if (authState.isPromoter) {
      displayText = `Promoter: ${user.techbouts.email}`;
      bgColor = 'bg-blue-100 dark:bg-blue-900';
      textColor = 'text-blue-600 dark:text-blue-300';
    } else {
      displayText = `User: ${user.techbouts.email}`;
      bgColor = 'bg-green-100 dark:bg-green-900';
      textColor = 'text-green-600 dark:text-green-300';
    }
  }

  return (
    <aside aria-hidden="true" className="fixed bottom-4 right-4 z-50">
      <div className={`${bgColor} px-4 py-2 rounded-lg shadow-md transition-all duration-200`}>
        <p className={`text-sm ${textColor}`}>
          {displayText}
        </p>
      </div>
    </aside>
  );
}