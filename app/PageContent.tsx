// app/PageContent.tsx
'use client';

import Image from "next/image";
import Link from "next/link";
import { useAuth } from '@/context/AuthContext';
import HeaderHome from "@/components/ui/HeaderHome";
//import LoadingScreen from '@/components/loading_screens/LandingLoading';
import AuthDisplay from '@/components/ui/AuthDisplay';

export default function PageContent() {
  const { user, isAdmin, isPromoter, isNewUser } = useAuth();
 // const { loading } = useAuth();

  // if (loading) {
  //   return <LoadingScreen />;
  // }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)] relative">
      <AuthDisplay 
        user={user}
        isAdmin={isAdmin}
        isPromoter={isPromoter}
        isNewUser={isNewUser}
      />
      
      <HeaderHome isAdmin={isAdmin} isPromoter={isPromoter} />

      {/* Hero Section with Conditional Content */}
      <section className="text-center sm:text-left max-w-4xl">
        <h1 className="text-3xl sm:text-5xl font-bold leading-snug mb-4">
          {isAdmin ? (
            "Welcome to TechBouts Admin"
          ) : isPromoter ? (
            "Welcome to Your Promoter Dashboard"
          ) : (
            "Revolutionize Your Boxing Events and Rankings"
          )}
        </h1>
        
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
          {isAdmin ? (
            "Manage platform settings, users, and content from your central dashboard."
          ) : isPromoter ? (
            "Track your events, manage fighters, and analyze performance metrics."
          ) : (
            "Manage fighters, gyms, and events with ease. Track rankings and grow your boxing community."
          )}
        </p>

        {/* Conditional CTA Buttons */}
        <div className="flex flex-col sm:flex-row gap-4">
          {isAdmin ? (
            <>
              <Link href="/events" className="bg-blue-500 text-white py-3 px-6 rounded shadow hover:bg-blue-600">
                Manage Events
              </Link>
              <Link href="/users" className="border border-blue-500 text-blue-500 py-3 px-6 rounded shadow hover:bg-blue-50">
                Manage Users
              </Link>
            </>
          ) : isPromoter ? (
            <>
              <Link href="/dashboard" className="bg-blue-500 text-white py-3 px-6 rounded shadow hover:bg-blue-600">
                View Dashboard
              </Link>
              <Link href="/create-event" className="border border-blue-500 text-blue-500 py-3 px-6 rounded shadow hover:bg-blue-50">
                Create Event
              </Link>
            </>
          ) : (
            <>
              <Link href="/create" className="bg-blue-500 text-white py-3 px-6 rounded shadow hover:bg-blue-600">
                Get Started for Free
              </Link>
              <Link href="/auth/login" className="border border-blue-500 text-blue-500 py-3 px-6 rounded shadow hover:bg-blue-50">
                Book a Demo
              </Link>
            </>
          )}
        </div>
      </section>

      {/* Features Section with Conditional Content */}
      <section className="w-full max-w-6xl grid gap-16">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">
            {isAdmin ? "Admin Tools" : isPromoter ? "Promoter Tools" : "Key Features"}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            {isAdmin ? (
              <>
                <FeatureCard title="User Management" description="Manage user roles and permissions" />
                <FeatureCard title="Event Oversight" description="Monitor and manage all platform events" />
                <FeatureCard title="Analytics Dashboard" description="Track platform-wide metrics and usage" />
              </>
            ) : isPromoter ? (
              <>
                <FeatureCard title="Event Management" description="Create and manage your events" />
                <FeatureCard title="Fighter Profiles" description="Manage fighter registrations" />
                <FeatureCard title="Revenue Analytics" description="Track event performance and revenue" />
              </>
            ) : (
              <>
                <FeatureCard title="Event Management" description="Plan and schedule fights effortlessly" />
                <FeatureCard title="Rankings System" description="Track fighters and gym rankings" />
                <FeatureCard title="Promoter Tools" description="Simplify promotion and revenue tracking" />
                <FeatureCard title="Gym Profiles" description="Monitor gym stats and performance" />
                <FeatureCard title="Fighter Stats" description="Detailed fighter profiles and history" />
                <FeatureCard title="Secure Payments" description="Integrated ticketing solutions" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full flex gap-6 flex-wrap items-center justify-center">
        <a
          className="flex items-center gap-2 hover:underline hover:underline-offset-4"
          href="https://nextjs.org"
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
          Learn More
        </a>
      </footer>
    </div>
  );
}

interface FeatureCardProps {
  title: string;
  description: string;
}

function FeatureCard({ title, description }: FeatureCardProps) {
  return (
    <div className="p-6 bg-gray-50 dark:bg-gray-800 rounded shadow-md">
      <h3 className="text-lg font-bold mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-400">{description}</p>
    </div>
  );
}