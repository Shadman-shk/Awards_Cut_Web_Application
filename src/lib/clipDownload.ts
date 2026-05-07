import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

const PROCESSING_MESSAGE = "Clip is still processing. I’ll keep checking for a downloadable file.";

let downloadingId: string | null = null;
let onDownloadingChange: ((id: string | null) => void) | null = null;

export function setDownloadingCallback(cb: (id: string | null) => void) {
  onDownloadingChange = cb;
}

function setDownloading(id: string | null) {
  downloadingId = id;
  onDownloadingChange?.(id);
}

export function getDownloadingId() {
  return downloadingId;
}

function isHlsUrl(url: string): boolean {
  return url.includes(".m3u8") || url.includes("/hls/") || url.includes("/asset/");
}

function getAssetIdFromUrl(url: string): string | null {
  try {
    const parsed = new URL(url);
    return parsed.searchParams.get("assetId");
  } catch {
    return null;
  }
}

function getPlaybackIdFromUrl(url: string): string | null {
  // Livepeer HLS URLs look like:
  //   https://vod-cdn.lp-playback.studio/raw/.../hls/{playbackId}/index.m3u8
  //   https://livepeercdn.studio/hls/{playbackId}/index.m3u8
  const match = url.match(/\/hls\/([a-zA-Z0-9]+)\//);
  return match?.[1] ?? null;
}

export async function resolveDownloadUrl(videoUrl: string, onProgress?: (msg: string) => void): Promise<string> {
  if (!isHlsUrl(videoUrl)) {
    return videoUrl;
  }

  const assetId = getAssetIdFromUrl(videoUrl);
  const playbackId = getPlaybackIdFromUrl(videoUrl);
  if (!assetId && !playbackId) {
    throw new Error("Clip is preview-only right now. Please regenerate it to get a downloadable file.");
  }

  // FIX 3: Tighter polling — start immediately, faster early retries so a
  // ready clip downloads in <2s instead of waiting through long delays.
  const delays = [0, 1500, 2500, 4000, 6000, 8000, 10000, 12000];
  for (let attempt = 0; attempt < delays.length; attempt++) {
    if (attempt > 0) {
      await new Promise(r => setTimeout(r, delays[attempt]));
    }

    const { data, error } = await supabase.functions.invoke("resolve-clip-download", {
      body: { assetId, playbackId },
    });

    if (data?.downloadUrl) {
      return data.downloadUrl as string;
    }

    if ((data?.retryable || data?.error === "Clip is still processing") && attempt < delays.length - 1) {
      if (attempt === 0) {
        onProgress?.(PROCESSING_MESSAGE);
        toast({ title: "Preparing download", description: PROCESSING_MESSAGE });
      }
      continue;
    }

    if (error || data?.error) {
      if (data?.retryable || data?.error === "Clip is still processing") {
        throw new Error("Clip is still processing on Livepeer. Please wait 30-60 seconds and try again.");
      }
      throw new Error(data?.error || error?.message || "Failed to resolve download URL");
    }
  }

  throw new Error("Clip is still processing. Please wait and retry.");
}

export async function downloadClipAsBlob(
  videoUrl: string,
  filename: string,
  clipId?: string
): Promise<boolean> {
  try {
    if (clipId) setDownloading(clipId);

    const resolvedUrl = await resolveDownloadUrl(videoUrl);
    // FIX 3: stream to disk via a direct anchor click when possible, falling
    // back to blob download. This avoids loading the full file into memory and
    // starts the browser save dialog faster.
    try {
      const a = document.createElement("a");
      a.href = resolvedUrl;
      a.download = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
      a.rel = "noopener";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      toast({ title: "✅ Download started", description: filename });
      return true;
    } catch {
      // Fallback: blob download (cross-origin without proper CORS headers)
      const response = await fetch(resolvedUrl);
      if (!response.ok) throw new Error("Failed to fetch video");
      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = objectUrl;
      a.download = filename.endsWith(".mp4") ? filename : `${filename}.mp4`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(objectUrl);
      toast({ title: "✅ Download started", description: filename });
      return true;
    }
  } catch (error) {
    toast({
      title: "Download unavailable",
      description: error instanceof Error ? error.message : "Clip is still processing. Try again in a few seconds.",
      variant: "destructive",
    });
    return false;
  } finally {
    if (clipId) setDownloading(null);
  }
}

export async function downloadAllClips(
  clips: Array<{ url: string; filename: string; id: string }>,
  toastFn: typeof toast
) {
  const total = clips.length;
  if (total === 0) return;

  for (let i = 0; i < total; i++) {
    const clip = clips[i];
    toastFn({
      title: `⬇️ Downloading ${i + 1} of ${total}…`,
      description: clip.filename,
    });

    await downloadClipAsBlob(clip.url, clip.filename, clip.id);
    if (i < total - 1) {
      await new Promise((r) => setTimeout(r, 800));
    }
  }

  toastFn({
    title: `✅ All ${total} clips processed`,
    description: "Ready clips were downloaded. Processing clips can be retried in a few seconds.",
  });
}
