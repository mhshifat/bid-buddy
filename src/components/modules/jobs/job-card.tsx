"use client";

/**
 * Job Card — bento-style card with glass overlay, hover gradient reveal,
 * animated micro-interactions, and AI insight badges.
 */

import { useCallback } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MapPin,
  Clock,
  Zap,
  Star,
  DollarSign,
  ExternalLink,
  AlertTriangle,
  Copy as CopyIcon,
  Shield,
  TrendingUp,
  Target,
  ChevronRight,
} from "lucide-react";
import { JobStatusBadge } from "./job-status-badge";

interface JobAnalysis {
  fitScore: number | null;
  fakeProbability: number | null;
  winProbability: number | null;
  recommendation: string | null;
}

interface JobCardProps {
  id: string;
  title: string;
  description: string;
  jobType: string;
  experienceLevel: string | null;
  budgetMin: number | null;
  budgetMax: number | null;
  hourlyRateMin: number | null;
  hourlyRateMax: number | null;
  estimatedDuration: string | null;
  jobUrl: string;
  clientCountry: string | null;
  clientRating: number | null;
  clientTotalSpent: number | null;
  clientPaymentVerified: boolean;
  proposalsCount: number | null;
  connectsRequired: number | null;
  isFeatured: boolean;
  isDuplicate: boolean;
  isFlaggedFake: boolean;
  status: string;
  postedAt: Date | null;
  skillsRequired: string[];
  category: string | null;
  latestAnalysis: JobAnalysis | null;
  proposalCount: number;
}

function formatBudget(job: JobCardProps): string {
  if (job.jobType === "HOURLY") {
    if (job.hourlyRateMin && job.hourlyRateMax) {
      return `$${job.hourlyRateMin}–$${job.hourlyRateMax}/hr`;
    }
    if (job.hourlyRateMax) return `Up to $${job.hourlyRateMax}/hr`;
    return "Hourly";
  }
  if (job.budgetMin && job.budgetMax) {
    return `$${job.budgetMin.toLocaleString()}–$${job.budgetMax.toLocaleString()}`;
  }
  if (job.budgetMax) return `$${job.budgetMax.toLocaleString()}`;
  return "Fixed Price";
}

function formatTimeAgo(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  if (diffHours < 1) return "Just now";
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 7) return `${diffDays}d ago`;
  return `${Math.floor(diffDays / 7)}w ago`;
}

function getScoreColor(score: number): string {
  if (score >= 70) return "text-emerald-600";
  if (score >= 40) return "text-amber-600";
  return "text-red-600";
}

function getScoreBg(score: number): string {
  if (score >= 70) return "bg-emerald-500/10";
  if (score >= 40) return "bg-amber-500/10";
  return "bg-red-500/10";
}

