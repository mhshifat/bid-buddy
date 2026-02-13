"use client";

/**
 * GitHub Repos Card – displays the top repositories from synced GitHub data.
 */

import { ExternalLink, Star, GitFork } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface RepoData {
  name: string;
  fullName: string;
  url: string;
  description: string | null;
  stars: number;
  forks: number;
  language: string | null;
  topics: string[];
  pushedAt: string;
}

interface GitHubReposCardProps {
  topRepos: RepoData[] | null;
}

export function GitHubReposCard({ topRepos }: GitHubReposCardProps) {
  if (!topRepos || topRepos.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Top Repositories</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {topRepos.map((repo) => (
          <div
            key={repo.fullName}
            className="rounded-lg border p-4 transition-colors hover:bg-muted/50"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <a
                  href={repo.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
                >
                  {repo.name}
                  <ExternalLink className="h-3 w-3" />
                </a>
                {repo.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {repo.description}
                  </p>
                )}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-3">
              {repo.language && (
                <span className="text-xs text-muted-foreground">
                  {repo.language}
                </span>
              )}
              {repo.stars > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Star className="h-3 w-3" />
                  {repo.stars}
                </span>
              )}
              {repo.forks > 0 && (
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <GitFork className="h-3 w-3" />
                  {repo.forks}
                </span>
              )}
              {repo.topics.slice(0, 4).map((topic) => (
                <Badge key={topic} variant="secondary" className="text-xs">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

