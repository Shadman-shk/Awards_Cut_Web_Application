"use client";

import { useState } from "react";

// ─── Routing ────────────────────────────────────────────────────────────────
// Next.js router — replaces useNavigate from react-router-dom
import { useRouter } from "next/navigation";

// ─── Icons ───────────────────────────────────────────────────────────────────
import {
  User,
  Mail,
  Building,
  CreditCard,
  Bell,
  Shield,
  Globe,
  Save,
  Loader2,
  Download,
  Key,
  Smartphone,
  FileText,
  AlertTriangle,
} from "lucide-react";

// ─── Toast ───────────────────────────────────────────────────────────────────
// Lightweight stand-in toast. Swap this out for your preferred library:
//   • sonner:          import { toast } from "sonner";
//   • react-hot-toast: import toast from "react-hot-toast";
//   • shadcn/ui:       import { useToast } from "@/components/ui/use-toast";
const toast = ({
  title,
  description,
}: {
  title: string;
  description?: string;
  variant?: string;
}) => {
  // Replace with your real toast implementation
  console.info(`[Toast] ${title}${description ? ` — ${description}` : ""}`);
  alert(`${title}${description ? `\n${description}` : ""}`);
};

// ─── Reusable primitives ─────────────────────────────────────────────────────
// These are minimal drop-in replacements so the file compiles without any
// local UI library. If you already have shadcn/ui or a similar setup, just
// swap these back to your real imports:
//   import { Button }   from "@/components/ui/button";
//   import { Input }    from "@/components/ui/input";
//   import { Label }    from "@/components/ui/label";
//   import { Dialog, DialogContent, … } from "@/components/ui/dialog";

type ButtonVariant = "hero" | "secondary" | "destructive" | "ghost";

