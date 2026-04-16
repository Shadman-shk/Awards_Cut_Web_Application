"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

export type AppRole = "owner" | "admin" | "staff";

interface UserRoleState {
  role: AppRole | null;
  isLoading: boolean;
  isRoleResolved: boolean;
  canManageStream: boolean;
  canRevealStreamKey: boolean;
  canManageBilling: boolean;
  canManageAdmins: boolean;
  canViewStreamHealth: boolean;
  canUploadAwards: boolean;
  refetchRole: () => Promise<void>;
}

export function useUserRole(): UserRoleState {
  const { user, isLoaded } = useUser();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleResolved, setIsRoleResolved] = useState(false);

  const fetchRole = useCallback(async () => {
    // Don't fetch if auth is still loading or no user
    if (!isLoaded) {
      return;
    }

    if (!user) {
      setRole(null);
      setIsLoading(false);
      setIsRoleResolved(true);
      return;
    }

    setIsLoading(true);

    try {
      // TODO: Fetch role from database when available
      // For now, default to owner for demo purposes
      setRole("owner");
    } catch (err) {
      console.error("Error in fetchRole:", err);
      // For demo purposes, default to owner so users can test the system
      setRole("owner");
    } finally {
      setIsLoading(false);
      setIsRoleResolved(true);
    }
  }, [user, isLoaded]);

  useEffect(() => {
    fetchRole();
  }, [fetchRole]);

  // Permission calculations based on role
  // CRITICAL: All permissions return false while loading to prevent premature access denial
  const permissions: Omit<UserRoleState, "role" | "isLoading" | "isRoleResolved" | "refetchRole"> = {
    // Owner and Admin can manage stream config
    canManageStream: isRoleResolved && (role === "owner" || role === "admin"),
    // Only Owner and Admin can reveal stream key
    canRevealStreamKey: isRoleResolved && (role === "owner" || role === "admin"),
    // Only Owner can manage billing
    canManageBilling: isRoleResolved && role === "owner",
    // Only Owner can manage admins
    canManageAdmins: isRoleResolved && role === "owner",
    // All roles can view stream health
    canViewStreamHealth: isRoleResolved && (role === "owner" || role === "admin" || role === "staff"),
    // Staff and above can upload awards
    canUploadAwards: isRoleResolved && (role === "owner" || role === "admin" || role === "staff"),
  };

  return {
    role,
    isLoading: isLoading || !isLoaded,
    isRoleResolved,
    refetchRole: fetchRole,
    ...permissions,
  };
}