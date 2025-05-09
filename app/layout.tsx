// app/layout.tsx
import { Analytics } from "@vercel/analytics/react"
import type { Viewport } from "next";
import { AuthProvider } from "@/context/AuthContext";
import "./globals.css";
import LayoutWrapper from '@/components/LayoutWrapper'; // Adjust path as needed

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};



export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {



  return (
    <html lang="en">
     <body>
        <div className="min-h-full flex flex-col">
          <main className="flex-1 w-full">
             <AuthProvider> 

             <LayoutWrapper>
    {children}
  </LayoutWrapper>
  
              <Analytics />
             </AuthProvider> 
          </main>
        </div>
      </body>
    </html>
  );
}