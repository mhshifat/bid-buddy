/**
 * Define Scope Dialog – lets freelancers define the original project scope
 * with deliverables, exclusions, budget, timeline, and revision limits.
 */

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, X, ShieldPlus } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface DefineScopeDialogProps {
  jobId?: string;
  projectId?: string;
  onCreated?: () => void;
}

export function DefineScopeDialog({ jobId, projectId, onCreated }: DefineScopeDialogProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deliverableInput, setDeliverableInput] = useState("");
  const [deliverables, setDeliverables] = useState<string[]>([]);
  const [exclusionInput, setExclusionInput] = useState("");
  const [exclusions, setExclusions] = useState<string[]>([]);
  const [budget, setBudget] = useState("");
  const [timeline, setTimeline] = useState("");
  const [revisionLimit, setRevisionLimit] = useState("");

  const createMutation = trpc.scope.create.useMutation({
    onSuccess: () => {
      setOpen(false);
      resetForm();
      onCreated?.();
    },
  });

  function resetForm() {
    setTitle("");
    setDescription("");
    setDeliverables([]);
    setExclusions([]);
    setBudget("");
    setTimeline("");
    setRevisionLimit("");
    setDeliverableInput("");
    setExclusionInput("");
  }

  function addDeliverable() {
    const trimmed = deliverableInput.trim();
    if (trimmed && !deliverables.includes(trimmed)) {
      setDeliverables([...deliverables, trimmed]);
      setDeliverableInput("");
    }
  }

  function addExclusion() {
    const trimmed = exclusionInput.trim();
    if (trimmed && !exclusions.includes(trimmed)) {
      setExclusions([...exclusions, trimmed]);
      setExclusionInput("");
    }
  }

  function handleSubmit() {
    createMutation.mutate({
      jobId: jobId ?? undefined,
      projectId: projectId ?? undefined,
      title,
      originalDescription: description,
      deliverables,
      exclusions,
      agreedBudget: budget ? parseFloat(budget) : null,
      agreedTimeline: timeline || null,
      revisionLimit: revisionLimit ? parseInt(revisionLimit, 10) : null,
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <ShieldPlus className="mr-2 h-4 w-4" />
          Define Scope
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Define Project Scope</DialogTitle>
          <DialogDescription>
            Document what was agreed upon. This protects you when the client requests additional work.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Title */}
          <div className="space-y-1.5">
            <Label htmlFor="scope-title">Project Title</Label>
            <Input
              id="scope-title"
              placeholder="e.g. E-commerce Website Redesign"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Scope Description */}
          <div className="space-y-1.5">
            <Label htmlFor="scope-desc">Original Scope Description</Label>
            <Textarea
              id="scope-desc"
              placeholder="Paste the original job description or contract scope here..."
              rows={4}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* Deliverables */}
          <div className="space-y-1.5">
            <Label>Agreed Deliverables</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Homepage design with 3 revisions"
                value={deliverableInput}
                onChange={(e) => setDeliverableInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addDeliverable())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addDeliverable}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {deliverables.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {deliverables.map((d, i) => (
                  <Badge key={i} variant="secondary" className="gap-1">
                    {d}
                    <button
                      onClick={() => setDeliverables(deliverables.filter((_, idx) => idx !== i))}
                      className="ml-1 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Exclusions */}
          <div className="space-y-1.5">
            <Label>Exclusions (what is NOT included)</Label>
            <div className="flex gap-2">
              <Input
                placeholder="e.g. Backend development, SEO optimization"
                value={exclusionInput}
                onChange={(e) => setExclusionInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addExclusion())}
              />
              <Button type="button" variant="outline" size="icon" onClick={addExclusion}>
                <Plus className="h-4 w-4" />
              </Button>
            </div>
            {exclusions.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {exclusions.map((e, i) => (
                  <Badge key={i} variant="destructive" className="gap-1">
                    {e}
                    <button
                      onClick={() => setExclusions(exclusions.filter((_, idx) => idx !== i))}
                      className="ml-1 hover:text-destructive-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Budget, Timeline, Revisions */}
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="scope-budget">Agreed Budget ($)</Label>
              <Input
                id="scope-budget"
                type="number"
                placeholder="5000"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scope-timeline">Timeline</Label>
              <Input
                id="scope-timeline"
                placeholder="e.g. 4 weeks"
                value={timeline}
                onChange={(e) => setTimeline(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="scope-revisions">Revision Limit</Label>
              <Input
                id="scope-revisions"
                type="number"
                placeholder="3"
                value={revisionLimit}
                onChange={(e) => setRevisionLimit(e.target.value)}
              />
            </div>
          </div>

          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={!title || !description || deliverables.length === 0 || createMutation.isPending}
          >
            {createMutation.isPending ? "Saving..." : "Save Scope"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

