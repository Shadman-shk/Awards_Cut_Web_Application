"use client";
import { useState, useCallback } from "react";

export interface StreamRoom {
  id: string;
  name: string;
  status: "idle" | "live" | "monitoring" | "gone";
  livepeer_stream_id: string | null;
  livepeer_stream_key: string | null;
  livepeer_playback_id: string | null;
  rtmp_url: string | null;
  created_at: string;
}

export function useStreamRooms() {
  const [rooms, setRooms] = useState<StreamRoom[]>([]);
  const [loading] = useState(false);

  const createRoom = useCallback(async (name: string): Promise<StreamRoom | null> => {
    const room: StreamRoom = {
      id: `room-${Date.now()}`,
      name,
      status: "idle",
      livepeer_stream_id: `stream-${Date.now()}`,
      livepeer_stream_key: `sk-live-${Math.random().toString(36).slice(2, 14)}`,
      livepeer_playback_id: `pl-${Math.random().toString(36).slice(2, 10)}`,
      rtmp_url: "rtmp://rtmp.livepeer.com/live",
      created_at: new Date().toISOString(),
    };
    setRooms((prev) => [...prev, room]);
    return room;
  }, []);

  const deleteRoom = useCallback(async (room: StreamRoom) => {
    setRooms((prev) => prev.filter((r) => r.id !== room.id));
  }, []);

  const updateRoomName = useCallback((id: string, name: string) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, name } : r)));
  }, []);

  const updateRoomStatus = useCallback((id: string, status: string) => {
    setRooms((prev) => prev.map((r) => (r.id === id ? { ...r, status: status as StreamRoom["status"] } : r)));
  }, []);

  const checkRoomHealth = useCallback(async (room: StreamRoom) => {
    // Mock health check
  }, []);

  return { rooms, loading, createRoom, deleteRoom, updateRoomName, updateRoomStatus, checkRoomHealth };
}
