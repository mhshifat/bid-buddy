"use client";

/**
 * GitHub Connect Card – shown when the user has not yet synced their GitHub data.
 * Offers a single "Connect GitHub Account" button that triggers the sync.
 */

import { GitBranch, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface GitHubConnectCardProps {
  hasToken: boolean;
  isSyncing: boolean;
  onSync: () => void;
}

export function GitHubConnectCard({
  hasToken,
  isSyncing,
  onSync,
}: GitHubConnectCardProps) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center justify-center py-20">
        <GitBranch className="h-12 w-12 text-muted-foreground" />
        <h2 className="mt-4 text-lg font-semibold">Connect GitHub</h2>
        <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
          Link your GitHub profile to automatically extract your tech stack, top
          languages, and project experience. This data powers more accurate AI
          job matching and proposal generation.
        </p>

        {hasToken ? (
          <Button className="mt-6" onClick={onSync} disabled={isSyncing}>
            {isSyncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Syncing GitHub Data…
              </>
            ) : (
              <>
                <GitBranch className="mr-2 h-4 w-4" />
                Connect GitHub Account
              </>
            )}
          </Button>
        ) : (
          <div className="mt-6 text-center">
            <p className="text-sm text-destructive">
              No GitHub token found. Please sign out and sign in again with
              GitHub to authorize access.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

