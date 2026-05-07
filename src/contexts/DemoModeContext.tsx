import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

type DemoState = "off" | "mock" | "seeded";

interface DemoModeContextType {
  state: DemoState;
  isMock: boolean;
  isSeeded: boolean;
  setMock: (on: boolean) => void;
  seedSampleData: () => Promise<void>;
  isSeeding: boolean;
}

const DemoModeContext = createContext<DemoModeContextType | undefined>(undefined);

const STORAGE_KEY = "awardscut-demo-mode";

const SAMPLE_AWARDS = [
  { name: "Best Innovation", recipient_name: "Sarah Johnson", recipient_email: "sarah@example.com", recipient_phone: "+15551112222", scheduled_order: 1 },
  { name: "Leadership Excellence", recipient_name: "Michael Chen", recipient_email: "michael@example.com", recipient_phone: "+15552223333", scheduled_order: 2 },
  { name: "Rising Star", recipient_name: "Emily Davis", recipient_email: "emily@example.com", recipient_phone: "+15553334444", scheduled_order: 3 },
  { name: "Community Impact", recipient_name: "David Park", recipient_email: "david@example.com", recipient_phone: "+15554445555", scheduled_order: 4 },
  { name: "Lifetime Achievement", recipient_name: "Patricia Wong", recipient_email: "patricia@example.com", recipient_phone: "+15555556666", scheduled_order: 5 },
  { name: "Grand Prize", recipient_name: "James Rivera", recipient_email: "james@example.com", recipient_phone: "+15556667777", scheduled_order: 6 },
  { name: "Best Newcomer", recipient_name: "Aisha Patel", recipient_email: "aisha@example.com", recipient_phone: "+15557778888", scheduled_order: 7 },
  { name: "Audience Favorite", recipient_name: "Carlos Mendez", recipient_email: "carlos@example.com", recipient_phone: "+15558889999", scheduled_order: 8 },
];

const SAMPLE_VIDEO = "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4";

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [state, setState] = useState<DemoState>("off");
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as DemoState | null;
      if (saved === "mock" || saved === "seeded") setState(saved);
    } catch {}
  }, []);

  const persist = (s: DemoState) => {
    setState(s);
    try { localStorage.setItem(STORAGE_KEY, s); } catch {}
  };

  const setMock = (on: boolean) => {
    persist(on ? "mock" : (state === "seeded" ? "seeded" : "off"));
    toast.success(on ? "Mock Mode enabled" : "Mock Mode disabled");
  };

  const seedSampleData = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in first");
      return;
    }
    setIsSeeding(true);
    try {
      // 1. Create event (using detected_moments.ceremony_id text field as event identifier)
      const eventId = crypto.randomUUID();

      // 2. Insert award categories
      const { data: cats, error: catsErr } = await supabase
        .from("award_categories")
        .insert(SAMPLE_AWARDS.map((a) => ({
          ...a,
          user_id: user.id,
          event_id: eventId,
          status: "pending",
        })))
        .select("id, name, recipient_name, recipient_email, recipient_phone");

      if (catsErr) throw catsErr;

      // 3. Insert mock generated clips (3 formats per award for first 6)
      const formats = [
        { format: "landscape", dimensions: "1920x1080", format_label: "16:9 Landscape" },
        { format: "square", dimensions: "1080x1080", format_label: "1:1 Square" },
        { format: "vertical", dimensions: "1080x1920", format_label: "9:16 Vertical" },
      ];
      const clipRows = (cats || []).slice(0, 6).flatMap((c) =>
        formats.map((f) => ({
          user_id: user.id,
          event_id: eventId,
          award_category_id: c.id,
          winner_name: c.recipient_name || "Winner",
          recipient_name: c.recipient_name,
          recipient_email: c.recipient_email,
          recipient_phone: c.recipient_phone,
          category: c.name,
          format: f.format,
          dimensions: f.dimensions,
          format_label: f.format_label,
          duration_label: "0:30",
          status: "ready",
          source_video_url: SAMPLE_VIDEO,
          preview_url: SAMPLE_VIDEO,
          download_url: SAMPLE_VIDEO,
          start_offset_seconds: 0,
          end_offset_seconds: 30,
          branding_applied: true,
        }))
      );

      if (clipRows.length > 0) {
        const { error: clipsErr } = await supabase.from("generated_clips").insert(clipRows);
        if (clipsErr) throw clipsErr;
      }

      persist("seeded");
      toast.success("Sample ceremony loaded", {
        description: `${SAMPLE_AWARDS.length} awards and ${clipRows.length} clips created.`,
      });
    } catch (e: any) {
      console.error("[DemoMode] seed failed", e);
      toast.error("Failed to load sample data", { description: e?.message });
    } finally {
      setIsSeeding(false);
    }
  }, [user]);

  return (
    <DemoModeContext.Provider
      value={{
        state,
        isMock: state === "mock",
        isSeeded: state === "seeded",
        setMock,
        seedSampleData,
        isSeeding,
      }}
    >
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) throw new Error("useDemoMode must be used within DemoModeProvider");
  return ctx;
}
