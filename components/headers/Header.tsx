'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import GoogleAuthButton from '@/components/ui/GoogleAuthButton';
import useIsMobile from '@/hooks/useIsMobile';


import { 
  Calendar, 
  Database, 
  Home, 
  Mail, 
} from 'lucide-react';

interface HeaderProps {
  transparent?: boolean;
}

export default function ConsistentHeader({ transparent = false }: HeaderProps) {
  const { user, isAdmin, isPromoter, promoterId, signOut } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const pathname = usePathname();

  const isMobile = useIsMobile();


  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);







  // Determine the dashboard path
  const dashboardPath = promoterId 
    ? `/promotions/${promoterId}` 
    : `/promotions/dashboard`;

  const isActive = (path: string) => {
    return pathname === path;
  };

  const isPathActive = (path: string) => {
    return pathname.startsWith(path);
  };



  // Common navigation items component
  const NavigationItems = ({ location }: { location: 'top' | 'bottom' }) => (
    <>
      <Link 
        href="/events" 
        className={`relative border rounded flex flex-col items-center ${location === 'bottom' ? 'w-1/5' : ''} transition-colors ${
          isActive('/events') 
        ? 'text-white/80 bg-black/80 text-white hover:text-[#DD5746] p-2'
        :  'text-black/80 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 p-2' 
        }`}
      >
        {/* Indicator - consistent position for both locations */}
        <span className={`absolute ${location === 'bottom' ? '-top-1' : 'bottom-0'} left-1/2 transform -translate-x-1/2 ${location === 'bottom' ? 'w-8 h-1' : 'w-full h-0.5'} rounded-full bg-[#DD5746] transition-all duration-300 ${
          isActive('/events') ? 'opacity-100' : 'opacity-0'
        }`}></span>
        <Calendar className="w-5 h-5 mb-1" />
        <span className="text-xs">Events</span>
      </Link>




      <Link 
        href="/promotions" 
        className={`relative py-2 flex flex-col items-center ${location === 'bottom' ? 'w-1/5' : ''} transition-colors ${
          isActive('/promotions') 
          ? 'text-white/80 bg-black/80 text-white hover:text-[#DD5746] p-2'
          :  'text-black/80 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 p-2' 
        }`}
      >
        {/* Indicator - consistent position for both locations */}
        <span className={`absolute ${location === 'bottom' ? '-top-1' : 'bottom-0'} left-1/2 transform -translate-x-1/2 ${location === 'bottom' ? 'w-8 h-1' : 'w-full h-0.5'} rounded-full bg-[#DD5746] transition-all duration-300 ${
          isActive('/promotions') ? 'opacity-100' : 'opacity-0'
        }`}></span>
        <Calendar className="w-5 h-5 mb-1" />
        <span className="text-xs">{location === 'bottom' ? 'Promo' : 'Promotions'}</span>
      </Link>

      <Link 
        href="/database" 
        className={`relative py-2 flex flex-col items-center ${location === 'bottom' ? 'w-1/5' : ''} transition-colors ${
          isActive('/database') 
          ? 'text-white/80 bg-black/80 text-white hover:text-[#DD5746] p-2'
          :  'text-black/80 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 p-2' 
        }`}
      >
        <span className={`absolute ${location === 'bottom' ? '-top-1' : 'bottom-0'} left-1/2 transform -translate-x-1/2 ${location === 'bottom' ? 'w-8 h-1' : 'w-full h-0.5'} rounded-full bg-[#DD5746] transition-all duration-300 ${
          isActive('/database') ? 'opacity-100' : 'opacity-0'
        }`}></span>
        <Database className="w-5 h-5 mb-1" />
        <span className="text-xs">Data</span>
      </Link>
      
      {isPromoter && (
        <Link 
          href={dashboardPath}
          className={`relative py-2 flex flex-col items-center ${location === 'bottom' ? 'w-1/5' : ''} transition-colors ${
            isPathActive('/promotions/') 
            ? 'text-white/80 bg-black/80 text-white hover:text-[#DD5746] p-2'
            :  'text-black/80 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50 p-2' 
          }`}
        >
          <span className={`absolute ${location === 'bottom' ? '-top-1' : 'bottom-0'} left-1/2 transform -translate-x-1/2 ${location === 'bottom' ? 'w-8 h-1' : 'w-full h-0.5'} rounded-full bg-[#DD5746] transition-all duration-300 ${
            isPathActive('/promotions/') ? 'opacity-100' : 'opacity-0'
          }`}></span>
          <Home className="w-5 h-5 mb-1" />
          <span className="text-xs">Dash</span>
        </Link>
      )}
      
      {isAdmin && (
        <Link 
          href="/emails" 
          className={`relative py-2 flex flex-col items-center ${location === 'bottom' ? 'w-1/5' : ''} transition-colors ${
            isPathActive('/emails') 
            ? 'text-white/80 bg-black/80 text-white hover:text-[#DD5746]'
            :  'text-black/80 bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-100/50' 
          }`}
        >
          <span className={`absolute ${location === 'bottom' ? '-top-1' : 'bottom-0'} left-1/2 transform -translate-x-1/2 ${location === 'bottom' ? 'w-8 h-1' : 'w-full h-0.5'} rounded-full bg-[#DD5746] transition-all duration-300 ${
            isPathActive('/emails') ? 'opacity-100' : 'opacity-0'
          }`}></span>
          <Mail className="w-5 h-5 mb-1" />
          <span className="text-xs">Email</span>
        </Link>
      )}
    </>
  );

  // Define the common header structure that will be used in both positions
  const HeaderContent = ({ position }: { position: 'top' | 'bottom' }) => (
    <div className="container mx-auto px-4 py-2 flex items-center justify-between">
      {/* Logo */}
      <div className="relative">
        <Link href="/">
        <Image 
  src={position === 'bottom' ? '/logos/techboutsLogo.png' : '/logos/techboutslogoFlat.png'} 
  alt="Logo" 
  width={position === 'bottom' ? 50 : 90} 
  height={position === 'bottom' ? 24 : 36}
  className="mix-blend-multiply dark:mix-blend-screen drop-shadow-sm"
/>
        </Link>
      </div>
      
      {/* Navigation */}
      <nav className="w-full flex items-center justify-center space-x-8">
        <NavigationItems location={position} />
      </nav>
      
      {/* Auth button */}
      <div className="flex-shrink-0">
        <GoogleAuthButton />
        
        {/* User menu popup */}
        {showUserMenu && (
          <div className={`absolute ${position === 'top' ? 'top-12' : 'bottom-12'} right-4 bg-white shadow-lg rounded-lg py-2 w-32 z-50`}>
            {user && (
              <button 
                onClick={() => {
                  signOut();
                  setShowUserMenu(false);
                }}
                className="w-full text-left px-4 py-2 text-[#DD5746] hover:bg-gray-50"
              >
                Sign Out
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Only show top header on desktop */}
      {!isMobile && (
        <header 
          className={`w-full fixed top-0 z-50 transition-all duration-300 ${
            transparent && !scrolled 
              ? 'bg-transparent' 
              : ''
          }`}
        >
          <HeaderContent position="top" />
        </header>
      )}
      
      {/* Only show bottom header on mobile */}
      {isMobile && (
        <header
          className={`w-full fixed bottom-0 z-50 transition-all duration-300 ${
            transparent && !scrolled 
              ? 'bg-black/50 backdrop-blur-md' 
              : 'bg-white/90 backdrop-blur-md shadow-lg border-t border-gray-100/50'
          }`}
        >
          <HeaderContent position="bottom" />
        </header>
      )}
      
   
    </>
  );
}