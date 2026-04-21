"use client";

import { useCeremony } from "@/contexts/CeremonyContext";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Check, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: keyof NonNullable<ReturnType<typeof useCeremony>["selectedCeremony"]>["setupProgress"];
  label: string;
  shortLabel: string;
  href: string;
}

const steps: Step[] = [
  { id: "ceremony", label: "Create Ceremony", shortLabel: "Ceremony", href: "/dashboard" },
  { id: "awards", label: "Upload Awards List", shortLabel: "Awards", href: "/dashboard/awards" },
  { id: "template", label: "Select Template", shortLabel: "Template", href: "/dashboard/templates" },
  { id: "branding", label: "Upload Branding", shortLabel: "Branding", href: "/dashboard/branding" },
  { id: "livestream", label: "Connect Livestream", shortLabel: "Stream", href: "/dashboard/livestream" },
  { id: "clips", label: "Generate Clips", shortLabel: "Clips", href: "/dashboard/clip-generation" },
  { id: "delivery", label: "Deliver & Share", shortLabel: "Deliver", href: "/dashboard/leads" },
];

export function SetupStepper() {
  const { selectedCeremony } = useCeremony();
  const pathname = usePathname();

  if (!selectedCeremony) return null;

  const progress = selectedCeremony.setupProgress;

  return (
    <div className="w-full overflow-x-auto">
      <div className="flex items-center min-w-max px-1 py-2">
        {steps.map((step, index) => {
          const isCompleted = progress[step.id];
          const isCurrent = pathname === step.href;
          return (
            <div key={step.id} className="flex items-center">
              <Link
                href={step.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all",
                  isCurrent
                    ? "bg-primary/10 text-primary"
                    : isCompleted
                    ? "text-foreground hover:bg-muted"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3.5 w-3.5 text-primary" />
                ) : (
                  <Circle className={cn("h-3.5 w-3.5", isCurrent ? "text-primary" : "text-muted-foreground")} />
                )}
                <span className="hidden sm:inline">{step.label}</span>
                <span className="sm:hidden">{step.shortLabel}</span>
              </Link>
              {index < steps.length - 1 && (
                <ArrowRight className="h-3 w-3 text-muted-foreground mx-1 flex-shrink-0" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
