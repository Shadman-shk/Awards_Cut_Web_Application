/**
 * Client-side branding burn-in for short clips.
 *
 * Renders an HTMLVideoElement frame-by-frame onto a canvas, composites
 * safe in-frame template + logo + lower-third + (optional) audio music track,
 * and captures the canvas via MediaRecorder into a downloadable WebM/MP4.
 *
 * Why client-side: Supabase Edge Functions can't run ffmpeg binaries.
 * This is the most reliable way to ship a branded MP4 the recipient
 * can re-share with the organiser's logo permanently embedded.
 *
 * Limits: Works best on clips <90s. Output format depends on browser MediaRecorder support.
 */

import type { BrandingSettings } from "@/lib/brandingStore";

interface BurnInOpts {
  sourceUrl: string;
  branding: BrandingSettings;
  winnerName: string;
  category: string;
  format: "horizontal" | "square" | "vertical";
  onProgress?: (pct: number) => void;
}

const FORMAT_DIMS: Record<BurnInOpts["format"], { w: number; h: number }> = {
  horizontal: { w: 1280, h: 720 },
  square: { w: 720, h: 720 },
  vertical: { w: 720, h: 1280 },
};

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = url;
  });
}

function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  const r = parseInt(h.substring(0, 2), 16);
  const g = parseInt(h.substring(2, 4), 16);
  const b = parseInt(h.substring(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function drawTemplateBackground(ctx: CanvasRenderingContext2D, w: number, h: number, branding: BrandingSettings) {
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, w, h);
  const grad = ctx.createLinearGradient(0, 0, w, h);
  grad.addColorStop(0, hexToRgba(branding.primaryColor, 0.22));
  grad.addColorStop(0.55, "rgba(0,0,0,0.35)");
  grad.addColorStop(1, hexToRgba(branding.secondaryColor, 0.2));
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);
}

function logoPosition(placement: BrandingSettings["logoPlacement"], w: number, h: number, lw: number, lh: number, pad: number) {
  switch (placement) {
    case "top-left": return { x: pad, y: pad };
    case "bottom-left": return { x: pad, y: h - lh - pad };
    case "bottom-right": return { x: w - lw - pad, y: h - lh - pad };
    case "center": return { x: (w - lw) / 2, y: (h - lh) / 2 };
    default: return { x: w - lw - pad, y: pad };
  }
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function drawContainedText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxWidth: number, fontPx: number, weight: string, family: string) {
  let size = fontPx;
  do {
    ctx.font = `${weight} ${size}px ${family || "Inter"}, sans-serif`;
    if (ctx.measureText(text).width <= maxWidth || size <= 18) break;
    size -= 2;
  } while (size > 18);
  ctx.fillText(text, x, y, maxWidth);
  return size;
}

