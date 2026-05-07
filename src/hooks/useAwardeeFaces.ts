import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  arrayToDescriptor,
  computeDescriptorFromImage,
  descriptorToArray,
  fileToImage,
  type EnrolledFace,
} from "@/lib/faceRecognition";
import { toast } from "@/hooks/use-toast";

export function useAwardeeFaces() {
  const { user } = useAuth();
  const [faces, setFaces] = useState<EnrolledFace[]>([]);
  const [loading, setLoading] = useState(true);
  const [enrolling, setEnrolling] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from("awardee_faces")
      .select("id, awardee_name, award_category_id, descriptor")
      .eq("user_id", user.id);
    if (!error && data) {
      setFaces(
        data.map((d) => ({
          id: d.id,
          awardee_name: d.awardee_name,
          award_category_id: d.award_category_id,
          descriptor: arrayToDescriptor(d.descriptor),
        }))
      );
    }
    setLoading(false);
  }, [user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  /** Enroll a new awardee from a photo file. Computes descriptor in the browser. */
  const enrollFace = useCallback(
    async (params: {
      awardeeName: string;
      photoFile: File;
      awardCategoryId?: string | null;
    }): Promise<boolean> => {
      if (!user) return false;
      setEnrolling(true);
      try {
        // 1. Compute descriptor in browser
        const img = await fileToImage(params.photoFile);
        const descriptor = await computeDescriptorFromImage(img);
        if (!descriptor) {
          toast({
            title: "No face detected",
            description: "Try a clearer, front-facing photo.",
            variant: "destructive",
          });
          return false;
        }

        // 2. Upload photo to storage
        const ext = params.photoFile.name.split(".").pop() || "jpg";
        const path = `${user.id}/${crypto.randomUUID()}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("awardee-photos")
          .upload(path, params.photoFile, { contentType: params.photoFile.type });

        if (upErr) {
          toast({ title: "Upload failed", description: upErr.message, variant: "destructive" });
          return false;
        }
        const { data: pub } = supabase.storage.from("awardee-photos").getPublicUrl(path);

        // 3. Insert row
        const { error: insErr } = await supabase.from("awardee_faces").insert({
          user_id: user.id,
          awardee_name: params.awardeeName,
          award_category_id: params.awardCategoryId ?? null,
          photo_url: pub.publicUrl,
          descriptor: descriptorToArray(descriptor) as any,
        });

        if (insErr) {
          toast({ title: "Save failed", description: insErr.message, variant: "destructive" });
          return false;
        }

        toast({
          title: "Face enrolled",
          description: `${params.awardeeName} can now be auto-recognized.`,
        });
        await refresh();
        return true;
      } catch (e) {
        toast({
          title: "Enrollment error",
          description: e instanceof Error ? e.message : "Unknown error",
          variant: "destructive",
        });
        return false;
      } finally {
        setEnrolling(false);
      }
    },
    [user, refresh]
  );

  const removeFace = useCallback(
    async (faceId: string) => {
      const { error } = await supabase.from("awardee_faces").delete().eq("id", faceId);
      if (error) {
        toast({ title: "Delete failed", description: error.message, variant: "destructive" });
        return false;
      }
      setFaces((prev) => prev.filter((f) => f.id !== faceId));
      return true;
    },
    []
  );

  return { faces, loading, enrolling, enrollFace, removeFace, refresh };
}
