'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import { NavigationMenu, NavigationMenuItem, NavigationMenuList } from "@/components/ui/navigation-menu";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Menu } from "lucide-react";

interface HeaderHomeProps {
  isAdmin?: boolean;
  isPromoter?: boolean;
}

const HeaderHome = ({ isAdmin }: HeaderHomeProps) => {
  const [open, setOpen] = useState(false);

  const navigationLinks = [
    { href: '/events', label: 'Events' },
    { href: '/promoters', label: 'Promoters' },
    { href: '/sanctioning', label: 'Sanctioning' },
    { href: '/database', label: 'Database' },
    ...(isAdmin ? [{ href: '/emails/pmt', label: 'Emails' }] : []),
  ];

  return (
    <header className="w-full relative">
      {/* Main header content */}
     
      <div className="relative w-full flex justify-between items-center bg-gradient-to-b from-[#eeeee4] to-[#eab676]/90 p-4 sm:p-6 border-b-2 border-[#FFC470] shadow-lg rounded-sm">
        {/* Logo section */}
        <div className="relative">
          <Image 
            src="/logos/techboutslogoFlat.png" 
            alt="Logo" 
            width={150} 
            height={60}
            className="mix-blend-multiply dark:mix-blend-screen drop-shadow-sm"
          />
        </div>

        {/* Desktop Navigation */}
        <NavigationMenu className="hidden sm:flex">
          <NavigationMenuList className="flex gap-1 items-center">
            {navigationLinks.map((link, index) => (
              <div key={link.href} className="flex items-center">
                {index > 0 && (
                  <Separator orientation="vertical" className="h-6 bg-[#21130d]/30" />
                )}
                <NavigationMenuItem>
                  <Button variant="ghost" className="text-black hover:text-[black] hover:bg-[#8B322C]/20">
                    <Link href={link.href}>{link.label}</Link>
                  </Button>
                </NavigationMenuItem>
              </div>
            ))}
          </NavigationMenuList>
        </NavigationMenu>

        {/* Mobile Navigation */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" className="sm:hidden text-white hover:text-[#FFC470]">
              <Menu className="h-6 w-6" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[300px] bg-[#4793AF] border-l border-[#FFC470]">
            <SheetTitle className="text-lg font-semibold text-white">
              Navigation Menu
            </SheetTitle>
            <div className="flex flex-col gap-4 mt-6">
              {navigationLinks.map((link) => (
                <div key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="block p-2 text-white hover:text-[#FFC470] hover:bg-[#8B322C]/20 rounded-md transition-colors"
                  >
                    {link.label}
                  </Link>
                  <Separator className="mt-2 bg-[#FFC470]/30" />
                </div>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>

    </header>
  );
};

export default HeaderHome;