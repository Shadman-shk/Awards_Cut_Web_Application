"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Sun, Moon, Monitor, Check } from "lucide-react";

export function AppearanceSection() {
  const { theme, setTheme } = useTheme();

  const handleThemeChange = (newTheme: string) => {
    setTheme(newTheme);
    toast({
      title: "Theme updated",
      description: `Switched to ${newTheme === "system" ? "system" : newTheme} mode.`,
    });
  };

  const themes = [
    { id: "dark", label: "Dark", icon: Moon, description: "Dark background with light text" },
    { id: "light", label: "Light", icon: Sun, description: "Light background with dark text" },
    { id: "system", label: "System", icon: Monitor, description: "Follow system preference" },
  ];

  return (
    <div className="p-6 rounded-2xl bg-card border border-border/50">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
          {theme === "light" ? (
            <Sun className="h-5 w-5 text-primary" />
          ) : (
            <Moon className="h-5 w-5 text-primary" />
          )}
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">Appearance</h2>
          <p className="text-sm text-muted-foreground">Customize how Awardscut looks</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {themes.map((t) => (
          <Button
            key={t.id}
            variant={theme === t.id ? "hero" : "secondary"}
            className="h-auto py-4 flex-col gap-2 relative"
            onClick={() => handleThemeChange(t.id)}
          >
            {theme === t.id && (
              <div className="absolute top-2 right-2">
                <Check className="h-4 w-4" />
              </div>
            )}
            <t.icon className="h-6 w-6" />
            <span className="font-bold">{t.label}</span>
            <span className="text-xs opacity-75">{t.description}</span>
          </Button>
        ))}
      </div>

      <div className="mt-4 p-4 rounded-xl bg-muted/50 border border-border/30">
        <p className="text-sm text-muted-foreground">
          <span className="text-foreground font-medium">Current theme:</span>{" "}
          {theme === "system" ? "System (auto)" : theme === "dark" ? "Dark mode" : "Light mode"}
        </p>
      </div>
    </div>
  );
}
