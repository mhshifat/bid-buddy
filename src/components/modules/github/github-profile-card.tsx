"use client";

/**
 * GitHub Profile Card – displays the connected GitHub profile summary.
 * Shows username, avatar, stats, and sync/disconnect actions.
 */

import { GitBranch, RefreshCw, Unplug, Loader2, Star, BookOpen, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface GitHubProfileCardProps {
  username: string;
  avatarUrl: string | null;
  bio: string | null;
  publicRepos: number | null;
  totalStars: number | null;
  lastSyncedAt: Date | null;
  isSyncing: boolean;
  isDisconnecting: boolean;
  onSync: () => void;
  onDisconnect: () => void;
}

export function GitHubProfileCard({
  username,
  avatarUrl,
  bio,
  publicRepos,
  totalStars,
  lastSyncedAt,
  isSyncing,
  isDisconnecting,
  onSync,
  onDisconnect,
}: GitHubProfileCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="flex items-center gap-2 text-base">
          <GitBranch className="h-4 w-4" />
          GitHub Profile
        </CardTitle>
        <Badge variant="default" className="bg-green-600 text-white">
          Connected
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Profile Info */}
        <div className="flex items-center gap-4">
          <Avatar className="h-14 w-14">
            <AvatarImage src={avatarUrl ?? undefined} alt={username} />
            <AvatarFallback>
              {username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-semibold">@{username}</p>
            {bio && (
              <p className="mt-0.5 text-sm text-muted-foreground line-clamp-2">
                {bio}
              </p>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 rounded-lg bg-muted/50 p-4">
          <StatItem
            icon={<BookOpen className="h-4 w-4" />}
            label="Repos"
            value={publicRepos ?? 0}
          />
          <StatItem
            icon={<Star className="h-4 w-4" />}
            label="Stars"
            value={totalStars ?? 0}
          />
          <StatItem
            icon={<Clock className="h-4 w-4" />}
            label="Last Sync"
            value={lastSyncedAt ? formatRelative(lastSyncedAt) : "Never"}
          />
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onSync}
            disabled={isSyncing}
          >
            {isSyncing ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <RefreshCw className="mr-2 h-3.5 w-3.5" />
            )}
            {isSyncing ? "Syncing…" : "Re-sync"}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDisconnect}
            disabled={isDisconnecting}
            className="text-destructive hover:text-destructive"
          >
            {isDisconnecting ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <Unplug className="mr-2 h-3.5 w-3.5" />
            )}
            Disconnect
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// -----------------------------------------------------------------------------
// Sub-components
// -----------------------------------------------------------------------------

function StatItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex flex-col items-center gap-1 text-center">
      <div className="flex items-center gap-1 text-muted-foreground">{icon}</div>
      <p className="text-lg font-semibold">{value}</p>
      <p className="text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function formatRelative(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - new Date(date).getTime();
  const diffMin = Math.floor(diffMs / 60000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;

  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;

  const diffDays = Math.floor(diffHr / 24);
  if (diffDays < 7) return `${diffDays}d ago`;

  return new Date(date).toLocaleDateString();
}

