// components/providers/ClientGoogleMapsProvider.tsx
"use client"
import GoogleMapsProvider from "@/components/ui/GoogleMapsProvider";
import { ReactNode } from "react";

interface ClientAuthProviderProps {
    children: ReactNode;
  }

export default function ClientGoogleMapsProvider({ children }: ClientAuthProviderProps) {
  return <GoogleMapsProvider>{children}</GoogleMapsProvider>;
}