export function JobCard(props: JobCardProps) {
  const analysis = props.latestAnalysis;

  /** Remember this job so the list can scroll back to it on return */
  const handleNavigate = useCallback(() => {
    sessionStorage.setItem("last-visited-job-id", props.id);
  }, [props.id]);

  return (
    <div
      data-job-id={props.id}
      className={`
        group relative overflow-hidden rounded-2xl border
        bg-card transition-all duration-300
        hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5
        dark:hover:shadow-black/20
        ${
          props.isFlaggedFake
            ? "border-red-200 bg-gradient-to-r from-red-50/30 to-card dark:border-red-900 dark:from-red-950/20"
            : props.isDuplicate
              ? "border-amber-200 bg-gradient-to-r from-amber-50/30 to-card dark:border-amber-900 dark:from-amber-950/20"
              : ""
        }
      `}
    >
      {/* Shimmer */}
      <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />

      {/* Hover gradient reveal */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between gap-3">
          {/* Left: Job info */}
          <div className="flex-1 space-y-2.5 min-w-0">
            {/* Title & badges row */}
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/jobs/${props.id}`}
                onClick={handleNavigate}
                className="text-sm font-semibold leading-tight hover:text-primary transition-colors"
              >
                {props.title}
              </Link>
              <JobStatusBadge status={props.status} />
              {props.isFeatured && (
                <Badge
                  variant="secondary"
                  className="bg-amber-100 text-[10px] text-amber-800 rounded-md dark:bg-amber-500/20 dark:text-amber-300"
                >
                  Featured
                </Badge>
              )}
              {props.isFlaggedFake && (
                <Tooltip>
                  <TooltipTrigger>
                    <AlertTriangle className="h-3.5 w-3.5 text-red-500" />
                  </TooltipTrigger>
                  <TooltipContent>Potentially fake job</TooltipContent>
                </Tooltip>
              )}
              {props.isDuplicate && (
                <Tooltip>
                  <TooltipTrigger>
                    <CopyIcon className="h-3.5 w-3.5 text-amber-500" />
                  </TooltipTrigger>
                  <TooltipContent>Duplicate job detected</TooltipContent>
                </Tooltip>
              )}
            </div>

            {/* Description */}
            <p className="text-xs leading-relaxed text-muted-foreground line-clamp-2">
              {props.description}
            </p>

            {/* Skills */}
            {props.skillsRequired.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {props.skillsRequired.slice(0, 6).map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-[10px] font-normal rounded-md border-primary/20 bg-primary/5"
                  >
                    {skill}
                  </Badge>
                ))}
                {props.skillsRequired.length > 6 && (
                  <Badge
                    variant="outline"
                    className="text-[10px] font-normal text-muted-foreground rounded-md"
                  >
                    +{props.skillsRequired.length - 6}
                  </Badge>
                )}
              </div>
            )}

            {/* Meta row */}
            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <DollarSign className="h-3 w-3 text-emerald-500" />
                {formatBudget(props)}
              </span>
              {props.connectsRequired && (
                <span className="flex items-center gap-1">
                  <Zap className="h-3 w-3 text-amber-500" />
                  {props.connectsRequired} connects
                </span>
              )}
              {props.clientCountry && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {props.clientCountry}
                </span>
              )}
              {props.clientRating && (
                <span className="flex items-center gap-1">
                  <Star className="h-3 w-3 text-amber-500" />
                  {props.clientRating.toFixed(1)}
                </span>
              )}
              {props.clientPaymentVerified && (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Shield className="h-3 w-3" />
                  Verified
                </span>
              )}
              {props.postedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {formatTimeAgo(props.postedAt)}
                </span>
              )}
              {props.proposalsCount !== null && (
                <span>{props.proposalsCount} proposals</span>
              )}
            </div>
          </div>

          {/* Right: AI analysis scores + actions */}
          <div className="flex shrink-0 flex-col items-end gap-2">
            {analysis && (
              <div className="flex flex-col items-end gap-1.5 text-right">
                {analysis.fitScore !== null && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`flex items-center gap-1 rounded-lg px-2 py-0.5 ${getScoreBg(analysis.fitScore)}`}>
                        <TrendingUp className="h-3 w-3" />
                        <span className={`text-xs font-semibold ${getScoreColor(analysis.fitScore)}`}>
                          {analysis.fitScore}%
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Fit Score</TooltipContent>
                  </Tooltip>
                )}
                {analysis.winProbability !== null && (
                  <Tooltip>
                    <TooltipTrigger>
                      <div className={`flex items-center gap-1 rounded-lg px-2 py-0.5 ${getScoreBg(analysis.winProbability)}`}>
                        <Target className="h-2.5 w-2.5" />
                        <span className={`text-[10px] font-medium ${getScoreColor(analysis.winProbability)}`}>
                          {analysis.winProbability}% win
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>Win Probability</TooltipContent>
                  </Tooltip>
                )}
                {analysis.recommendation && (
                  <Badge
                    variant={
                      analysis.recommendation === "BID"
                        ? "default"
                        : "secondary"
                    }
                    className="text-[10px] rounded-md"
                  >
                    {analysis.recommendation}
                  </Badge>
                )}
              </div>
            )}

            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" asChild>
                <a
                  href={props.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </Button>
              <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity" asChild>
                <Link href={`/jobs/${props.id}`} onClick={handleNavigate}>
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
