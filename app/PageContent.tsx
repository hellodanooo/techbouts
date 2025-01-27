// app/PageContent.tsx (Client Component)
'use client';

import Image from "next/image";
import Link from "next/link";
import HeaderHome from "@/components/ui/HeaderHome";
import { useAuth } from '../context/AuthContext';
import LoadingScreen from '@/components/loading_screens/LandingLoading';


export default function PageContent() {
    const { isAdmin, loading } = useAuth();

    if (loading) {
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        );
      }

      if (!isAdmin) {
        return <LoadingScreen />;
      }
    

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
      {/* Top Header */}
      <HeaderHome />

      {/* Hero Section */}
      <section className="text-center sm:text-left max-w-4xl">
        <h1 className="text-3xl sm:text-5xl font-bold leading-snug mb-4">
          Revolutionize Your Boxing Events and Rankings
        </h1>
        <p className="text-lg sm:text-xl text-gray-600 dark:text-gray-400 mb-8">
          Manage fighters, gyms, and events with ease. Track rankings and grow your boxing community.
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <Link href="/create" className="bg-blue-500 text-white py-3 px-6 rounded shadow hover:bg-blue-600">
            Get Started for Free
          </Link>
          <Link href="/auth/login" className="border border-blue-500 text-blue-500 py-3 px-6 rounded shadow hover:bg-blue-50">
            Book a Demo
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl grid gap-16">
        <div className="text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-8">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard title="Event Management" description="Plan and schedule fights effortlessly." />
            <FeatureCard title="Rankings System" description="Automatically track fighters and gym rankings." />
            <FeatureCard title="Promoter Tools" description="Simplify promotion and revenue tracking." />
            <FeatureCard title="Gym Profiles" description="Monitor gym stats and performance." />
            <FeatureCard title="Fighter Stats" description="Detailed fighter profiles with performance history." />
            <FeatureCard title="Secure Payments" description="Integrated ticketing and payment solutions." />
          </div>
        </div>

        {/* Upcoming Events Section */}
        <section className="w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Upcoming Events</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded shadow-md">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              No events available at the moment. Stay tuned!
            </p>
          </div>
        </section>

        {/* Latest Results Section */}
        <section className="w-full">
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Latest Results</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded shadow-md">
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              No results available at the moment. Stay tuned!
            </p>
          </div>
        </section>
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