function Button({
  children,
  onClick,
  disabled,
  variant = "secondary",
  size,
  className = "",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  size?: string;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none";
  const sizes: Record<string, string> = {
    sm: "px-3 py-1.5 text-sm",
    lg: "px-6 py-3 text-base",
    default: "px-4 py-2 text-sm",
  };
  const variants: Record<ButtonVariant, string> = {
    hero: "bg-primary text-primary-foreground hover:bg-primary/90",
    secondary: "bg-muted text-foreground hover:bg-muted/80 border border-border/50",
    destructive: "bg-destructive text-destructive-foreground hover:bg-destructive/90",
    ghost: "bg-transparent text-foreground hover:bg-muted",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size ?? "default"]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

function Input({
  value,
  onChange,
  type = "text",
  placeholder,
  maxLength,
  className = "",
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  type?: string;
  placeholder?: string;
  maxLength?: number;
  className?: string;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      maxLength={maxLength}
      className={`w-full h-10 px-3 rounded-lg border border-border/50 bg-muted text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 ${className}`}
    />
  );
}

function Label({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <label className={`block text-sm font-medium ${className}`}>{children}</label>
  );
}

// ─── Minimal Dialog ───────────────────────────────────────────────────────────
function Dialog({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onClick={() => onOpenChange(false)}
    >
      {children}
    </div>
  );
}

function DialogContent({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`relative z-50 w-full rounded-2xl p-6 shadow-xl ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      {children}
    </div>
  );
}

function DialogHeader({ children }: { children: React.ReactNode }) {
  return <div className="mb-4 space-y-1">{children}</div>;
}

function DialogTitle({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <h2 className={`text-lg font-bold ${className}`}>{children}</h2>;
}

function DialogDescription({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <p className={`text-sm ${className}`}>{children}</p>;
}

// ─── Stub layout — replace with your real Next.js dashboard layout ────────────
// e.g. import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
function DashboardLayout({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen p-6 bg-background">{children}</main>;
}

// ─── Stub sections — replace with your real components ───────────────────────
// import { AppearanceSection }  from "@/components/dashboard/AppearanceSection";
// import { ManageAdminsSection } from "@/components/dashboard/ManageAdminsSection";
function AppearanceSection() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <p className="text-muted-foreground text-sm">AppearanceSection placeholder</p>
    </div>
  );
}
function ManageAdminsSection() {
  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <p className="text-muted-foreground text-sm">ManageAdminsSection placeholder</p>
    </div>
  );
}

// ─── Fade-in wrapper (no framer-motion dependency) ───────────────────────────
// If you have framer-motion installed, swap this back:
//   import { motion } from "framer-motion";
//   <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} …>
function FadeIn({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`animate-[fadeInUp_0.4s_ease_both] ${className}`}
      style={{ animation: "fadeInUp 0.4s ease both" }}
    >
      {children}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function Settings() {
  const router = useRouter(); // replaces useNavigate()

  const [formData, setFormData] = useState({
    name: "John Smith",
    email: "john@company.com",
    company: "Acme Awards Inc.",
    timezone: "America/New_York",
  });

  const [isSaving, setIsSaving] = useState(false);
  const [notifications, setNotifications] = useState({
    emailNotifications: true,
    smsAlerts: true,
    weeklyDigest: false,
    marketing: false,
  });

  // Modal states
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [is2FAModalOpen, setIs2FAModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [isInvoicesModalOpen, setIsInvoicesModalOpen] = useState(false);

  // Password form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // 2FA state
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [verificationCode, setVerificationCode] = useState("");
  const [isVerifying2FA, setIsVerifying2FA] = useState(false);

  // Delete confirmation
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Handlers ────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({ title: "Settings saved!", description: "Your preferences have been updated." });
  };

  const handleChangePassword = async () => {
    if (
      !passwordForm.currentPassword ||
      !passwordForm.newPassword ||
      !passwordForm.confirmPassword
    ) {
      toast({ title: "Missing fields", description: "Please fill in all password fields.", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({ title: "Passwords don't match", description: "New password and confirmation must match.", variant: "destructive" });
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      toast({ title: "Password too short", description: "Password must be at least 8 characters.", variant: "destructive" });
      return;
    }
    setIsChangingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsChangingPassword(false);
    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast({ title: "Password changed!", description: "Your password has been updated successfully." });
  };

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast({ title: "Invalid code", description: "Please enter a 6-digit verification code.", variant: "destructive" });
      return;
    }
    setIsVerifying2FA(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsVerifying2FA(false);
    setIs2FAEnabled(true);
    setIs2FAModalOpen(false);
    setVerificationCode("");
    toast({ title: "2FA Enabled!", description: "Two-factor authentication is now active on your account." });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({ title: "Confirmation required", description: "Please type DELETE to confirm account deletion.", variant: "destructive" });
      return;
    }
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDeleting(false);
    toast({ title: "Account scheduled for deletion", description: "Your account will be deleted within 30 days." });
    setIsDeleteModalOpen(false);
    router.push("/"); // replaces navigate("/")
  };

  const handleUpdatePayment = () => {
    toast({ title: "Redirecting to payment portal", description: "Opening secure payment update form..." });
    setIsPaymentModalOpen(false);
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Notification preference updated",
      description: `${key.replace(/([A-Z])/g, " $1").trim()} has been ${
        notifications[key] ? "disabled" : "enabled"
      }.`,
    });
  };

  const invoices = [
    { id: "INV-001", date: "Jan 15, 2024", amount: "$499.00", status: "Paid" },
    { id: "INV-002", date: "Dec 15, 2023", amount: "$499.00", status: "Paid" },
    { id: "INV-003", date: "Nov 15, 2023", amount: "$499.00", status: "Paid" },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        {/* Appearance */}
        <FadeIn>
          <AppearanceSection />
        </FadeIn>

        {/* Manage Admins */}
        <FadeIn>
          <ManageAdminsSection />
        </FadeIn>

        {/* Profile */}
        <FadeIn>
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Profile</h2>
                <p className="text-sm text-muted-foreground">Your personal information</p>
              </div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {/* Full Name */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="pl-10 bg-muted border-border/50"
                  />
                </div>
              </div>
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="pl-10 bg-muted border-border/50"
                  />
                </div>
              </div>
              {/* Company */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Company</label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                    className="pl-10 bg-muted border-border/50"
                  />
                </div>
              </div>
              {/* Timezone */}
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">Timezone</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <select
                    value={formData.timezone}
                    onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
                    className="w-full h-10 pl-10 pr-4 rounded-lg bg-muted border border-border/50 text-foreground"
                  >
                    <option value="America/New_York">Eastern Time (ET)</option>
                    <option value="America/Chicago">Central Time (CT)</option>
                    <option value="America/Denver">Mountain Time (MT)</option>
                    <option value="America/Los_Angeles">Pacific Time (PT)</option>
                    <option value="Europe/London">London (GMT)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
        </FadeIn>

        {/* Billing */}
        <FadeIn>
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Billing</h2>
                <p className="text-sm text-muted-foreground">Manage your subscription and payments</p>
              </div>
            </div>
            <div className="p-4 rounded-xl bg-muted/50 border border-border/30 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">Pro Mode Active</p>
                  <p className="text-sm text-muted-foreground">25 awards • Next billing: Feb 15, 2024</p>
                </div>
                <span className="px-3 py-1 rounded-full bg-yellow-400 text-black text-xs font-bold">
                  PRO
                </span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="secondary" onClick={() => setIsPaymentModalOpen(true)}>
                <CreditCard className="h-4 w-4" /> Update Payment Method
              </Button>
              <Button variant="secondary" onClick={() => setIsInvoicesModalOpen(true)}>
                <FileText className="h-4 w-4" /> View Invoices
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Notifications */}
        <FadeIn>
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Notifications</h2>
                <p className="text-sm text-muted-foreground">Choose what updates you receive</p>
              </div>
            </div>
            <div className="space-y-4">
              {[
                { key: "emailNotifications", label: "Email notifications for new awards" },
                { key: "smsAlerts",          label: "SMS alerts when videos are ready" },
                { key: "weeklyDigest",       label: "Weekly analytics digest" },
                { key: "marketing",          label: "Marketing communications" },
              ].map((item) => (
                <label
                  key={item.key}
                  className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/30 cursor-pointer hover:border-border transition-colors"
                >
                  <span className="text-foreground">{item.label}</span>
                  <button
                    onClick={() => handleNotificationChange(item.key as keyof typeof notifications)}
                    className={`w-12 h-6 rounded-full transition-colors relative ${
                      notifications[item.key as keyof typeof notifications]
                        ? "bg-primary"
                        : "bg-border"
                    }`}
                  >
                    <div
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                        notifications[item.key as keyof typeof notifications]
                          ? "translate-x-7"
                          : "translate-x-1"
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* Security */}
        <FadeIn>
          <div className="p-6 rounded-2xl bg-card border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">Security</h2>
                <p className="text-sm text-muted-foreground">Protect your account</p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setIsPasswordModalOpen(true)}>
                <Key className="h-4 w-4" /> Change Password
              </Button>
              <Button
                variant={is2FAEnabled ? "hero" : "secondary"}
                onClick={() => setIs2FAModalOpen(true)}
              >
                <Smartphone className="h-4 w-4" />
                {is2FAEnabled ? "2FA Enabled" : "Enable 2FA"}
              </Button>
              <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
                <AlertTriangle className="h-4 w-4" /> Delete Account
              </Button>
            </div>
          </div>
        </FadeIn>

        {/* Save */}
        <Button variant="hero" size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-5 w-5" /> Save All Changes</>
          )}
        </Button>
      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}

      {/* Change Password */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" /> Change Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Current Password</Label>
              <Input type="password" value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••" className="bg-muted border-border/50 mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">New Password</Label>
              <Input type="password" value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••" className="bg-muted border-border/50 mt-1" />
            </div>
            <div>
              <Label className="text-muted-foreground">Confirm New Password</Label>
              <Input type="password" value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••" className="bg-muted border-border/50 mt-1" />
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsPasswordModalOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleChangePassword} disabled={isChangingPassword}>
              {isChangingPassword ? <><Loader2 className="h-4 w-4 animate-spin" /> Changing...</> : "Change Password"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2FA */}
      <Dialog open={is2FAModalOpen} onOpenChange={setIs2FAModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-primary" />
              {is2FAEnabled ? "Two-Factor Authentication" : "Enable Two-Factor Authentication"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              {is2FAEnabled
                ? "2FA is currently enabled on your account."
                : "Scan the QR code with your authenticator app, then enter the verification code."}
            </DialogDescription>
          </DialogHeader>
          {!is2FAEnabled && (
            <div className="space-y-4 py-4">
              <div className="flex justify-center">
                <div className="w-48 h-48 bg-white rounded-lg flex items-center justify-center">
                  <div className="text-center text-gray-700">
                    <Smartphone className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm">QR Code</p>
                    <p className="text-xs text-gray-400">(Simulated)</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Verification Code</Label>
                <Input
                  type="text" maxLength={6} value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ""))}
                  placeholder="000000"
                  className="bg-muted border-border/50 mt-1 text-center text-2xl tracking-widest"
                />
              </div>
            </div>
          )}
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIs2FAModalOpen(false)}>Cancel</Button>
            {!is2FAEnabled && (
              <Button variant="hero" onClick={handleEnable2FA} disabled={isVerifying2FA}>
                {isVerifying2FA ? <><Loader2 className="h-4 w-4 animate-spin" /> Verifying...</> : "Enable 2FA"}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Account */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 text-red-500">
              <AlertTriangle className="h-5 w-5" /> Delete Account
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. All your data, videos, and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30">
              <p className="text-sm text-red-500">
                To confirm deletion, type <strong>DELETE</strong> below:
              </p>
            </div>
            <Input
              value={deleteConfirmation}
              onChange={(e) => setDeleteConfirmation(e.target.value)}
              placeholder="Type DELETE to confirm"
              className="bg-muted border-border/50"
            />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleDeleteAccount}
              disabled={isDeleting || deleteConfirmation !== "DELETE"}
            >
              {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : "Delete My Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" /> Update Payment Method
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Current card: •••• •••• •••• 4242
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-sm text-muted-foreground">
                You&apos;ll be redirected to our secure payment portal to update your card details.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleUpdatePayment}>Continue to Payment Portal</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoices */}
      <Dialog open={isInvoicesModalOpen} onOpenChange={setIsInvoicesModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" /> Invoices
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View and download your billing history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/30"
              >
                <div>
                  <p className="font-medium text-foreground">{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">{invoice.amount}</span>
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">
                    {invoice.status}
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toast({ title: "Downloading invoice", description: `${invoice.id} is being downloaded...` })
                    }
                  >
                    <Download className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end">
            <Button variant="secondary" onClick={() => setIsInvoicesModalOpen(false)}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}