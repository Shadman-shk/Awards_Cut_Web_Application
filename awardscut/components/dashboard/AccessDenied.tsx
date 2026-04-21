"use client";

import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Mail, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { toast } from "@/hooks/use-toast";
import { useState } from "react";

interface AccessDeniedProps {
  title?: string;
  description?: string;
  requiredRole?: string;
  showRequestAccess?: boolean;
}

export function AccessDenied({
  title = "Access Denied",
  description = "You don't have permission to access this page.",
  requiredRole,
  showRequestAccess = true,
}: AccessDeniedProps) {
  const [isRequesting, setIsRequesting] = useState(false);

  const handleRequestAccess = async () => {
    setIsRequesting(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsRequesting(false);
    toast({
      title: "Access Request Sent",
      description: "The workspace owner has been notified of your request.",
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center min-h-[400px] text-center p-8"
    >
      <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-6">
        <ShieldAlert className="h-8 w-8 text-destructive" />
      </div>
      <h2 className="text-2xl font-bold text-foreground mb-2">{title}</h2>
      <p className="text-muted-foreground max-w-md mb-2">{description}</p>
      {requiredRole && (
        <p className="text-sm text-muted-foreground mb-6">
          Required role: <span className="text-primary font-medium capitalize">{requiredRole}</span> or higher
        </p>
      )}
      <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
        <Button variant="secondary" asChild>
          <Link href="/dashboard">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
        </Button>
        {showRequestAccess && (
          <Button variant="hero" onClick={handleRequestAccess} disabled={isRequesting}>
            {isRequesting ? (
              <><span className="animate-spin">⏳</span> Sending Request...</>
            ) : (
              <><Mail className="h-4 w-4" /> Request Access</>
            )}
          </Button>
        )}
      </div>
    </motion.div>
  );
}
