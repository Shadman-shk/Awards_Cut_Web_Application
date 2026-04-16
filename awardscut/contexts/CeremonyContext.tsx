"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";

export interface Ceremony {
  id: string;
  name: string;
  date: string;
  status: "draft" | "setup" | "live" | "completed";
  awardsCount: number;
  setupProgress: {
    ceremony: boolean;
    awards: boolean;
    template: boolean;
    branding: boolean;
    livestream: boolean;
    clips: boolean;
    delivery: boolean;
  };
}

interface CeremonyContextType {
  ceremonies: Ceremony[];
  selectedCeremony: Ceremony | null;
  isLoading: boolean;
  selectCeremony: (id: string) => void;
  createCeremony: (name: string, date: string) => Promise<Ceremony>;
  updateCeremonyProgress: (step: keyof Ceremony["setupProgress"], completed: boolean) => void;
  hasCeremonies: boolean;
}

const CeremonyContext = createContext<CeremonyContextType | undefined>(undefined);

// Mock ceremonies for demo
const mockCeremonies: Ceremony[] = [
  {
    id: "1",
    name: "Annual Excellence Awards 2026",
    date: "2026-03-15",
    status: "setup",
    awardsCount: 45,
    setupProgress: {
      ceremony: true,
      awards: true,
      template: false,
      branding: false,
      livestream: false,
      clips: false,
      delivery: false,
    },
  },
  {
    id: "2",
    name: "Tech Innovation Summit",
    date: "2026-04-20",
    status: "draft",
    awardsCount: 0,
    setupProgress: {
      ceremony: true,
      awards: false,
      template: false,
      branding: false,
      livestream: false,
      clips: false,
      delivery: false,
    },
  },
];

export function CeremonyProvider({ children }: { children: ReactNode }) {
  const [ceremonies, setCeremonies] = useState<Ceremony[]>([]);
  const [selectedCeremonyId, setSelectedCeremonyId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load ceremonies (simulated)
    const loadCeremonies = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 500));
      setCeremonies(mockCeremonies);

      // Auto-select first ceremony if available
      const savedCeremonyId = localStorage.getItem("selectedCeremonyId");
      if (savedCeremonyId && mockCeremonies.find((c) => c.id === savedCeremonyId)) {
        setSelectedCeremonyId(savedCeremonyId);
      } else if (mockCeremonies.length > 0) {
        setSelectedCeremonyId(mockCeremonies[0].id);
      }

      setIsLoading(false);
    };

    loadCeremonies();
  }, []);

  const selectedCeremony = ceremonies.find((c) => c.id === selectedCeremonyId) || null;

  const selectCeremony = (id: string) => {
    setSelectedCeremonyId(id);
    localStorage.setItem("selectedCeremonyId", id);
  };

  const createCeremony = async (name: string, date: string): Promise<Ceremony> => {
    const newCeremony: Ceremony = {
      id: Date.now().toString(),
      name,
      date,
      status: "draft",
      awardsCount: 0,
      setupProgress: {
        ceremony: true,
        awards: false,
        template: false,
        branding: false,
        livestream: false,
        clips: false,
        delivery: false,
      },
    };

    setCeremonies([...ceremonies, newCeremony]);
    setSelectedCeremonyId(newCeremony.id);
    localStorage.setItem("selectedCeremonyId", newCeremony.id);

    return newCeremony;
  };

  const updateCeremonyProgress = (step: keyof Ceremony["setupProgress"], completed: boolean) => {
    if (!selectedCeremony) return;

    setCeremonies(
      ceremonies.map((c) =>
        c.id === selectedCeremony.id
          ? {
              ...c,
              setupProgress: {
                ...c.setupProgress,
                [step]: completed,
              },
            }
          : c
      )
    );
  };

  return (
    <CeremonyContext.Provider
      value={{
        ceremonies,
        selectedCeremony,
        isLoading,
        selectCeremony,
        createCeremony,
        updateCeremonyProgress,
        hasCeremonies: ceremonies.length > 0,
      }}
    >
      {children}
    </CeremonyContext.Provider>
  );
}

export function useCeremony() {
  const context = useContext(CeremonyContext);
  if (context === undefined) {
    throw new Error("useCeremony must be used within a CeremonyProvider");
  }
  return context;
}