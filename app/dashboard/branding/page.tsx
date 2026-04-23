"use client";

import dynamic from "next/dynamic";

const BrandingManager = dynamic(() => import("@/page-components/dashboard/BrandingManager"), {
  ssr: false,
});

export default BrandingManager;
