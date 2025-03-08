// app/page.tsx 
import { Metadata } from 'next';
import PageContent from './PageContent';

export const metadata: Metadata = {
  title: 'TechBouts - Boxing Event Management & Rankings Platform',
  description: 'Professional boxing platform for event management, rankings, and fighter tracking. Streamline promotions, manage gyms, and grow your boxing community.',
  keywords: [
    'boxing event management',
    'boxing rankings',
    'fighter profiles',
    'boxing promoter tools',
    'gym management',
    'boxing events',
    'fight scheduling',
    'boxing database',
    'boxing community platform',
    'boxing promotion software'
  ],
  openGraph: {
    type: 'website',
    title: 'TechBouts - Boxing Event Management & Rankings Platform',
    description: 'Professional boxing platform for event management, rankings, and fighter tracking. Streamline promotions, manage gyms, and grow your boxing community.',
    images: [
      {
        url: '/logos/techboutslogoFlat.png',
        width: 1200,
        height: 630,
        alt: 'TechBouts Platform',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechBouts - Boxing Event Management & Rankings Platform',
    description: 'Professional boxing platform for event management, rankings, and fighter tracking. Streamline promotions, manage gyms, and grow your boxing community.',
    images: ['/logos/techboutslogoFlat.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  }
};

export default function Home() {
  return <PageContent />;
}