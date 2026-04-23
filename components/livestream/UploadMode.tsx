"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Upload, Video, FileVideo, CheckCircle2, Play, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useLivestreamStore } from "@/stores/livestreamStore";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface UploadModeProps {
  onVideoReady: (filename: string, videoUrl: string) => void;
}

export function UploadMode({ onVideoReady }: UploadModeProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const { uploadedObjectUrl: uploadedVideoUrl, setUploadedFile } = useLivestreamStore();
  const setUploadedVideoUrl = (url: string | null) => setUploadedFile(null, url);

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && (file.type.startsWith("video/") || file.name.match(/\.(mp4|mov|mkv|webm)$/i))) {
      await processFile(file);
    } else {
      toast({ title: "Invalid file", description: "Please upload an MP4, MOV, MKV, or WebM file.", variant: "destructive" });
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) await processFile(file);
  };

  const processFile = async (file: File) => {
    if (file.size > 500 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 500MB for uploads.", variant: "destructive" });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({ title: "Not authenticated", description: "Please log in to upload videos.", variant: "destructive" });
        setUploading(false);
        return;
      }

      // Upload to Supabase Storage
      const fileExt = file.name.split('.').pop() || 'mp4';
      const filePath = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;

      // Simulate progress while uploading
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 5, 85));
      }, 200);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('ceremony-videos')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      clearInterval(progressInterval);

      if (uploadError) {
        toast({ title: "Upload failed", description: uploadError.message, variant: "destructive" });
        setUploading(false);
        setUploadProgress(0);
        return;
      }

      setUploadProgress(95);

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('ceremony-videos')
        .getPublicUrl(filePath);

      const publicUrl = urlData.publicUrl;

      setUploadProgress(100);
      setUploadedVideoUrl(publicUrl);
      setUploadedFileName(file.name);
      setUploading(false);

      toast({ title: "Video uploaded", description: `${file.name} uploaded and ready for AI analysis.` });
      onVideoReady(file.name, publicUrl);
    } catch (err: any) {
      setUploading(false);
      setUploadProgress(0);
      toast({ title: "Upload error", description: err.message || "Something went wrong", variant: "destructive" });
    }
  };

  const handleReplace = () => {
    setUploadedVideoUrl(null);
    setUploadedFileName(null);
    setUploadProgress(0);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          <Upload className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Video Upload</h2>
          <p className="text-sm text-muted-foreground">Upload a pre-recorded ceremony video</p>
        </div>
      </div>

      {uploadedVideoUrl && uploadedFileName ? (
        <div className="space-y-4">
          <div className="rounded-xl overflow-hidden bg-black border border-border/50">
            <video
              ref={videoPreviewRef}
              src={uploadedVideoUrl}
              controls
              className="w-full aspect-video object-contain"
            />
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <FileVideo className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="font-medium text-foreground truncate">{uploadedFileName}</p>
              <p className="text-sm text-green-500 flex items-center gap-1">
                <CheckCircle2 className="h-3.5 w-3.5" /> Uploaded & ready for AI analysis
              </p>
            </div>
            <Button variant="secondary" size="sm" onClick={handleReplace}>
              Replace
            </Button>
          </div>
        </div>
      ) : (
        <label
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={`block cursor-pointer p-12 rounded-xl border-2 border-dashed text-center transition-all ${
            isDragging ? "border-primary bg-primary/5" : "border-border/50 hover:border-border"
          }`}
        >
          <input type="file" accept="video/mp4,video/quicktime,video/x-matroska,video/webm" className="hidden" onChange={handleFileSelect} />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-12 w-12 text-primary animate-spin" />
              <p className="text-foreground font-medium">Uploading to storage... {uploadProgress}%</p>
              <Progress value={uploadProgress} className="w-48 h-2" />
            </div>
          ) : (
            <div className="flex flex-col items-center gap-3">
              <Video className="h-12 w-12 text-muted-foreground" />
              <p className="text-foreground font-medium">Drop video here or click to browse</p>
              <p className="text-xs text-muted-foreground">MP4, MOV, MKV, WebM up to 500MB</p>
            </div>
          )}
        </label>
      )}
    </motion.div>
  );
}
