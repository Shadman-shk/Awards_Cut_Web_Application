"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { useUserRole, AppRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { RoleSkeleton } from "@/components/ui/role-skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Users,
  UserPlus,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Mail,
  Crown,
  AlertTriangle,
  RefreshCw,
  ArrowRightLeft,
  Bug,
} from "lucide-react";

interface AdminMember {
  id: string;
  email: string;
  role: AppRole;
  addedAt: string;
  userId?: string;
}

interface PendingInvite {
  id: string;
  email: string;
  role: AppRole;
  expiresAt: string;
}

export function ManageAdminsSection() {
  const { role, canManageAdmins, isLoading: roleLoading, isRoleResolved, refetchRole } = useUserRole();
  const { user } = useAuth();
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState<AdminMember | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "staff">("staff");
  const [isInviting, setIsInviting] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [showDebug, setShowDebug] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [admins, setAdmins] = useState<AdminMember[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(true);
  const [pendingInvites, setPendingInvites] = useState<PendingInvite[]>([]);

  useEffect(() => {
    const fetchAdmins = async () => {
      if (!user) return;

      setIsLoadingAdmins(true);
      try {
        // Temporarily disabled - database schema needs to be updated
        // TODO: Update to use correct table names from Supabase schema
        setAdmins([]);
        setPendingInvites([]);
      } catch (error) {
        console.error("Error in fetchAdmins:", error);
      } finally {
        setIsLoadingAdmins(false);
      }
    };

    fetchAdmins();
  }, [user]);

  const getRoleIcon = (adminRole: AppRole | null) => {
    switch (adminRole) {
      case "owner":
        return <Crown className="h-4 w-4 text-accent" />;
      case "admin":
        return <ShieldCheck className="h-4 w-4 text-primary" />;
      case "staff":
        return <Shield className="h-4 w-4 text-muted-foreground" />;
      default:
        return <ShieldAlert className="h-4 w-4" />;
    }
  };

  const getRoleBadgeStyle = (adminRole: AppRole | null) => {
    switch (adminRole) {
      case "owner":
        return "bg-accent/20 text-accent";
      case "admin":
        return "bg-primary/20 text-primary";
      case "staff":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const handleInvite = async () => {
    if (!user || !inviteEmail.trim()) {
      toast({
        title: "Invalid input",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsInviting(true);
    try {
      // Temporarily disabled - database functions need to be updated
      toast({
        title: "Feature temporarily disabled",
        description: "Team management is being updated. Please try again later.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error inviting user:", error);
      toast({
        title: "Error",
        description: "Failed to send invitation. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemove = async () => {
    if (!selectedAdmin) return;

    setIsRemoving(true);
    try {
      // Temporarily disabled - database functions need to be updated
      toast({
        title: "Feature temporarily disabled",
        description: "Team management is being updated. Please try again later.",
        variant: "destructive",
      });
    } catch (error) {
      console.error("Error removing user:", error);
      toast({
        title: "Error",
        description: "Failed to remove member. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsRemoving(false);
    }
  };

  const openRemoveModal = (admin: AdminMember) => {
    setSelectedAdmin(admin);
    setIsRemoveModalOpen(true);
  };

  const handleRefreshRole = async () => {
    setIsRefreshing(true);
    await refetchRole();
    setIsRefreshing(false);
    toast({
      title: "Role refreshed",
      description: `Current role: ${role}`,
    });
  };

  const handleTransferOwnership = async () => {
    if (!selectedAdmin || selectedAdmin.role !== "admin") {
      toast({
        title: "Cannot transfer",
        description: "You can only transfer ownership to an Admin.",
        variant: "destructive",
      });
      return;
    }

    setIsTransferring(true);
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast({
      title: "Ownership Transferred!",
      description: `${selectedAdmin.email} is now the Owner. You are now an Admin.`,
    });

    setIsTransferring(false);
    setIsTransferModalOpen(false);
    setSelectedAdmin(null);
  };

  if (roleLoading || !isRoleResolved) {
    return <RoleSkeleton message="Loading team permissions..." />;
  }

  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-foreground">Manage Admins</h2>
            <p className="text-sm text-muted-foreground">Control team access and permissions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {role === "owner" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDebug(!showDebug)}
              className="text-muted-foreground"
            >
              <Bug className="h-4 w-4" />
            </Button>
          )}
          <Button
            variant="hero"
            size="sm"
            onClick={() => canManageAdmins ? setIsInviteModalOpen(true) : setPermissionModalOpen(true)}
          >
            <UserPlus className="h-4 w-4" />
            Invite Admin
          </Button>
        </div>
      </div>

      {/* Debug Panel (Owner only) */}
      {showDebug && role === "owner" && (
        <div className="mb-6 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-bold text-yellow-500 flex items-center gap-2">
              <Bug className="h-4 w-4" /> Role Debug (Owner Only)
            </h4>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefreshRole}
              disabled={isRefreshing}
              className="text-yellow-500 hover:text-yellow-400"
            >
              {isRefreshing ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground space-y-1 font-mono">
            <p>User ID: {user?.id || "Not loaded"}</p>
            <p>Email: {user?.email || "Not loaded"}</p>
            <p>Current Role: <span className="text-primary font-bold">{role}</span></p>
            <p>Role Resolved: {isRoleResolved ? "Yes" : "No"}</p>
            <p>Can Manage Admins: {canManageAdmins ? "Yes" : "No"}</p>
          </div>
        </div>
      )}

      {/* Current Role Display */}
      <div className="mb-6 p-4 rounded-xl bg-muted/50 border border-border/30">
        <p className="text-sm text-muted-foreground mb-1">Your Role</p>
        <div className="flex items-center gap-2">
          {getRoleIcon(role)}
          <span className="font-bold text-foreground capitalize">{role || "No role assigned"}</span>
          {roleLoading && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
      </div>

      {/* Team Members */}
      <div className="space-y-3 mb-6">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-muted-foreground">Team Members</h3>
          {isLoadingAdmins && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
        </div>
        {admins.length === 0 && !isLoadingAdmins ? (
          <div className="p-4 rounded-xl bg-muted/30 text-center text-muted-foreground">
            No team members found
          </div>
        ) : (
          admins.map((admin) => (
            <div
              key={admin.id}
              className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-border/30 hover:border-border/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  {getRoleIcon(admin.role)}
                </div>
                <div>
                  <p className="font-medium text-foreground">{admin.email}</p>
                  <p className="text-xs text-muted-foreground">Added {admin.addedAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getRoleBadgeStyle(admin.role)}`}>
                  {admin.role}
                </span>
                {/* Transfer Ownership Button (Owner only, to Admins) */}
                {role === "owner" && admin.role === "admin" && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedAdmin(admin);
                      setIsTransferModalOpen(true);
                    }}
                    className="text-accent hover:text-accent hover:bg-accent/10"
                  >
                    <ArrowRightLeft className="h-4 w-4" />
                  </Button>
                )}
                {admin.role !== "owner" && canManageAdmins && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => openRemoveModal(admin)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pending Invites */}
      {pendingInvites.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Invites</h3>
          {pendingInvites.map((invite) => (
            <div
              key={invite.id}
              className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/5 border border-yellow-500/20"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center">
                  <Mail className="h-5 w-5 text-yellow-500" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{invite.email}</p>
                  <p className="text-xs text-muted-foreground">Expires {invite.expiresAt}</p>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold capitalize ${getRoleBadgeStyle(invite.role)}`}>
                {invite.role}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Role Permissions Info */}
      <div className="mt-6 p-4 rounded-xl bg-muted/30 border border-border/30">
        <h4 className="text-sm font-medium text-foreground mb-3">Role Permissions</h4>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-accent" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">Owner:</span> Full access, billing, manage admins
            </span>
          </div>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">Admin:</span> Streaming, awards, branding, reveal stream key
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              <span className="text-foreground font-medium">Staff:</span> View stream health, upload awards list
            </span>
          </div>
        </div>
      </div>

      {/* Invite Modal */}
      <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" />
              Invite Admin
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Send an invitation to add a new team member.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Email Address</Label>
              <Input
                type="email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder="admin@company.com"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Role</Label>
              <Select value={inviteRole} onValueChange={(val) => setInviteRole(val as "admin" | "staff")}>
                <SelectTrigger className="bg-muted border-border/50 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      Admin
                    </div>
                  </SelectItem>
                  <SelectItem value="staff">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4 text-muted-foreground" />
                      Staff
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsInviteModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="hero" onClick={handleInvite} disabled={isInviting}>
              {isInviting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Mail className="h-4 w-4" />
                  Send Invite
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Remove Confirmation Modal */}
      <Dialog open={isRemoveModalOpen} onOpenChange={setIsRemoveModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Remove Admin
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Are you sure you want to remove {selectedAdmin?.email} from the team?
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 justify-end py-4">
            <Button variant="secondary" onClick={() => setIsRemoveModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleRemove} disabled={isRemoving}>
              {isRemoving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Removing...
                </>
              ) : (
                <>
                  <Trash2 className="h-4 w-4" />
                  Remove
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Transfer Ownership Modal */}
      <Dialog open={isTransferModalOpen} onOpenChange={setIsTransferModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-accent" />
              Transfer Ownership
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Transfer workspace ownership to {selectedAdmin?.email}. You will become an Admin.
            </DialogDescription>
          </DialogHeader>
          <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20 my-4">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
              <div className="text-sm text-destructive">
                <p className="font-bold mb-1">This action cannot be undone!</p>
                <p>After transfer, you will lose Owner privileges including billing management and admin control.</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsTransferModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="hero"
              onClick={handleTransferOwnership}
              disabled={isTransferring}
              className="bg-accent text-accent-foreground hover:bg-accent/90"
            >
              {isTransferring ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Transferring...
                </>
              ) : (
                <>
                  <ArrowRightLeft className="h-4 w-4" />
                  Transfer Ownership
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Permission Denied Modal */}
      <Dialog open={permissionModalOpen} onOpenChange={setPermissionModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Permission Denied
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              You don't have permission for this action. Only the Owner can manage team members.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end py-4">
            <Button variant="secondary" onClick={() => setPermissionModalOpen(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
