"use client";
export function useUserRole() {
  return {
    role: "admin" as const,
    canRevealStreamKey: true,
    canManageStreams: true,
    canDeleteClips: true,
  };
}
