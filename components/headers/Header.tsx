'use client';

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useAuth } from '@/context/AuthContext';
import { usePathname } from 'next/navigation';
import GoogleAuthButton from '@/components/ui/GoogleAuthButton';

interface HeaderProps {
  transparent?: boolean;
}

export default function Header({ transparent = false }: HeaderProps) {
  const { user, isAdmin, isPromoter, promoterId, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };
  
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Determine the dashboard path
  const dashboardPath = promoterId 
    ? `/promotions/${promoterId}` 
    : `/promotions/dashboard`; // Fallback in case promoterId is not available

  return (
    <header 
      className={`w-full fixed top-0 z-50 transition-all duration-300 ${
        transparent && !scrolled 
          ? 'bg-transparent' 
          : 'bg-white shadow-md'
      }`}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <div className="relative">
         <Link  href="/" >
          <Image 
            src="/logos/techboutslogoFlat.png" 
            alt="Logo" 
            width={150} 
            height={60}
            className="mix-blend-multiply dark:mix-blend-screen drop-shadow-sm"
          />
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center space-x-6">
      
          <Link 
            href="/events" 
            className={`${isActive('/events') ? 'font-semibold text-[#DD5746]' : transparent && !scrolled ? 'text-white' : 'text-[#4793AF]'} hover:text-[#DD5746] transition-colors`}
          >
            Events
          </Link>

          <Link 
            href="/promotions" 
            className={`${isActive('/events') ? 'font-semibold text-[#DD5746]' : transparent && !scrolled ? 'text-white' : 'text-[#4793AF]'} hover:text-[#DD5746] transition-colors`}
          >
            Promotions
          </Link>

          <Link 
            href="/database" 
            className={`${isActive('/database') ? 'font-semibold text-[#DD5746]' : transparent && !scrolled ? 'text-white' : 'text-[#4793AF]'} hover:text-[#DD5746] transition-colors`}
          >
            Database
          </Link>
          
          {isPromoter && (
            <Link 
              href={dashboardPath}
              className={`${pathname.startsWith('/promoters/') ? 'font-semibold text-[#DD5746]' : transparent && !scrolled ? 'text-white' : 'text-[#4793AF]'} hover:text-[#DD5746] transition-colors`}
            >
              Dashboard
            </Link>
          )}
          
          {isAdmin && (
            <Link 
              href="/emails" 
              className={`${pathname.startsWith('/emails') ? 'font-semibold text-[#DD5746]' : transparent && !scrolled ? 'text-white' : 'text-[#4793AF]'} hover:text-[#DD5746] transition-colors`}
            >
              Email
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-4">
              <button 
                onClick={signOut}
                className="border-2 border-[#DD5746] text-[#DD5746] py-1 px-4 rounded hover:bg-[#DD5746] hover:text-white transition-colors"
              >
                Sign Out
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-4">
 
              <GoogleAuthButton />
              
            </div>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-[#8B322C]" 
          onClick={toggleMenu}
          aria-label="Toggle menu"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor" 
            className="w-6 h-6"
          >
            {isMenuOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-white shadow-lg">
          <div className="container mx-auto px-4 py-2 flex flex-col space-y-3">
            <Link 
              href="/" 
              className={`${isActive('/') ? 'font-semibold text-[#DD5746]' : 'text-[#4793AF]'} py-2`}
              onClick={closeMenu}
            >
              Home
            </Link>
            <Link 
              href="/events" 
              className={`${isActive('/events') ? 'font-semibold text-[#DD5746]' : 'text-[#4793AF]'} py-2`}
              onClick={closeMenu}
            >
              Events
            </Link>
            <Link 
              href="/database" 
              className={`${isActive('/database') ? 'font-semibold text-[#DD5746]' : 'text-[#4793AF]'} py-2`}
              onClick={closeMenu}
            >
              Database
            </Link>
            <Link 
            href="/promotions" 
            className={`${isActive('/events') ? 'font-semibold text-[#DD5746]' : transparent && !scrolled ? 'text-white' : 'text-[#4793AF]'} hover:text-[#DD5746] transition-colors`}
          >
            Promotions
          </Link>
            
            {isPromoter && (
              <Link 
                href={dashboardPath}
                className={`${pathname.startsWith('/promoters/') ? 'font-semibold text-[#DD5746]' : 'text-[#4793AF]'} py-2`}
                onClick={closeMenu}
              >
                Dashboard
              </Link>
            )}
            
            {isAdmin && (
              <Link 
                href="/admin" 
                className={`${pathname.startsWith('/admin') ? 'font-semibold text-[#DD5746]' : 'text-[#4793AF]'} py-2`}
                onClick={closeMenu}
              >
                Admin
              </Link>
            )}
            
            {user ? (
              <div className="py-2 flex items-center justify-between">
                <button 
                  onClick={() => {
                    signOut();
                    closeMenu();
                  }}
                  className="text-sm text-[#DD5746]"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <Link 
                href="/auth/login" 
                className="bg-[#DD5746] text-white py-2 px-4 rounded text-center"
                onClick={closeMenu}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}