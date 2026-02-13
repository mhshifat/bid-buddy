/**
 * Login Form – client component with GitHub sign-in button.
 *
 * Shows branding, error alerts (with copyable correlation IDs),
 * and feature highlights.
 */

"use client";

import { useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Zap, Github, AlertCircle, Copy } from "lucide-react";
import { toast } from "sonner";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LoginFormProps {
  error?: string;
  correlationId?: string;
}

// ---------------------------------------------------------------------------
// Error messages keyed by error code from the callback route
// ---------------------------------------------------------------------------

const ERROR_MESSAGES: Record<string, string> = {
  github_denied: "GitHub authorization was denied. Please try again.",
  invalid_state:
    "Invalid authentication state. Please try signing in again.",
  missing_code:
    "Authentication code was missing. Please try signing in again.",
  auth_failed:
    "Authentication failed. Please try again or contact support.",
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LoginForm({ error, correlationId }: LoginFormProps) {
  const errorMessage = error
    ? (ERROR_MESSAGES[error] ?? "An unexpected error occurred. Please try again.")
    : null;

  const handleGitHubLogin = useCallback(() => {
    window.location.href = "/api/auth/github";
  }, []);

  const handleCopyCorrelationId = useCallback(() => {
    if (correlationId) {
      navigator.clipboard.writeText(correlationId);
      toast.success("Correlation ID copied to clipboard");
    }
  }, [correlationId]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* ------ Logo & Branding ------ */}
        <div className="flex flex-col items-center gap-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg">
            <Zap className="h-7 w-7" />
          </div>
          <div className="text-center">
            <h1 className="text-2xl font-bold tracking-tight">Bid Buddy</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Your AI-powered Upwork assistant
            </p>
          </div>
        </div>

        {/* ------ Error Alert ------ */}
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-destructive">
                {errorMessage}
              </p>
              {correlationId && (
                <button
                  onClick={handleCopyCorrelationId}
                  className="flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
                  title="Click to copy the correlation ID for support"
                >
                  <Copy className="h-3 w-3" />
                  <span>ID: {correlationId}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* ------ Sign In Card ------ */}
        <Card className="border-0 shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-xl">Welcome back</CardTitle>
            <CardDescription>
              Sign in with your GitHub account to continue
            </CardDescription>
          </CardHeader>

          <CardContent>
            <Button
              onClick={handleGitHubLogin}
              className="w-full gap-2"
              size="lg"
            >
              <Github className="h-5 w-5" />
              Continue with GitHub
            </Button>
          </CardContent>

          <CardFooter className="flex flex-col items-center gap-2">
            <p className="text-center text-xs text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy
              Policy.
            </p>
          </CardFooter>
        </Card>

        {/* ------ Feature Highlights ------ */}
        <div className="grid grid-cols-3 gap-4 text-center">
          <FeatureItem emoji="🎯" label="Job Analysis" />
          <FeatureItem emoji="🤖" label="AI Proposals" />
          <FeatureItem emoji="📊" label="Project Mgmt" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sub-component
// ---------------------------------------------------------------------------

function FeatureItem({ emoji, label }: { emoji: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-2xl">{emoji}</span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </div>
  );
}

