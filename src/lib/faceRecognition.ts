/**
 * Face recognition service using @vladmandic/face-api (TensorFlow.js).
 * Runs entirely in the browser — no API keys, no per-call cost.
 *
 * Performance:
 * - Uses TinyFaceDetector at 224px input (fast)
 * - Live detection downscales frames to 320px before processing
 *   so video playback resolution is unaffected
 * - All inference is async — never blocks the main render loop
 */
import * as faceapi from "@vladmandic/face-api";

const MODEL_URL = "https://cdn.jsdelivr.net/npm/@vladmandic/face-api@1.7.15/model";

let modelsLoadingPromise: Promise<void> | null = null;
let modelsLoaded = false;

export async function loadFaceModels(): Promise<void> {
  if (modelsLoaded) return;
  if (modelsLoadingPromise) return modelsLoadingPromise;

  modelsLoadingPromise = (async () => {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68TinyNet.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL),
    ]);
    modelsLoaded = true;
  })();

  return modelsLoadingPromise;
}

// Enrollment uses higher accuracy (more pixels) — runs once per photo
const enrollDetectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 416,
  scoreThreshold: 0.5,
});

// Live detection prioritises speed — runs every couple seconds
const liveDetectorOptions = new faceapi.TinyFaceDetectorOptions({
  inputSize: 224,
  scoreThreshold: 0.5,
});

/** Compute a 128-dim face descriptor from an image element. Returns null if no face found. */
export async function computeDescriptorFromImage(
  img: HTMLImageElement
): Promise<Float32Array | null> {
  await loadFaceModels();
  const detection = await faceapi
    .detectSingleFace(img, enrollDetectorOptions)
    .withFaceLandmarks(true)
    .withFaceDescriptor();
  return detection?.descriptor ?? null;
}

/**
 * Reusable downscale canvas — shared across calls so we don't churn memory.
 * Detection runs on a 320px copy of the frame, NOT the full-resolution video,
 * so high-quality playback is unaffected.
 */
let scratchCanvas: HTMLCanvasElement | null = null;
function getScratchCanvas(): HTMLCanvasElement {
  if (!scratchCanvas) scratchCanvas = document.createElement("canvas");
  return scratchCanvas;
}

/** Compute descriptors for all faces visible in a video frame (downscaled for speed). */
export async function computeDescriptorsFromVideo(
  video: HTMLVideoElement
): Promise<Float32Array[]> {
  await loadFaceModels();
  if (video.readyState < 2 || video.videoWidth === 0) return [];

  // Downscale to 320px wide — keeps detection fast without touching playback
  const targetW = 320;
  const scale = targetW / video.videoWidth;
  const targetH = Math.round(video.videoHeight * scale);
  const canvas = getScratchCanvas();
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return [];
  ctx.drawImage(video, 0, 0, targetW, targetH);

  const detections = await faceapi
    .detectAllFaces(canvas, liveDetectorOptions)
    .withFaceLandmarks(true)
    .withFaceDescriptors();
  return detections.map((d) => d.descriptor);
}

/** Load an image File/Blob into an HTMLImageElement. */
export function fileToImage(file: File | Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    const url = URL.createObjectURL(file);
    img.onload = () => {
      resolve(img);
      setTimeout(() => URL.revokeObjectURL(url), 5000);
    };
    img.onerror = (e) => reject(e);
    img.src = url;
  });
}

/** Euclidean distance between two descriptors. Lower = more similar. */
export function descriptorDistance(a: Float32Array | number[], b: Float32Array | number[]): number {
  let sum = 0;
  for (let i = 0; i < a.length; i++) {
    const d = (a[i] as number) - (b[i] as number);
    sum += d * d;
  }
  return Math.sqrt(sum);
}

export interface EnrolledFace {
  id: string;
  awardee_name: string;
  award_category_id: string | null;
  descriptor: Float32Array;
}

export function findBestMatch(
  query: Float32Array,
  enrolled: EnrolledFace[],
  threshold = 0.55
): { face: EnrolledFace; distance: number } | null {
  let best: { face: EnrolledFace; distance: number } | null = null;
  for (const face of enrolled) {
    const distance = descriptorDistance(query, face.descriptor);
    if (distance < threshold && (!best || distance < best.distance)) {
      best = { face, distance };
    }
  }
  return best;
}

export function descriptorToArray(d: Float32Array): number[] {
  return Array.from(d);
}

export function arrayToDescriptor(arr: unknown): Float32Array {
  if (arr instanceof Float32Array) return arr;
  if (Array.isArray(arr)) return new Float32Array(arr);
  return new Float32Array(0);
}
