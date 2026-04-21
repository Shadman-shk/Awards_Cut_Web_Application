"use client";

import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { AuthProvider } from "@/contexts/AuthContext";
import { CeremonyProvider } from "@/contexts/CeremonyContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { useState } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <CeremonyProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <ErrorBoundary>{children}</ErrorBoundary>
            </TooltipProvider>
          </CeremonyProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
}
