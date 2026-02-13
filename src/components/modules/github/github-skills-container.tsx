"use client";

/**
 * GitHub Skills Container – orchestrates the GitHub Skills page.
 *
 * Fetches the connection status and renders:
 *   - GitHubConnectCard when not connected
 *   - GitHubProfileCard + data cards when connected
 */

import { useCallback } from "react";
import { toast } from "sonner";

import { trpc } from "@/lib/trpc/client";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { GitHubConnectCard } from "./github-connect-card";
import { GitHubProfileCard } from "./github-profile-card";
import { GitHubLanguagesCard } from "./github-languages-card";
import { GitHubReposCard } from "./github-repos-card";
import { GitHubSkillsDetected } from "./github-skills-detected";

export function GitHubSkillsContainer() {
  const utils = trpc.useUtils();

  const {
    data: status,
    isLoading: isLoadingStatus,
  } = trpc.github.status.useQuery();

  const syncMutation = trpc.github.sync.useMutation({
    onSuccess: (data) => {
      toast.success(
        `GitHub synced! Found ${data.reposCount} repos, ${data.languagesCount} languages, and ${data.skillsCount} skills.`
      );
      void utils.github.status.invalidate();
      void utils.skill.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to sync GitHub data.");
    },
  });

  const disconnectMutation = trpc.github.disconnect.useMutation({
    onSuccess: () => {
      toast.success("GitHub disconnected.");
      void utils.github.status.invalidate();
      void utils.skill.list.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to disconnect GitHub.");
    },
  });

  const handleSync = useCallback(() => {
    syncMutation.mutate();
  }, [syncMutation]);

  const handleDisconnect = useCallback(() => {
    disconnectMutation.mutate();
  }, [disconnectMutation]);

  // Loading state
  if (isLoadingStatus) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="py-12">
            <div className="flex flex-col items-center gap-4">
              <Skeleton className="h-12 w-12 rounded-full" />
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-4 w-64" />
              <Skeleton className="h-10 w-40" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Not connected state
  if (!status?.connected) {
    return (
      <GitHubConnectCard
        hasToken={status?.hasToken ?? false}
        isSyncing={syncMutation.isPending}
        onSync={handleSync}
      />
    );
  }

  // Connected state
  const profile = status.profile;

  return (
    <div className="space-y-6">
      {profile && (
        <GitHubProfileCard
          username={profile.username}
          avatarUrl={profile.avatarUrl}
          bio={profile.bio}
          publicRepos={profile.publicRepos}
          totalStars={profile.totalStars}
          lastSyncedAt={profile.lastSyncedAt}
          isSyncing={syncMutation.isPending}
          isDisconnecting={disconnectMutation.isPending}
          onSync={handleSync}
          onDisconnect={handleDisconnect}
        />
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        {profile && (
          <GitHubLanguagesCard topLanguages={profile.topLanguages} />
        )}
        <GitHubSkillsDetected />
      </div>

      {profile && <GitHubReposCard topRepos={profile.topRepos} />}
    </div>
  );
}

