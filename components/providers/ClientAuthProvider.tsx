// components/providers/ClientAuthProvider.tsx
"use client"
import { ReactNode } from "react";
import { AuthProvider } from "@/context/AuthContext";

interface ClientAuthProviderProps {
  children: ReactNode;
}

export default function ClientAuthProvider({ children }: ClientAuthProviderProps) {
  return <AuthProvider>{children}</AuthProvider>;
}