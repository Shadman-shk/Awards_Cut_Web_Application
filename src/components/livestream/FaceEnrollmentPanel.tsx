import { useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Loader2, UserPlus, Trash2, Scan, ImageIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { useAwardeeFaces } from "@/hooks/useAwardeeFaces";
import { toast } from "@/hooks/use-toast";

interface FaceEnrollmentPanelProps {
  /** Optional preset awardee name (e.g., when opening from an award row). */
  defaultName?: string;
  awardCategoryId?: string | null;
  triggerLabel?: string;
}

export function FaceEnrollmentPanel({
  defaultName = "",
  awardCategoryId = null,
  triggerLabel = "Enroll Face",
}: FaceEnrollmentPanelProps) {
  const { faces, loading, enrolling, enrollFace, removeFace } = useAwardeeFaces();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(defaultName);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File | null) => {
    if (!f) return;
    if (!f.type.startsWith("image/")) {
      toast({ title: "Image required", variant: "destructive" });
      return;
    }
    setFile(f);
    setPreviewUrl(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      toast({ title: "Enter a name", variant: "destructive" });
      return;
    }
    if (!file) {
      toast({ title: "Upload a photo", variant: "destructive" });
      return;
    }
    const ok = await enrollFace({
      awardeeName: name.trim(),
      photoFile: file,
      awardCategoryId,
    });
    if (ok) {
      setName(defaultName);
      setFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" onClick={() => setOpen(true)}>
        <Scan className="h-4 w-4" />
        {triggerLabel}
        {faces.length > 0 && (
          <span className="ml-1 px-1.5 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-mono">
            {faces.length}
          </span>
        )}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-card border-border/50 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Scan className="h-5 w-5 text-primary" />
              Awardee Face Recognition
            </DialogTitle>
            <DialogDescription>
              Upload a clear photo of each awardee. During the livestream, we'll auto-tag clips
              when their face appears on camera. Runs entirely in your browser — no API costs.
            </DialogDescription>
          </DialogHeader>

          {/* Enrollment form */}
          <div className="space-y-4 p-4 rounded-xl bg-muted/30 border border-border/30">
            <div className="grid grid-cols-1 sm:grid-cols-[140px_1fr] gap-4 items-start">
              {/* Photo dropzone */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="aspect-square w-full rounded-xl border-2 border-dashed border-border hover:border-primary/50 bg-charcoal/50 flex items-center justify-center overflow-hidden transition-colors"
              >
                {previewUrl ? (
                  <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center px-2">
                    <ImageIcon className="h-6 w-6 text-muted-foreground/50 mx-auto mb-1" />
                    <p className="text-[10px] text-muted-foreground">Click to upload</p>
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFile(e.target.files?.[0] || null)}
                />
              </button>

              <div className="space-y-3">
                <div>
                  <Label htmlFor="awardee-name" className="text-xs text-muted-foreground">
                    Awardee Name
                  </Label>
                  <Input
                    id="awardee-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="e.g. Sarah Johnson"
                    className="bg-muted border-border/50 text-foreground"
                  />
                </div>
                <Button
                  variant="hero"
                  onClick={handleSubmit}
                  disabled={enrolling || !file || !name.trim()}
                  className="w-full"
                >
                  {enrolling ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Computing face descriptor…
                    </>
                  ) : (
                    <>
                      <UserPlus className="h-4 w-4" />
                      Enroll Face
                    </>
                  )}
                </Button>
                <p className="text-[10px] text-muted-foreground">
                  Tip: front-facing photo, good lighting, one face only.
                </p>
              </div>
            </div>
          </div>

          {/* Enrolled list */}
          <div>
            <h4 className="text-sm font-semibold text-foreground mb-2">
              Enrolled ({loading ? "…" : faces.length})
            </h4>
            <div className="max-h-64 overflow-y-auto space-y-1.5">
              {loading ? (
                <p className="text-xs text-muted-foreground py-4 text-center">Loading…</p>
              ) : faces.length === 0 ? (
                <p className="text-xs text-muted-foreground py-4 text-center">
                  No awardees enrolled yet.
                </p>
              ) : (
                faces.map((f) => (
                  <motion.div
                    key={f.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between p-2 rounded-lg bg-muted/40 border border-border/20"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center">
                        <Scan className="h-3.5 w-3.5 text-primary" />
                      </div>
                      <span className="text-sm text-foreground">{f.awardee_name}</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => removeFace(f.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5 text-destructive" />
                    </Button>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
