import { useCeremony } from "@/contexts/CeremonyContext";
import { Link } from "react-router-dom";
import { Check, Circle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface Step {
  id: keyof ReturnType<typeof useCeremony>["selectedCeremony"]["setupProgress"];
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
  const { selectedCeremony, updateCeremonyProgress } = useCeremony();

  if (!selectedCeremony) return null;

  const progress = selectedCeremony.setupProgress;
  const completedSteps = Object.values(progress).filter(Boolean).length;
  const progressPercentage = (completedSteps / steps.length) * 100;

  return (
    <div className="p-4 rounded-xl bg-card border border-border/50 mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-foreground">Setup Progress</h3>
        <span className="text-xs text-muted-foreground">
          {completedSteps}/{steps.length} steps completed
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full mb-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-500"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>

      {/* Steps */}
      <div className="flex items-center gap-1 overflow-x-auto pb-2">
        {steps.map((step, index) => {
          const isCompleted = progress[step.id];
          const isNext = !isCompleted && (index === 0 || progress[steps[index - 1].id]);

          return (
            <div key={step.id} className="flex items-center">
              <Link
                to={step.href}
                onClick={() => {
                  if (step.id !== "delivery" && !progress[step.id]) {
                    updateCeremonyProgress(step.id, true);
                  }
                }}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap",
                  isCompleted
                    ? "bg-green-500/20 text-green-500"
                    : isNext
                    ? "bg-primary/20 text-primary hover:bg-primary/30"
                    : "bg-muted/50 text-muted-foreground hover:bg-muted"
                )}
              >
                {isCompleted ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Circle className="h-3 w-3" />
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
