"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Users, UserX } from "lucide-react";

interface FaceDetectionOverlayProps {
  videoElement: HTMLVideoElement | null;
  enabled: boolean;
}

export function FaceDetectionOverlay({ videoElement, enabled }: FaceDetectionOverlayProps) {
  const [faceCount, setFaceCount] = useState(0);
  const [modelLoaded, setModelLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const modelRef = useRef<any>(null);
  const rafRef = useRef<number | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Load BlazeFace model
  useEffect(() => {
    if (!enabled) return;

    let cancelled = false;

    const loadModel = async () => {
      setLoading(true);
      try {
        const tf = await import("@tensorflow/tfjs");
        await tf.ready();
        const blazeface = await import("@tensorflow-models/blazeface");
        const model = await blazeface.load();
        if (!cancelled) {
          modelRef.current = model;
          setModelLoaded(true);
        }
      } catch (err) {
        console.error("Failed to load face detection model:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadModel();
    return () => { cancelled = true; };
  }, [enabled]);

  // Detection loop
  const detect = useCallback(async () => {
    if (!modelRef.current || !videoElement || videoElement.paused || videoElement.ended) {
      rafRef.current = requestAnimationFrame(detect);
      return;
    }

    try {
      const predictions = await modelRef.current.estimateFaces(videoElement, false);
      setFaceCount(predictions.length);

      // Draw bounding boxes on canvas
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d");
        if (ctx) {
          canvas.width = videoElement.videoWidth || videoElement.clientWidth;
          canvas.height = videoElement.videoHeight || videoElement.clientHeight;

          ctx.clearRect(0, 0, canvas.width, canvas.height);

          for (const pred of predictions) {
            const start = pred.topLeft as [number, number];
            const end = pred.bottomRight as [number, number];
            const w = end[0] - start[0];
            const h = end[1] - start[1];

            // Green box for single face, yellow for multiple
            ctx.strokeStyle = predictions.length === 1 ? "#22c55e" : "#eab308";
            ctx.lineWidth = 2;
            ctx.strokeRect(start[0], start[1], w, h);

            // Small label
            ctx.fillStyle = predictions.length === 1 ? "#22c55e" : "#eab308";
            ctx.font = "12px monospace";
            ctx.fillText(
              `${(pred.probability[0] * 100).toFixed(0)}%`,
              start[0],
              start[1] - 4
            );
          }
        }
      }
    } catch {
      // Skip frame on error
    }

    // Run detection ~5 fps
    setTimeout(() => {
      rafRef.current = requestAnimationFrame(detect);
    }, 200);
  }, [videoElement]);

  useEffect(() => {
    if (modelLoaded && enabled && videoElement) {
      rafRef.current = requestAnimationFrame(detect);
    }
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
    };
  }, [modelLoaded, enabled, videoElement, detect]);

  if (!enabled) return null;

  const isSingleFace = faceCount === 1;
  const StatusIcon = faceCount === 0 ? UserX : faceCount === 1 ? User : Users;

  return (
    <>
      {/* Bounding box canvas overlay */}
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full pointer-events-none"
        style={{ objectFit: "contain" }}
      />

      {/* Face count badge */}
      <AnimatePresence mode="wait">
        <motion.div
          key={faceCount}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={`absolute top-3 right-3 flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold backdrop-blur-sm ${
            loading
              ? "bg-muted/80 text-muted-foreground"
              : isSingleFace
              ? "bg-green-500/80 text-white"
              : faceCount === 0
              ? "bg-muted/80 text-muted-foreground"
              : "bg-yellow-500/80 text-white"
          }`}
        >
          <StatusIcon className="h-4 w-4" />
          {loading
            ? "Loading face model..."
            : faceCount === 0
            ? "No faces"
            : `${faceCount} face${faceCount > 1 ? "s" : ""}`}
        </motion.div>
      </AnimatePresence>

      {/* Single face highlight ring */}
      {isSingleFace && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="absolute inset-0 rounded-xl ring-2 ring-green-500/50 pointer-events-none"
        />
      )}
    </>
  );
}
