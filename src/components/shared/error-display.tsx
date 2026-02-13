"use client";

import { AlertCircle, Copy, Check } from "lucide-react";
import { useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface ErrorDisplayProps {
  message: string;
  correlationId?: string;
  onRetry?: () => void;
}

export function ErrorDisplay({
  message,
  correlationId,
  onRetry,
}: ErrorDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    if (!correlationId) return;
    await navigator.clipboard.writeText(correlationId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [correlationId]);

  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-lg border border-destructive/20 bg-destructive/5 p-6">
      <AlertCircle className="h-10 w-10 text-destructive" />
      <div className="text-center">
        <p className="text-sm font-medium text-destructive">{message}</p>
        {correlationId && (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={handleCopy}
                className="mt-2 inline-flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted/80"
              >
                {copied ? (
                  <Check className="h-3 w-3" />
                ) : (
                  <Copy className="h-3 w-3" />
                )}
                <span className="font-mono">{correlationId}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <p>
                Click to copy error ID. Share this with support if the issue
                persists.
              </p>
            </TooltipContent>
          </Tooltip>
        )}
      </div>
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

