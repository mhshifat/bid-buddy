"use client";

/**
 * Skills Manager – interactive table for managing all skills.
 *
 * Features:
 *   - View all skills grouped by source (GitHub, Manual, etc.)
 *   - Toggle primary status (star icon)
 *   - Inline edit proficiency (1–10) and years of experience
 *   - Delete skills
 *   - Add new manual skills via dialog
 *   - Filter by source
 */

import { useCallback, useMemo, useState } from "react";
import {
  Star,
  Trash2,
  Loader2,
  GitBranch,
  PenLine,
  Zap,
  Briefcase,
  Search,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { trpc } from "@/lib/trpc/client";
import { AddSkillDialog } from "./add-skill-dialog";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface SkillItem {
  id: string;
  name: string;
  category: string | null;
  proficiency: number | null;
  yearsExperience: number | null;
  source: string;
  isPrimary: boolean;
}

type SourceFilter = "ALL" | "GITHUB" | "MANUAL" | "UPWORK" | "AI_DETECTED";

// ---------------------------------------------------------------------------
// Source badge config
// ---------------------------------------------------------------------------

const SOURCE_CONFIG: Record<
  string,
  { icon: React.ReactNode; label: string; className: string }
> = {
  GITHUB: {
    icon: <GitBranch className="h-3 w-3" />,
    label: "GitHub",
    className: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-800 dark:bg-blue-950 dark:text-blue-400",
  },
  MANUAL: {
    icon: <PenLine className="h-3 w-3" />,
    label: "Manual",
    className: "border-gray-200 bg-gray-50 text-gray-700 dark:border-gray-800 dark:bg-gray-950 dark:text-gray-400",
  },
  UPWORK: {
    icon: <Briefcase className="h-3 w-3" />,
    label: "Upwork",
    className: "border-green-200 bg-green-50 text-green-700 dark:border-green-800 dark:bg-green-950 dark:text-green-400",
  },
  AI_DETECTED: {
    icon: <Zap className="h-3 w-3" />,
    label: "AI",
    className: "border-purple-200 bg-purple-50 text-purple-700 dark:border-purple-800 dark:bg-purple-950 dark:text-purple-400",
  },
};

// ---------------------------------------------------------------------------
// Proficiency labels
// ---------------------------------------------------------------------------

function getProficiencyLabel(level: number): string {
  if (level <= 2) return "Beginner";
  if (level <= 4) return "Elementary";
  if (level <= 6) return "Intermediate";
  if (level <= 8) return "Advanced";
  return "Expert";
}

function getProficiencyColor(level: number): string {
  if (level <= 2) return "text-red-500";
  if (level <= 4) return "text-orange-500";
  if (level <= 6) return "text-amber-500";
  if (level <= 8) return "text-emerald-500";
  return "text-green-600";
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function SkillsManager() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("ALL");
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const utils = trpc.useUtils();
  const { data: skills, isLoading } = trpc.skill.list.useQuery();

  // Filter skills
  const filteredSkills = useMemo(() => {
    if (!skills) return [];

    return skills.filter((s) => {
      const matchesSearch =
        !searchQuery ||
        s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (s.category ?? "").toLowerCase().includes(searchQuery.toLowerCase());

      const matchesSource =
        sourceFilter === "ALL" || s.source === sourceFilter;

      return matchesSearch && matchesSource;
    });
  }, [skills, searchQuery, sourceFilter]);

  // Stats
  const stats = useMemo(() => {
    if (!skills) return { total: 0, primary: 0, github: 0, manual: 0 };
    return {
      total: skills.length,
      primary: skills.filter((s) => s.isPrimary).length,
      github: skills.filter((s) => s.source === "GITHUB").length,
      manual: skills.filter((s) => s.source === "MANUAL").length,
    };
  }, [skills]);

  // Loading skeleton
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Skills Manager</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const isEmpty = !skills || skills.length === 0;

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="flex items-center gap-2 text-base">
            <SlidersHorizontal className="h-4 w-4" />
            Skills Manager
          </CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {stats.total} total · {stats.primary} primary ·{" "}
            {stats.github} from GitHub · {stats.manual} manual
          </p>
        </div>
        <AddSkillDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
        />
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search + Filter */}
        {!isEmpty && (
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search skills…"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <Select
              value={sourceFilter}
              onValueChange={(val) => setSourceFilter(val as SourceFilter)}
            >
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Sources</SelectItem>
                <SelectItem value="GITHUB">GitHub</SelectItem>
                <SelectItem value="MANUAL">Manual</SelectItem>
                <SelectItem value="UPWORK">Upwork</SelectItem>
                <SelectItem value="AI_DETECTED">AI Detected</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}

        {/* Empty state */}
        {isEmpty && (
          <div className="flex flex-col items-center py-10 text-center">
            <SlidersHorizontal className="h-10 w-10 text-muted-foreground" />
            <h3 className="mt-3 text-sm font-semibold">No skills yet</h3>
            <p className="mt-1 text-xs text-muted-foreground">
              Connect GitHub to auto-detect skills, or add them manually.
            </p>
          </div>
        )}

        {/* No results for filter */}
        {!isEmpty && filteredSkills.length === 0 && (
          <p className="py-6 text-center text-sm text-muted-foreground">
            No skills match your filters.
          </p>
        )}

        {/* Skills list */}
        <div className="space-y-1.5">
          {filteredSkills.map((skill) => (
            <SkillRow key={skill.id} skill={skill} utils={utils} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Skill Row
// ---------------------------------------------------------------------------

function SkillRow({
  skill,
  utils,
}: {
  skill: SkillItem;
  utils: ReturnType<typeof trpc.useUtils>;
}) {
  const [isEditingProficiency, setIsEditingProficiency] = useState(false);
  const [isEditingYears, setIsEditingYears] = useState(false);
  const [profValue, setProfValue] = useState(String(skill.proficiency ?? ""));
  const [yearsValue, setYearsValue] = useState(
    String(skill.yearsExperience ?? "")
  );

  const updateMutation = trpc.skill.update.useMutation({
    onSuccess: () => {
      void utils.skill.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update skill.");
    },
  });

  const deleteMutation = trpc.skill.delete.useMutation({
    onSuccess: () => {
      toast.success(`"${skill.name}" removed.`);
      void utils.skill.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to delete skill.");
    },
  });

  const handleTogglePrimary = useCallback(() => {
    updateMutation.mutate({
      id: skill.id,
      isPrimary: !skill.isPrimary,
    });
  }, [skill.id, skill.isPrimary, updateMutation]);

  const handleSaveProficiency = useCallback(() => {
    const num = parseInt(profValue, 10);
    if (isNaN(num) || num < 1 || num > 10) {
      toast.error("Proficiency must be between 1 and 10.");
      return;
    }
    updateMutation.mutate({ id: skill.id, proficiency: num });
    setIsEditingProficiency(false);
  }, [skill.id, profValue, updateMutation]);

  const handleSaveYears = useCallback(() => {
    const num = parseFloat(yearsValue);
    if (isNaN(num) || num < 0 || num > 50) {
      toast.error("Years must be between 0 and 50.");
      return;
    }
    updateMutation.mutate({ id: skill.id, yearsExperience: num });
    setIsEditingYears(false);
  }, [skill.id, yearsValue, updateMutation]);

  const handleDelete = useCallback(() => {
    deleteMutation.mutate({ id: skill.id });
  }, [skill.id, deleteMutation]);

  const sourceConf = SOURCE_CONFIG[skill.source] ?? SOURCE_CONFIG.MANUAL;
  const isLoading = updateMutation.isPending || deleteMutation.isPending;

  return (
    <div className="group flex items-center gap-3 rounded-lg border px-3 py-2.5 transition-colors hover:bg-muted/50">
      {/* Primary toggle */}
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            onClick={handleTogglePrimary}
            disabled={isLoading}
            className="shrink-0"
          >
            <Star
              className={`h-4 w-4 transition-colors ${
                skill.isPrimary
                  ? "fill-amber-400 text-amber-400"
                  : "text-muted-foreground hover:text-amber-400"
              }`}
            />
          </button>
        </TooltipTrigger>
        <TooltipContent>
          {skill.isPrimary ? "Remove from primary" : "Mark as primary (used by AI)"}
        </TooltipContent>
      </Tooltip>

      {/* Name + Source */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="truncate text-sm font-medium">{skill.name}</span>
          <Badge
            variant="outline"
            className={`shrink-0 text-[10px] ${sourceConf.className}`}
          >
            {sourceConf.icon}
            <span className="ml-1">{sourceConf.label}</span>
          </Badge>
          {skill.category && (
            <span className="hidden text-xs text-muted-foreground sm:inline">
              {skill.category}
            </span>
          )}
        </div>
      </div>

      {/* Proficiency */}
      <div className="hidden w-24 shrink-0 sm:block">
        {isEditingProficiency ? (
          <Input
            type="number"
            min={1}
            max={10}
            className="h-7 w-16 text-xs"
            value={profValue}
            onChange={(e) => setProfValue(e.target.value)}
            onBlur={handleSaveProficiency}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveProficiency();
              if (e.key === "Escape") setIsEditingProficiency(false);
            }}
            autoFocus
          />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setProfValue(String(skill.proficiency ?? ""));
                  setIsEditingProficiency(true);
                }}
                className="flex items-center gap-1 rounded px-1.5 py-0.5 text-xs hover:bg-muted"
              >
                {skill.proficiency ? (
                  <>
                    <span className={`font-semibold ${getProficiencyColor(skill.proficiency)}`}>
                      {skill.proficiency}/10
                    </span>
                    <span className="hidden text-muted-foreground lg:inline">
                      {getProficiencyLabel(skill.proficiency)}
                    </span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Set level</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to set proficiency (1-10)</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Years */}
      <div className="hidden w-20 shrink-0 md:block">
        {isEditingYears ? (
          <Input
            type="number"
            min={0}
            max={50}
            step={0.5}
            className="h-7 w-16 text-xs"
            value={yearsValue}
            onChange={(e) => setYearsValue(e.target.value)}
            onBlur={handleSaveYears}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSaveYears();
              if (e.key === "Escape") setIsEditingYears(false);
            }}
            autoFocus
          />
        ) : (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={() => {
                  setYearsValue(String(skill.yearsExperience ?? ""));
                  setIsEditingYears(true);
                }}
                className="rounded px-1.5 py-0.5 text-xs hover:bg-muted"
              >
                {skill.yearsExperience !== null ? (
                  <span>{skill.yearsExperience}y</span>
                ) : (
                  <span className="text-muted-foreground">Set yrs</span>
                )}
              </button>
            </TooltipTrigger>
            <TooltipContent>Click to set years of experience</TooltipContent>
          </Tooltip>
        )}
      </div>

      {/* Delete */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {deleteMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5 text-destructive" />
            )}
          </Button>
        </TooltipTrigger>
        <TooltipContent>Delete skill</TooltipContent>
      </Tooltip>
    </div>
  );
}

