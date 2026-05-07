import { useDemoMode } from "@/contexts/DemoModeContext";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sparkles, Database, Loader2, FlaskConical } from "lucide-react";

export function DemoModeToggle() {
  const { state, isMock, isSeeded, setMock, seedSampleData, isSeeding } = useDemoMode();

  const active = isMock || isSeeded;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant={active ? "default" : "outline"}
          size="sm"
          className={active ? "bg-primary/15 border-primary/40 text-primary hover:bg-primary/20" : ""}
        >
          {isSeeding ? (
            <Loader2 className="h-4 w-4 animate-spin mr-2" />
          ) : (
            <Sparkles className="h-4 w-4 mr-2" />
          )}
          Demo Mode
          {active && (
            <span className="ml-2 text-[10px] uppercase tracking-wider opacity-80">
              {isMock ? "Mock" : "Seeded"}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Demo Mode</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <div className="px-2 py-2">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 text-sm font-medium">
                <FlaskConical className="h-4 w-4 text-primary" />
                Mock Mode
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Frontend-only sample data. No backend writes.
              </p>
            </div>
            <Switch checked={isMock} onCheckedChange={setMock} />
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={(e) => { e.preventDefault(); void seedSampleData(); }}
          disabled={isSeeding}
          className="cursor-pointer flex-col items-start gap-1 py-2"
        >
          <div className="flex items-center gap-2 text-sm font-medium">
            <Database className="h-4 w-4 text-primary" />
            Load Sample Data
          </div>
          <p className="text-xs text-muted-foreground">
            Seed 8 awards, recipients, and demo clips into your workspace.
          </p>
        </DropdownMenuItem>
        {state !== "off" && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => { setMock(false); localStorage.removeItem("awardscut-demo-mode"); window.location.reload(); }}
              className="text-muted-foreground"
            >
              Turn off Demo Mode
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
