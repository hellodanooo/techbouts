// app/layout.tsx
import type { Metadata } from "next";
import localFont from "next/font/local";
import { AuthProvider } from "@/context/AuthContext";
import "@/styles/globals.css";
import 'mapbox-gl/dist/mapbox-gl.css';
import GoogleMapsProvider from "@/components/ui/GoogleMapsProvider"; // Import our provider


const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  metadataBase: new URL('https://techbouts.com'), // Replace with your domain
  title: {
    default: 'TechBouts - Boxing Event Management Platform',
    template: '%s | TechBouts'
  },
  description: 'Professional boxing event management platform for promoters, sanctioning bodies, and gyms.',
  applicationName: 'TechBouts',
  referrer: 'origin-when-cross-origin',
  keywords: ['boxing', 'event management', 'boxing promotions', 'fight management'],
  authors: [{ name: 'TechBouts' }],
  creator: 'TechBouts',
  publisher: 'TechBouts',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
    other: {
      rel: 'apple-touch-icon-precomposed',
      url: '/apple-touch-icon-precomposed.png',
    },
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  manifest: '/site.webmanifest',
  openGraph: {
    type: 'website',
    siteName: 'TechBouts',
    title: 'TechBouts - Boxing Event Management Platform',
    description: 'Professional boxing event management platform for promoters, sanctioning bodies, and gyms.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TechBouts',
    description: 'Professional boxing event management platform for promoters, sanctioning bodies, and gyms.',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  alternates: {
    canonical: 'https://techbouts.com',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
     <body className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-full`}>
        <div className="min-h-full flex flex-col">
          <main className="flex-1 w-full">
            <AuthProvider>

       

            <GoogleMapsProvider> 
              {children}
              </GoogleMapsProvider>
    
            </AuthProvider>
          </main>
        </div>
      </body>
    </html>
  );
}