// app/PageContent.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import HeaderHome from "@/components/ui/HeaderHome";
import AuthDisplay from '@/components/ui/AuthDisplay';
import LoadingScreen from '@/components/loading_screens/LandingLoading';

export default function PageContent() {
  const { user, isAdmin, isNewUser } = useAuth();
  const { loading } = useAuth();

  if (loading) {
    return <LoadingScreen />;
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-16 sm:p-5 font-[family-name:var(--font-geist-sans)] relative bg-gradient-to-b from-white to-[#4793AF]/10">
      <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isNewUser={isNewUser}
      />
      
      <HeaderHome isAdmin={isAdmin} />

      {/* Hero Section with Conditional Content */}
      <section className="text-center sm:text-left max-w-4xl px-4">
        <h1 className="text-3xl sm:text-5xl font-bold leading-snug mb-4 text-[#8B322C]">
          {isAdmin ? (
            "Welcome to TechBouts Admin"
          ) : (
            "Streamline Your Muay Thai & Boxing Events Management"
          )}
        </h1>
        
        <p className="text-lg sm:text-xl text-[#4793AF] mb-8">
          {isAdmin ? (
            "Manage system settings, users, and combat sports events from your central dashboard."
          ) : (
            "All-in-one solution for sanctioning bodies, promoters, and gyms to manage fighters, events, and rankings in Muay Thai and boxing."
          )}
        </p>

        {/* Conditional CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isAdmin ? (
            <>
              <Link href="/events" className="bg-[#DD5746] text-white py-3 px-6 rounded shadow hover:bg-[#8B322C] transition-colors">
                Manage Events
              </Link>
              <Link href="/users" className="border-2 border-[#DD5746] text-[#DD5746] py-3 px-6 rounded shadow hover:bg-[#DD5746] hover:text-white transition-colors">
                Manage Users
              </Link>
            </>
          ) : (
            <>
              <Link href="/create" className="bg-[#DD5746] text-white py-3 px-6 rounded shadow hover:bg-[#8B322C] transition-colors">
                Start Managing Events
              </Link>
              <Link href="/auth/login" className="border-2 border-[#DD5746] text-[#DD5746] py-3 px-6 rounded shadow hover:bg-[#DD5746] hover:text-white transition-colors">
                Schedule Demo
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section with Conditional Content */}
      <section className="w-full max-w-6xl grid gap-16 px-4">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8 text-[#8B322C]">
            {isAdmin ? "Admin Tools" : "System Features"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isAdmin ? (
              <>
                <FeatureCard title="Event Management" description="Oversee Muay Thai and boxing events across the system" />
                <FeatureCard title="Sanctioning Tools" description="Manage fighter records, matchups, and weight classes" />
                <FeatureCard title="Performance Analytics" description="Track event metrics and fighter statistics" />
              </>
            ) : (
              <>
                <FeatureCard title="Fight Management" description="Schedule and manage both Muay Thai and boxing matches with ease" />
                <FeatureCard title="Fighter Database" description="Comprehensive records for Muay Thai and boxing athletes" />
                <FeatureCard title="Matchmaking Tools" description="Find and arrange suitable matchups across weight classes" />
                <FeatureCard title="Digital Records" description="Track fight history, medical clearances, and required documentation" />
                <FeatureCard title="Event Planning" description="Venue management, ticket sales, and event logistics" />
                <FeatureCard title="Performance Tracking" description="Monitor fighter rankings and gym success rates" />
              </>
            )}
          </div>
        </div>
      </section>

      <footer className="w-full flex gap-6 flex-wrap items-center justify-center pb-8">
        <a
          className="flex items-center gap-2 text-[#4793AF] hover:text-[#DD5746] transition-colors"
          href="https://techbouts.com"
          target="_blank"
          rel="noopener noreferrer"
        >
          <Image
            aria-hidden
            src="/globe.svg"
            alt="Globe icon"
            width={16}
            height={16}
          />
          Learn More About TechBouts
        </a>
      </footer>
    </div>
  );
}

function FeatureCard({ title, description }: { title: string; description: string }) {
  return (
    <div className="p-6 bg-white rounded shadow-md border border-[#FFC470]/30 hover:border-[#FFC470] transition-colors">
      <h3 className="text-lg font-bold mb-2 text-[#DD5746]">{title}</h3>
      <p className="text-[#4793AF]">{description}</p>
    </div>
  );
}