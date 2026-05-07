// Lightweight client-side branding storage shared between BrandingManager and ClipGeneration.
// Persists user's last-saved branding so generated clips visibly reflect template/branding choices.

export interface BrandingSettings {
  logoUrl?: string | null;
  logoName?: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  templateId?: string | null;
  templateName?: string | null;
  templateType?: "corporate" | "modern" | "luxury" | "minimal" | "event" | "social" | null;
  templateGradient?: string | null;
  textLayout?: "center" | "left" | "right" | "bottom" | null;
  logoPlacement?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center" | null;
  musicTrackName?: string | null;
  musicTrackUrl?: string | null;
  appliedAt: string;
}

const KEY = "awardscut.branding.v1";

export const DEFAULT_BRANDING: BrandingSettings = {
  logoUrl: null,
  logoName: null,
  primaryColor: "#B5553A",
  secondaryColor: "#D4A853",
  fontFamily: "Space Grotesk",
  templateId: "5",
  templateName: "Gala Night",
  templateType: "event",
  templateGradient: "from-red-900/50 to-rose-800/30",
  textLayout: "center",
  logoPlacement: "top-right",
  musicTrackName: null,
  musicTrackUrl: null,
  appliedAt: "",
};

function cleanAssetUrl(url?: string | null): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed || trimmed.startsWith("blob:") || trimmed.startsWith("file:")) return null;
  return trimmed;
}

export function getBranding(): BrandingSettings {
  if (typeof window === "undefined") return DEFAULT_BRANDING;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return DEFAULT_BRANDING;
    const parsed = { ...DEFAULT_BRANDING, ...JSON.parse(raw) } as BrandingSettings;
    return {
      ...parsed,
      logoUrl: cleanAssetUrl(parsed.logoUrl),
      musicTrackUrl: cleanAssetUrl(parsed.musicTrackUrl),
    };
  } catch {
    return DEFAULT_BRANDING;
  }
}

export function saveBranding(b: Partial<Omit<BrandingSettings, "appliedAt">>) {
  const current = getBranding();
  const nextLogoUrl = Object.prototype.hasOwnProperty.call(b, "logoUrl") ? b.logoUrl : current.logoUrl;
  const nextMusicTrackUrl = Object.prototype.hasOwnProperty.call(b, "musicTrackUrl") ? b.musicTrackUrl : current.musicTrackUrl;
  const payload: BrandingSettings = {
    ...DEFAULT_BRANDING,
    ...current,
    ...b,
    logoUrl: cleanAssetUrl(nextLogoUrl),
    musicTrackUrl: cleanAssetUrl(nextMusicTrackUrl),
    appliedAt: new Date().toISOString(),
  };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(payload));
    window.dispatchEvent(new CustomEvent("branding:updated", { detail: payload }));
  } catch {}
  return payload;
}

export function updateBranding(partial: Partial<Omit<BrandingSettings, "appliedAt">>) {
  return saveBranding({ ...getBranding(), ...partial });
}

export function subscribeBranding(callback: (b: BrandingSettings) => void) {
  if (typeof window === "undefined") return () => {};
  const handler = (e: Event) => callback((e as CustomEvent<BrandingSettings>).detail);
  window.addEventListener("branding:updated", handler);
  return () => window.removeEventListener("branding:updated", handler);
}
