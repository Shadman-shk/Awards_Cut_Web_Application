"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
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
  const { user } = useUser();
  const [rooms, setRooms] = useState<StreamRoom[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRooms = useCallback(async () => {
    if (!user) return;

    // TODO: Fetch from database when available
    // For now, return empty array
    setRooms([]);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchRooms();
    // TODO: Set up realtime subscriptions when database is available
  }, [fetchRooms]);

  const createRoom = useCallback(async (name: string) => {
    if (!user) {
      toast({ title: "Auth required", variant: "destructive" });
      return null;
    }

    try {
      // TODO: Create Livepeer stream and save to database
      console.log("Creating room:", name);

      // Mock room data
      const mockRoom: StreamRoom = {
        id: `room_${Date.now()}`,
        user_id: user.id,
        name,
        livepeer_stream_id: `stream_${Date.now()}`,
        livepeer_stream_key: `sk_${Math.random().toString(36).substring(2)}`,
        livepeer_playback_id: `playback_${Date.now()}`,
        rtmp_url: "rtmps://rtmp.livepeer.com/live",
        status: "idle",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        deleted_at: null,
      };

      setRooms(prev => [...prev, mockRoom]);
      toast({ title: "✅ Room Created", description: `"${name}" is ready for streaming.` });
      return mockRoom;
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
      return null;
    }
  }, [user]);

  const deleteRoom = useCallback(async (room: StreamRoom) => {
    // TODO: Delete Livepeer stream and soft delete from database
    console.log("Deleting room:", room.id);

    setRooms(prev => prev.filter(r => r.id !== room.id));
    toast({ title: "Room Deleted", description: `"${room.name}" has been removed.` });
  }, []);

  const updateRoomName = useCallback(async (roomId: string, name: string) => {
    // TODO: Update in database
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, name } : r));
  }, []);

  const updateRoomStatus = useCallback(async (roomId: string, status: string) => {
    // TODO: Update in database
    setRooms(prev => prev.map(r => r.id === roomId ? { ...r, status } : r));
  }, []);

  const checkRoomHealth = useCallback(async (room: StreamRoom) => {
    if (!room.livepeer_stream_id) return null;

    try {
      // TODO: Check health via API
      console.log("Checking room health:", room.id);
      return room.status;
    } catch {
      return null;
    }
  }, []);

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