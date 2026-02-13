"use client";

/**
 * Convert to Project Dialog — creates a project from an accepted job.
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
import { Loader2, Rocket } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

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
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Rocket className="h-5 w-5" />
            Convert to Project
          </DialogTitle>
          <DialogDescription>
            Create an active project from this accepted job. Link it to a client to track delivery.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="conv-title">Project Title</Label>
            <Input
              id="conv-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Project title..."
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="conv-client">Client *</Label>
            <Select value={clientId} onValueChange={setClientId}>
              <SelectTrigger id="conv-client">
                <SelectValue placeholder="Select client..." />
              </SelectTrigger>
              <SelectContent>
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

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="conv-budget">Budget ($)</Label>
              <Input
                id="conv-budget"
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conv-rate">Hourly Rate ($)</Label>
              <Input
                id="conv-rate"
                type="number"
                value={rate}
                onChange={(e) => setRate(e.target.value)}
                placeholder="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="conv-hours">Est. Hours</Label>
              <Input
                id="conv-hours"
                type="number"
                value={estimatedHours}
                onChange={(e) => setEstimatedHours(e.target.value)}
                placeholder="0"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="conv-start">Start Date</Label>
              <Input
                id="conv-start"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="conv-deadline">Deadline</Label>
            <Input
              id="conv-deadline"
              type="date"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={convertMutation.isPending || !clientId}
          >
            {convertMutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Rocket className="mr-2 h-4 w-4" />
            )}
            Create Project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

