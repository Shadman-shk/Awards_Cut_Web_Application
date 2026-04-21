"use client";

import { Suspense } from "react";
import Signup from "@/page-components/Signup";

export const dynamic = "force-dynamic";

export default function SignupPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-charcoal flex items-center justify-center">Loading...</div>}>
      <Signup />
    </Suspense>
  );
}