export async function burnInBrandedClip(opts: BurnInOpts): Promise<Blob> {
  const { sourceUrl, branding, winnerName, category, format, onProgress } = opts;
  const { w, h } = FORMAT_DIMS[format];

  // 1. Load source video as a hidden element
  const video = document.createElement("video");
  video.crossOrigin = "anonymous";
  video.muted = !branding.musicTrackUrl; // mute source if we override with music
  video.playsInline = true;
  video.src = sourceUrl;

  await new Promise<void>((resolve, reject) => {
    video.onloadedmetadata = () => resolve();
    video.onerror = () => reject(new Error("Could not load source video"));
  });

  // 2. Load logo
  let logoImg: HTMLImageElement | null = null;
  if (branding.logoUrl) {
    try {
      logoImg = await loadImage(branding.logoUrl);
    } catch {
      logoImg = null;
    }
  }

  // 3. Set up canvas
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas 2D not supported");

  // 4. Set up audio: optional music track + source audio mixed
  const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
  const dest = audioCtx.createMediaStreamDestination();

  let musicEl: HTMLAudioElement | null = null;
  let videoSourceNode: MediaElementAudioSourceNode | null = null;

  if (branding.musicTrackUrl) {
    musicEl = new Audio(branding.musicTrackUrl);
    musicEl.crossOrigin = "anonymous";
    musicEl.loop = true;
    const musicSrc = audioCtx.createMediaElementSource(musicEl);
    const gain = audioCtx.createGain();
    gain.gain.value = 0.7;
    musicSrc.connect(gain).connect(dest);
  } else {
    try {
      videoSourceNode = audioCtx.createMediaElementSource(video);
      videoSourceNode.connect(dest);
      videoSourceNode.connect(audioCtx.destination); // also play locally? skip — we want silent record
    } catch {
      // some browsers block this for cross-origin — fall back to silent
    }
  }

  // 5. Combine canvas video + audio into a single stream
  const canvasStream = canvas.captureStream(30);
  const tracks = [
    ...canvasStream.getVideoTracks(),
    ...dest.stream.getAudioTracks(),
  ];
  const combined = new MediaStream(tracks);

  // 6. MediaRecorder — strongly prefer MP4/H.264 (plays in QuickTime + every player)
  const mimeCandidates = [
    'video/mp4;codecs="avc1.42E01E,mp4a.40.2"', // H.264 baseline + AAC
    'video/mp4;codecs="avc1.640028,mp4a.40.2"', // H.264 high + AAC
    "video/mp4;codecs=h264,aac",
    "video/mp4;codecs=h264",
    "video/mp4",
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  const mime = mimeCandidates.find((m) => MediaRecorder.isTypeSupported(m)) || "video/webm";
  const recorder = new MediaRecorder(combined, { mimeType: mime, videoBitsPerSecond: 4_000_000 });
  const chunks: Blob[] = [];
  recorder.ondataavailable = (e) => {
    if (e.data.size > 0) chunks.push(e.data);
  };

  // 7. Render loop — draws every animation frame while video plays
  const duration = isFinite(video.duration) ? video.duration : 30;
  const safePad = Math.round(Math.min(w, h) * 0.04);
  const lowerThirdH = Math.round(h * (format === "vertical" ? 0.16 : 0.18));
  const textAreaX = safePad;
  const textAreaY = h - lowerThirdH - safePad * 0.2;
  const textAreaW = w - safePad * 2;
  const family = branding.fontFamily || "Inter";

  const draw = () => {
    // Contain the source video inside the template frame. This prevents the
    // template from becoming only a background and keeps the whole video visible.
    const vw = video.videoWidth || w;
    const vh = video.videoHeight || h;
    const framePad = Math.round(Math.min(w, h) * (format === "vertical" ? 0.045 : 0.035));
    const frameBottomPad = lowerThirdH + safePad * 0.35;
    const frameW = w - framePad * 2;
    const frameH = h - framePad - frameBottomPad;
    const scale = Math.min(frameW / vw, frameH / vh);
    const dw = vw * scale;
    const dh = vh * scale;
    const dx = framePad + (frameW - dw) / 2;
    const dy = framePad + (frameH - dh) / 2;

    drawTemplateBackground(ctx, w, h, branding);
    ctx.save();
    roundRect(ctx, framePad, framePad, frameW, frameH, Math.round(Math.min(w, h) * 0.018));
    ctx.clip();
    ctx.fillStyle = "#000";
    ctx.fillRect(framePad, framePad, frameW, frameH);
    try {
      ctx.drawImage(video, dx, dy, dw, dh);
    } catch {
      // ignore draw errors mid-decode
    }
    ctx.restore();

    ctx.strokeStyle = hexToRgba(branding.secondaryColor, 0.62);
    ctx.lineWidth = Math.max(2, Math.round(Math.min(w, h) * 0.004));
    roundRect(ctx, framePad, framePad, frameW, frameH, Math.round(Math.min(w, h) * 0.018));
    ctx.stroke();
    const templateTint = ctx.createLinearGradient(0, 0, w, h);
    templateTint.addColorStop(0, hexToRgba(branding.primaryColor, 0.14));
    templateTint.addColorStop(0.65, "rgba(0,0,0,0)");
    templateTint.addColorStop(1, hexToRgba(branding.secondaryColor, 0.12));
    ctx.fillStyle = templateTint;
    ctx.fillRect(0, 0, w, h);

    // Lower-third: reserve a clear safe zone so logo never covers the name.
    const grad = ctx.createLinearGradient(0, h - lowerThirdH, 0, h);
    grad.addColorStop(0, hexToRgba(branding.primaryColor, 0.08));
    grad.addColorStop(1, hexToRgba(branding.primaryColor, 0.96));
    ctx.fillStyle = grad;
    ctx.fillRect(0, h - lowerThirdH, w, lowerThirdH);

    // Winner name + category
    const logoBox = logoImg ? Math.min(Math.round(w * 0.18), Math.round(h * 0.09)) : 0;
    const logoGap = logoImg ? safePad * 0.7 : 0;
    const logoOnLeft = logoImg && ["bottom-left", "center"].includes(branding.logoPlacement || "top-right");
    const textX = textAreaX + (logoOnLeft ? logoBox + logoGap : 0);
    const textW = textAreaW - (logoOnLeft ? logoBox + logoGap : 0);
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    const nameSize = Math.round(h * (format === "vertical" ? 0.035 : 0.045));
    const nameBaseline = textAreaY + lowerThirdH * 0.42;
    drawContainedText(ctx, winnerName, textX, nameBaseline, textW, nameSize, "bold", family);
    ctx.font = `${Math.round(h * (format === "vertical" ? 0.021 : 0.028))}px ${family}, sans-serif`;
    ctx.fillStyle = "rgba(255,255,255,0.9)";
    ctx.fillText(category, textX, nameBaseline + Math.round(h * 0.035), textW);

    // Logo: keep it inside the lower-third safe zone by default so it never
    // overlaps or clips the winner name.
    if (logoImg) {
      const logoMaxH = logoBox;
      const logoMaxW = Math.round(w * 0.22);
      const logoScale = Math.min(logoMaxW / logoImg.width, logoMaxH / logoImg.height);
      const lw = Math.round(logoImg.width * logoScale);
      const lh = Math.round(logoImg.height * logoScale);
      const lowerY = h - lowerThirdH + (lowerThirdH - lh) / 2;
      const pos = logoOnLeft
        ? { x: safePad, y: lowerY }
        : logoPosition(branding.logoPlacement === "bottom-right" ? "bottom-right" : "top-right", w, h - lowerThirdH, lw, lh, safePad);
      ctx.drawImage(logoImg, pos.x, pos.y, lw, lh);
    }

    // Accent bar top-left
    ctx.fillStyle = branding.primaryColor;
    ctx.fillRect(0, 0, Math.round(w * 0.18), Math.round(h * 0.006));

    if (onProgress && duration > 0) {
      onProgress(Math.min(100, Math.round((video.currentTime / duration) * 100)));
    }
  };

  // 8. Start recording, kick off video + music
  return new Promise<Blob>((resolve, reject) => {
    let rafId = 0;
    const tick = () => {
      draw();
      if (!video.paused && !video.ended) {
        rafId = requestAnimationFrame(tick);
      }
    };

    recorder.onstop = () => {
      cancelAnimationFrame(rafId);
      audioCtx.close().catch(() => {});
      const blob = new Blob(chunks, { type: mime });
      resolve(blob);
    };
    recorder.onerror = (e) => reject(e);

    video.onended = () => {
      try {
        recorder.stop();
      } catch {}
      musicEl?.pause();
    };

    // Safety timeout: stop after duration + 2s buffer
    const safetyMs = (duration + 2) * 1000;
    setTimeout(() => {
      if (recorder.state !== "inactive") {
        try {
          recorder.stop();
        } catch {}
      }
    }, Math.min(safetyMs, 180_000)); // cap at 3min

    video.currentTime = 0;
    Promise.all([
      video.play(),
      musicEl?.play() ?? Promise.resolve(),
    ])
      .then(() => {
        recorder.start(250);
        rafId = requestAnimationFrame(tick);
      })
      .catch(reject);
  });
}
