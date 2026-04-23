"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useCeremony } from "@/contexts/CeremonyContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ChevronDown, Plus, Calendar, Sparkles, BookOpen } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function CeremonySelector() {
  const { ceremonies, selectedCeremony, isLoading, selectCeremony, createCeremony, hasCeremonies } = useCeremony();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newCeremonyName, setNewCeremonyName] = useState("");
  const [newCeremonyDate, setNewCeremonyDate] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  const handleCreateCeremony = async () => {
    if (!newCeremonyName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter a ceremony name.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    await createCeremony(newCeremonyName, newCeremonyDate || new Date().toISOString().split("T")[0]);
    setIsCreating(false);
    setIsCreateModalOpen(false);
    setNewCeremonyName("");
    setNewCeremonyDate("");

    toast({
      title: "Ceremony created! 🎉",
      description: `${newCeremonyName} is ready. Next: upload your awards list.`,
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 border border-border/50">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-5 w-40" />
      </div>
    );
  }

  // Empty state - no ceremonies
  if (!hasCeremonies) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-gold/10 border border-border/50 text-center"
      >
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary/10 flex items-center justify-center">
          <Sparkles className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-bold text-foreground mb-2">Welcome to Awardscut 👋</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Create your first ceremony to start generating winner clips in real time.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="hero" onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-5 w-5" />
            Create Ceremony
          </Button>
          <Button variant="secondary" asChild>
            <Link href="/#how-it-works">
              <BookOpen className="h-5 w-5" />
              Learn how it works
            </Link>
          </Button>
        </div>

        {/* Create Ceremony Modal */}
        <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
          <DialogContent className="bg-card border-border">
            <DialogHeader>
              <DialogTitle className="text-foreground">Create New Ceremony</DialogTitle>
              <DialogDescription>
                Set up your ceremony to start uploading awards and generating clips.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div>
                <Label htmlFor="ceremony-name">Ceremony Name *</Label>
                <Input
                  id="ceremony-name"
                  placeholder="e.g., Annual Excellence Awards 2026"
                  value={newCeremonyName}
                  onChange={(e) => setNewCeremonyName(e.target.value)}
                  className="mt-1.5 bg-muted border-border"
                />
              </div>
              <div>
                <Label htmlFor="ceremony-date">Event Date</Label>
                <Input
                  id="ceremony-date"
                  type="date"
                  value={newCeremonyDate}
                  onChange={(e) => setNewCeremonyDate(e.target.value)}
                  className="mt-1.5 bg-muted border-border"
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="hero" onClick={handleCreateCeremony} disabled={isCreating}>
                  {isCreating ? "Creating..." : "Create Ceremony"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </motion.div>
    );
  }

  return (
    <>
      <div className="flex items-center gap-3">
        <span className="text-sm text-muted-foreground">Ceremony:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" className="min-w-[200px] justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                <span className="truncate">{selectedCeremony?.name || "Select ceremony"}</span>
              </div>
              <ChevronDown className="h-4 w-4 ml-2" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-[280px] bg-card border-border">
            {ceremonies.map((ceremony) => (
              <DropdownMenuItem
                key={ceremony.id}
                onClick={() => selectCeremony(ceremony.id)}
                className={`cursor-pointer ${selectedCeremony?.id === ceremony.id ? "bg-muted" : ""}`}
              >
                <div className="flex flex-col gap-0.5">
                  <span className="font-medium">{ceremony.name}</span>
                  <span className="text-xs text-muted-foreground">
                    {ceremony.date} • {ceremony.awardsCount} awards
                  </span>
                </div>
              </DropdownMenuItem>
            ))}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setIsCreateModalOpen(true)} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create New Ceremony
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Create Ceremony Modal */}
      <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Create New Ceremony</DialogTitle>
            <DialogDescription>
              Set up your ceremony to start uploading awards and generating clips.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="ceremony-name-2">Ceremony Name *</Label>
              <Input
                id="ceremony-name-2"
                placeholder="e.g., Annual Excellence Awards 2026"
                value={newCeremonyName}
                onChange={(e) => setNewCeremonyName(e.target.value)}
                className="mt-1.5 bg-muted border-border"
              />
            </div>
            <div>
              <Label htmlFor="ceremony-date-2">Event Date</Label>
              <Input
                id="ceremony-date-2"
                type="date"
                value={newCeremonyDate}
                onChange={(e) => setNewCeremonyDate(e.target.value)}
                className="mt-1.5 bg-muted border-border"
              />
            </div>
            <div className="flex justify-end gap-3 pt-4">
              <Button variant="secondary" onClick={() => setIsCreateModalOpen(false)}>
                Cancel
              </Button>
              <Button variant="hero" onClick={handleCreateCeremony} disabled={isCreating}>
                {isCreating ? "Creating..." : "Create Ceremony"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
