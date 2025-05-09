'use client';

import useIsMobile from '@/hooks/useIsMobile';

export default function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const isMobile = useIsMobile();
  const spacingClass = isMobile ? 'mb-20' : 'mt-20';

  return (
    <div className={spacingClass}>
      {children}
    </div>
  );
}
