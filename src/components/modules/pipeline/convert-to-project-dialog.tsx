"use client";

/**
 * Convert to Project Dialog — polished dialog for creating a project from
 * an accepted job with clean form layout, geometric accents, and micro-interactions.
 */

import { useState, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Rocket, DollarSign, Clock, CalendarDays, User2 } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Decorative header SVG
// ---------------------------------------------------------------------------

function DialogHeaderSvg() {
  return (
    <svg
      className="absolute right-0 top-0 h-24 w-24 text-primary/5 pointer-events-none"
      viewBox="0 0 100 100"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="80" cy="20" r="40" stroke="currentColor" strokeWidth="0.8" className="animate-spin-slow" />
      <circle cx="80" cy="20" r="25" stroke="currentColor" strokeWidth="0.5" opacity="0.5" style={{ animationDirection: "reverse" }} />
      <polygon points="80,5 85,15 75,15" fill="currentColor" opacity="0.1" />
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface ConvertToProjectDialogProps {
  jobId: string;
  jobTitle: string;
  jobDescription: string;
  budgetMax?: number | null;
  hourlyRate?: number | null;
  proposalId?: string | null;
  children: React.ReactNode;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ConvertToProjectDialog({
  jobId,
  jobTitle,
  jobDescription,
  budgetMax,
  hourlyRate,
  proposalId,
  children,
}: ConvertToProjectDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState(jobTitle);
  const [description, setDescription] = useState(jobDescription);
  const [budget, setBudget] = useState(budgetMax?.toString() ?? "");
  const [rate, setRate] = useState(hourlyRate?.toString() ?? "");
  const [estimatedHours, setEstimatedHours] = useState("");
  const [clientId, setClientId] = useState("");
  const [startDate, setStartDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [deadline, setDeadline] = useState("");

  const { data: clients } = trpc.clientManagement.list.useQuery(
    { page: 1, pageSize: 100 },
    { enabled: open }
  );

  const utils = trpc.useUtils();

  const convertMutation = trpc.pipeline.convertToProject.useMutation({
    onSuccess: (data) => {
      toast.success("Project created!", {
        description: `"${data.projectTitle}" is now active.`,
      });
      setOpen(false);
      void utils.pipeline.overview.invalidate();
      void utils.pipeline.stats.invalidate();
      void utils.pipeline.jobTimeline.invalidate({ jobId });
    },
    onError: (err) => {
      toast.error("Failed to create project", { description: err.message });
    },
  });

  const handleSubmit = useCallback(() => {
    if (!clientId) {
      toast.error("Please select a client");
      return;
    }

    convertMutation.mutate({
      jobId,
      clientId,
      proposalId: proposalId ?? undefined,
      title,
      description,
      budget: budget ? parseFloat(budget) : undefined,
      hourlyRate: rate ? parseFloat(rate) : undefined,
      estimatedHours: estimatedHours ? parseFloat(estimatedHours) : undefined,
      startDate: startDate || undefined,
      deadline: deadline || undefined,
    });
  }, [
    jobId,
    clientId,
    proposalId,
    title,
    description,
    budget,
    rate,
    estimatedHours,
    startDate,
    deadline,
    convertMutation,
  ]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[540px] overflow-hidden rounded-2xl border-border/50 p-0">
        {/* Header with gradient accent */}
        <div className="relative border-b bg-gradient-to-br from-card to-primary/[0.02] px-6 pt-6 pb-4">
          <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-violet-500 via-primary to-emerald-500 opacity-60" />
          <DialogHeaderSvg />
          <DialogHeader className="relative z-10">
            <DialogTitle className="flex items-center gap-2.5 text-lg">
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-primary/10">
                <Rocket className="h-4 w-4 text-primary" />
              </div>
              Convert to Project
            </DialogTitle>
            <DialogDescription className="text-xs">
              Create an active project from this accepted job. Link it to a client to track delivery.
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Form */}
        <div className="px-6 py-5 space-y-5">
          {/* Project Title */}
          <div className="space-y-1.5">
            <Label htmlFor="conv-title" className="text-xs font-medium text-muted-foreground">
              Project Title
            </Label>
            <Input
              id="conv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title..."
              className="rounded-xl border-border/50 focus-visible:ring-primary/30"
            />
          </div>

          {/* Client Select */}
          <div className="space-y-1.5">
            <Label htmlFor="conv-client" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <User2 className="h-3 w-3" />
              Client <span className="text-destructive">*</span>
            </Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="conv-client" className="rounded-xl border-border/50">
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                {clients?.items.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ""}
                  </SelectItem>
                ))}
                {(!clients || clients.items.length === 0) && (
                  <SelectItem value="__none" disabled>
                    No clients found — create one first
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Budget + Rate row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="conv-budget" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" />
                Budget
              </Label>
              <Input
                id="conv-budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
                className="rounded-xl border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conv-rate" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="h-3 w-3" />
                Hourly Rate
              </Label>
              <Input
                id="conv-rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0"
                className="rounded-xl border-border/50"
              />
            </div>
          </div>

          {/* Hours + Start date row */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="conv-hours" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <Clock className="h-3 w-3" />
                Est. Hours
              </Label>
              <Input
                id="conv-hours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
                className="rounded-xl border-border/50"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="conv-start" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
                <CalendarDays className="h-3 w-3" />
                Start Date
              </Label>
              <Input
                id="conv-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-xl border-border/50"
              />
            </div>
          </div>

          {/* Deadline */}
          <div className="space-y-1.5">
            <Label htmlFor="conv-deadline" className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <CalendarDays className="h-3 w-3" />
              Deadline
            </Label>
            <Input
              id="conv-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
              className="rounded-xl border-border/50"
            />
          </div>
        </div>

        {/* Footer */}
        <DialogFooter className="border-t bg-muted/20 px-6 py-4">
          <Button
            variant="outline"
            onClick={() => setOpen(false)}
            className="rounded-xl"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={convertMutation.isPending || !clientId}
            className="rounded-xl gap-2 shadow-sm"
          >
            {convertMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="h-4 w-4" />
            )}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
