"use client";

/**
 * Add Skill Dialog – form for adding a manual skill.
 * Uses react-hook-form + zod per project conventions.
 */

import { useCallback } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc/client";

// ---------------------------------------------------------------------------
// Schema
// ---------------------------------------------------------------------------

const addSkillSchema = z.object({
  name: z.string().min(1, "Skill name is required").max(100),
  category: z.string().max(50).optional(),
  proficiency: z.number().int().min(1).max(10).optional(),
  yearsExperience: z.number().min(0).max(50).optional(),
  isPrimary: z.boolean(),
});

type AddSkillFormData = z.infer<typeof addSkillSchema>;

// ---------------------------------------------------------------------------
// Skill categories
// ---------------------------------------------------------------------------

const SKILL_CATEGORIES = [
  "language",
  "framework",
  "database",
  "devops",
  "design",
  "testing",
  "mobile",
  "cloud",
  "ai/ml",
  "other",
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface AddSkillDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddSkillDialog({ open, onOpenChange }: AddSkillDialogProps) {
  const utils = trpc.useUtils();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm<AddSkillFormData>({
    resolver: zodResolver(addSkillSchema),
    defaultValues: {
      name: "",
      category: undefined,
      proficiency: undefined,
      yearsExperience: undefined,
      isPrimary: false,
    },
  });

  const createMutation = trpc.skill.create.useMutation({
    onSuccess: () => {
      toast.success("Skill added!");
      void utils.skill.list.invalidate();
      reset();
      onOpenChange(false);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to add skill.");
    },
  });

  const onSubmit = useCallback(
    (data: AddSkillFormData) => {
      createMutation.mutate(data);
    },
    [createMutation]
  );

  const proficiencyValue = watch("proficiency");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline">
          <Plus className="mr-2 h-3.5 w-3.5" />
          Add Skill
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add Skill</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="skill-name">Skill Name *</Label>
            <Input
              id="skill-name"
              placeholder="e.g. React, Python, AWS"
              {...register("name")}
            />
            {errors.name && (
              <p className="text-xs text-destructive">{errors.name.message}</p>
            )}
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label>Category</Label>
            <Select
              value={watch("category") ?? ""}
              onValueChange={(val) =>
                setValue("category", val || undefined)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {SKILL_CATEGORIES.map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Proficiency & Years row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="proficiency">
                Proficiency{" "}
                <span className="text-muted-foreground">(1-10)</span>
              </Label>
              <Input
                id="proficiency"
                type="number"
                min={1}
                max={10}
                placeholder="7"
                value={proficiencyValue ?? ""}
                onChange={(e) => {
                  const val = e.target.value;
                  setValue(
                    "proficiency",
                    val ? parseInt(val, 10) : undefined
                  );
                }}
              />
              {errors.proficiency && (
                <p className="text-xs text-destructive">
                  {errors.proficiency.message}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="years">Years of Experience</Label>
              <Input
                id="years"
                type="number"
                min={0}
                max={50}
                step={0.5}
                placeholder="3"
                {...register("yearsExperience", { valueAsNumber: true })}
              />
            </div>
          </div>

          {/* Primary toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="is-primary"
              className="h-4 w-4 rounded border-gray-300"
              {...register("isPrimary")}
            />
            <Label htmlFor="is-primary" className="text-sm font-normal">
              Mark as primary skill (highlighted to AI)
            </Label>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="sm">
                Cancel
              </Button>
            </DialogClose>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending}
            >
              {createMutation.isPending ? (
                <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
              ) : (
                <Plus className="mr-2 h-3.5 w-3.5" />
              )}
              Add Skill
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

