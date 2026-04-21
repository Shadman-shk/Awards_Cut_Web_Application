"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

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
  const { user, loading: authLoading } = useAuth();
  const [role, setRole] = useState<AppRole | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRoleResolved, setIsRoleResolved] = useState(false);

  const fetchRole = useCallback(async () => {
    // Don't fetch if auth is still loading or no user
    if (authLoading) {
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
      // First try to get the existing role
      const { data: existingRole, error: roleError } = await supabase.rpc("get_user_role", {
        _user_id: user.id,
      });

      if (roleError) {
        console.error("Error fetching user role:", roleError);
      }

      // If user has a role, use it
      if (existingRole) {
        setRole(existingRole as AppRole);
        setIsLoading(false);
        setIsRoleResolved(true);
        return;
      }

      // User has no role - try to auto-assign (first user becomes owner)
      const { data: assignedRole, error: assignError } = await supabase.rpc(
        "assign_first_user_owner",
        {
          _user_id: user.id,
          _email: user.email || "",
        }
      );

      if (assignError) {
        console.error("Error assigning role:", assignError);
        // Default to owner for demo purposes
        setRole("owner");
      } else if (assignedRole) {
        setRole(assignedRole as AppRole);
      } else {
        // No role assigned (user needs to be invited by an owner)
        console.log("No role assigned - user needs to be invited");
        setRole(null);
      }
    } catch (err) {
      console.error("Error in fetchRole:", err);
      // For demo purposes, default to owner so users can test the system
      setRole("owner");
    } finally {
      setIsLoading(false);
      setIsRoleResolved(true);
    }
  }, [user, authLoading]);

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
    isLoading: isLoading || authLoading,
    isRoleResolved,
    refetchRole: fetchRole,
    ...permissions,
  };
}
