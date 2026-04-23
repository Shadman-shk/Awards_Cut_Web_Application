"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { AppearanceSection } from "@/components/dashboard/AppearanceSection";
import { ManageAdminsSection } from "@/components/dashboard/ManageAdminsSection";
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
  Check,
  X
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export default function Settings() {
  const router = useRouter();
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

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsSaving(false);
    toast({
      title: "Settings saved!",
      description: "Your preferences have been updated.",
    });
  };

  const handleChangePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      toast({
        title: "Missing fields",
        description: "Please fill in all password fields.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: "New password and confirmation must match.",
        variant: "destructive",
      });
      return;
    }
    
    if (passwordForm.newPassword.length < 8) {
      toast({
        title: "Password too short",
        description: "Password must be at least 8 characters.",
        variant: "destructive",
      });
      return;
    }
    
    setIsChangingPassword(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsChangingPassword(false);
    setIsPasswordModalOpen(false);
    setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    
    toast({
      title: "Password changed!",
      description: "Your password has been updated successfully.",
    });
  };

  const handleEnable2FA = async () => {
    if (verificationCode.length !== 6) {
      toast({
        title: "Invalid code",
        description: "Please enter a 6-digit verification code.",
        variant: "destructive",
      });
      return;
    }
    
    setIsVerifying2FA(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsVerifying2FA(false);
    setIs2FAEnabled(true);
    setIs2FAModalOpen(false);
    setVerificationCode("");
    
    toast({
      title: "2FA Enabled!",
      description: "Two-factor authentication is now active on your account.",
    });
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmation !== "DELETE") {
      toast({
        title: "Confirmation required",
        description: "Please type DELETE to confirm account deletion.",
        variant: "destructive",
      });
      return;
    }
    
    setIsDeleting(true);
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsDeleting(false);
    
    toast({
      title: "Account scheduled for deletion",
      description: "Your account will be deleted within 30 days.",
    });
    
    setIsDeleteModalOpen(false);
    router.push("/");
  };

  const handleUpdatePayment = () => {
    toast({
      title: "Redirecting to payment portal",
      description: "Opening secure payment update form...",
    });
    setIsPaymentModalOpen(false);
    // In production, this would redirect to Stripe customer portal
  };

  const handleNotificationChange = (key: keyof typeof notifications) => {
    setNotifications(prev => ({ ...prev, [key]: !prev[key] }));
    toast({
      title: "Notification preference updated",
      description: `${key.replace(/([A-Z])/g, ' $1').trim()} has been ${notifications[key] ? 'disabled' : 'enabled'}.`,
    });
  };

  // Mock invoices
  const invoices = [
    { id: "INV-001", date: "Jan 15, 2024", amount: "$499.00", status: "Paid" },
    { id: "INV-002", date: "Dec 15, 2023", amount: "$499.00", status: "Paid" },
    { id: "INV-003", date: "Nov 15, 2023", amount: "$499.00", status: "Paid" },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account and preferences.</p>
        </div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <AppearanceSection />
        </motion.div>

        {/* Manage Admins Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.05 }}
        >
          <ManageAdminsSection />
        </motion.div>

        {/* Profile Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="p-6 rounded-2xl bg-card border border-border/50"
        >
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
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Full Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="pl-10 bg-muted border-border/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Email
              </label>
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
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Company
              </label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  value={formData.company}
                  onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  className="pl-10 bg-muted border-border/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                Timezone
              </label>
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
        </motion.div>

        {/* Billing */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="p-6 rounded-2xl bg-card border border-border/50"
        >
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
              <span className="px-3 py-1 rounded-full bg-gradient-gold text-charcoal text-xs font-bold">
                PRO
              </span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(true)}>
              <CreditCard className="h-4 w-4" />
              Update Payment Method
            </Button>
            <Button variant="secondary" onClick={() => setIsInvoicesModalOpen(true)}>
              <FileText className="h-4 w-4" />
              View Invoices
            </Button>
          </div>
        </motion.div>

        {/* Notifications */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="p-6 rounded-2xl bg-card border border-border/50"
        >
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
              { key: "smsAlerts", label: "SMS alerts when videos are ready" },
              { key: "weeklyDigest", label: "Weekly analytics digest" },
              { key: "marketing", label: "Marketing communications" },
            ].map((item) => (
              <label 
                key={item.key} 
                className="flex items-center justify-between p-4 rounded-xl bg-muted/50 border border-border/30 cursor-pointer hover:border-border transition-colors"
              >
                <span className="text-foreground">{item.label}</span>
                <button
                  onClick={() => handleNotificationChange(item.key as keyof typeof notifications)}
                  className={`w-12 h-6 rounded-full transition-colors relative ${
                    notifications[item.key as keyof typeof notifications] ? 'bg-primary' : 'bg-border'
                  }`}
                >
                  <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                    notifications[item.key as keyof typeof notifications] ? 'translate-x-7' : 'translate-x-1'
                  }`} />
                </button>
              </label>
            ))}
          </div>
        </motion.div>

        {/* Security */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="p-6 rounded-2xl bg-card border border-border/50"
        >
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
              <Key className="h-4 w-4" />
              Change Password
            </Button>
            <Button 
              variant={is2FAEnabled ? "hero" : "secondary"} 
              onClick={() => setIs2FAModalOpen(true)}
            >
              <Smartphone className="h-4 w-4" />
              {is2FAEnabled ? "2FA Enabled" : "Enable 2FA"}
            </Button>
            <Button variant="destructive" onClick={() => setIsDeleteModalOpen(true)}>
              <AlertTriangle className="h-4 w-4" />
              Delete Account
            </Button>
          </div>
        </motion.div>

        {/* Save Button */}
        <Button variant="hero" size="lg" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <><Loader2 className="h-5 w-5 animate-spin" /> Saving...</>
          ) : (
            <><Save className="h-5 w-5" /> Save All Changes</>
          )}
        </Button>
      </div>

      {/* Change Password Modal */}
      <Dialog open={isPasswordModalOpen} onOpenChange={setIsPasswordModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Key className="h-5 w-5 text-primary" />
              Change Password
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Enter your current password and choose a new one.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <Label className="text-muted-foreground">Current Password</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                placeholder="••••••••"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">New Password</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                placeholder="••••••••"
                className="bg-muted border-border/50 mt-1"
              />
            </div>
            <div>
              <Label className="text-muted-foreground">Confirm New Password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                placeholder="••••••••"
                className="bg-muted border-border/50 mt-1"
              />
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

      {/* 2FA Modal */}
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
                  <div className="text-center text-charcoal">
                    <Smartphone className="h-12 w-12 mx-auto mb-2 text-muted-foreground" />
                    <p className="text-sm">QR Code</p>
                    <p className="text-xs text-muted-foreground">(Simulated)</p>
                  </div>
                </div>
              </div>
              <div>
                <Label className="text-muted-foreground">Verification Code</Label>
                <Input
                  type="text"
                  maxLength={6}
                  value={verificationCode}
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

      {/* Delete Account Modal */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Delete Account
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              This action cannot be undone. All your data, videos, and settings will be permanently deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
              <p className="text-sm text-destructive">
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
            <Button variant="destructive" onClick={handleDeleteAccount} disabled={isDeleting || deleteConfirmation !== "DELETE"}>
              {isDeleting ? <><Loader2 className="h-4 w-4 animate-spin" /> Deleting...</> : "Delete My Account"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Payment Method Modal */}
      <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
        <DialogContent className="max-w-md bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-primary" />
              Update Payment Method
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              Current card: •••• •••• •••• 4242
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-muted/50 border border-border/30">
              <p className="text-sm text-muted-foreground">
                You'll be redirected to our secure payment portal to update your card details.
              </p>
            </div>
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={() => setIsPaymentModalOpen(false)}>Cancel</Button>
            <Button variant="hero" onClick={handleUpdatePayment}>
              Continue to Payment Portal
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Invoices Modal */}
      <Dialog open={isInvoicesModalOpen} onOpenChange={setIsInvoicesModalOpen}>
        <DialogContent className="max-w-lg bg-card border-border/50">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Invoices
            </DialogTitle>
            <DialogDescription className="text-muted-foreground">
              View and download your billing history.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {invoices.map((invoice) => (
              <div key={invoice.id} className="flex items-center justify-between p-4 rounded-lg bg-muted/50 border border-border/30">
                <div>
                  <p className="font-medium text-foreground">{invoice.id}</p>
                  <p className="text-sm text-muted-foreground">{invoice.date}</p>
                </div>
                <div className="flex items-center gap-4">
                  <span className="font-medium text-foreground">{invoice.amount}</span>
                  <span className="px-2 py-1 rounded-full bg-green-500/20 text-green-500 text-xs font-medium">{invoice.status}</span>
                  <Button variant="ghost" size="sm" onClick={() => {
                    toast({ title: "Downloading invoice", description: `${invoice.id} is being downloaded...` });
                  }}>
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
