"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

export interface StreamRoom {
  id: string;
  user_id: string;
  name: string;
  livepeer_stream_id: string | null;
  livepeer_stream_key: string | null;
  livepeer_playback_id: string | null;
  rtmp_url: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export function useStreamRooms() {
  const [rooms, setRooms] = useState<StreamRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data, error } = await supabase
      .from("stream_rooms")
      .select("*")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: true });

    if (data) setRooms(data as unknown as StreamRoom[]);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRooms();

    const channel = supabase
      .channel("stream-rooms-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "stream_rooms" }, () => {
        fetchRooms();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [fetchRooms]);

  const createRoom = useCallback(async (name: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      toast({ title: "Auth required", variant: "destructive" });
      return null;
    }

    // Create Livepeer stream
    try {
      const { data: streamData, error: fnErr } = await supabase.functions.invoke("mux-stream", {
        body: { action: "create" },
      });

      if (fnErr || streamData?.error) {
        toast({ title: "Stream creation failed", description: streamData?.error || fnErr?.message, variant: "destructive" });
        return null;
      }

      const { data: room, error: insertErr } = await supabase
        .from("stream_rooms")
        .insert({
          user_id: user.id,
          name,
          livepeer_stream_id: streamData.stream_id,
          livepeer_stream_key: streamData.stream_key,
          livepeer_playback_id: streamData.playback_id,
          rtmp_url: streamData.rtmps_url || streamData.rtmp_url,
          status: "idle",
        } as any)
        .select()
        .single();

      if (insertErr) {
        toast({ title: "Failed to save room", description: insertErr.message, variant: "destructive" });
        return null;
      }

      toast({ title: "✅ Room Created", description: `"${name}" is ready for streaming.` });
      await fetchRooms();
      return room as unknown as StreamRoom;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  }, [fetchRooms]);

  const deleteRoom = useCallback(async (room: StreamRoom) => {
    // Delete Livepeer stream (gracefully handle 404)
    if (room.livepeer_stream_id) {
      try {
        await supabase.functions.invoke("mux-stream", {
          body: { action: "delete", stream_id: room.livepeer_stream_id },
        });
      } catch {
        // Best effort
      }
    }

    // Soft delete
    await supabase
      .from("stream_rooms")
      .update({ deleted_at: new Date().toISOString(), status: "gone" } as any)
      .eq("id", room.id);

    toast({ title: "Room Deleted", description: `"${room.name}" has been removed.` });
    await fetchRooms();
  }, [fetchRooms]);

  const updateRoomName = useCallback(async (roomId: string, name: string) => {
    await supabase.from("stream_rooms").update({ name } as any).eq("id", roomId);
    await fetchRooms();
  }, [fetchRooms]);

  const updateRoomStatus = useCallback(async (roomId: string, status: string) => {
    await supabase.from("stream_rooms").update({ status } as any).eq("id", roomId);
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
  }, []);

  const checkRoomHealth = useCallback(async (room: StreamRoom) => {
    if (!room.livepeer_stream_id) return null;

    try {
      const { data } = await supabase.functions.invoke("mux-stream", {
        body: { action: "status", stream_id: room.livepeer_stream_id },
      });

      if (data?.status === "gone") {
        await updateRoomStatus(room.id, "gone");
        return "gone";
      }

      const newStatus = data?.status === "active" ? "live" : "idle";
      if (room.status !== newStatus) {
        await updateRoomStatus(room.id, newStatus);
      }
      return newStatus;
    } catch {
      return null;
    }
  }, [updateRoomStatus]);

  return {
    rooms,
    loading,
    createRoom,
    deleteRoom,
    updateRoomName,
    updateRoomStatus,
    checkRoomHealth,
    refetch: fetchRooms,
  };
}
