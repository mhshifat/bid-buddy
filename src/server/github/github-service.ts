/**
 * GitHub Service – fetches repository and language data from GitHub's REST API.
 *
 * Uses the Strategy/Adapter pattern so the data-fetching layer is decoupled
 * from the persistence layer. The service receives an access token and returns
 * normalised DTOs that can be consumed by the tRPC router.
 */

import { ExternalServiceError } from "@/server/lib/errors";
import { logger } from "@/server/lib/logger";

// -----------------------------------------------------------------------------
// GitHub API Endpoints
// -----------------------------------------------------------------------------

const GITHUB_API = "https://api.github.com";

// -----------------------------------------------------------------------------
// Response Types
// -----------------------------------------------------------------------------

interface GitHubRepo {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  fork: boolean;
  stargazers_count: number;
  watchers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  created_at: string;
  updated_at: string;
  pushed_at: string;
}

interface GitHubUser {
  login: string;
  avatar_url: string;
  bio: string | null;
  public_repos: number;
}

// -----------------------------------------------------------------------------
// Normalised DTOs
// -----------------------------------------------------------------------------

export interface GitHubProfileData {
  username: string;
  avatarUrl: string;
  bio: string | null;
  publicRepos: number;
}

export interface GitHubRepoData {
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

export interface GitHubLanguageBreakdown {
  [language: string]: number; // bytes
}

export interface GitHubSyncResult {
  profile: GitHubProfileData;
  topRepos: GitHubRepoData[];
  topLanguages: Record<string, number>; // language → percentage
  totalStars: number;
  detectedSkills: string[];
}

// -----------------------------------------------------------------------------
// Service
// -----------------------------------------------------------------------------

export class GitHubService {
  private readonly headers: Record<string, string>;

  constructor(accessToken: string) {
    this.headers = {
      Authorization: `Bearer ${accessToken}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    };
  }

  /**
   * Fetches the authenticated user's profile.
   */
  async getProfile(): Promise<GitHubProfileData> {
    const data = await this.fetch<GitHubUser>("/user");
    return {
      username: data.login,
      avatarUrl: data.avatar_url,
      bio: data.bio,
      publicRepos: data.public_repos,
    };
  }

  /**
   * Fetches all repos (owned, non-fork, sorted by push date).
   * Paginates through all pages to get the full picture.
   */
  async getRepos(maxPages = 5): Promise<GitHubRepoData[]> {
    const allRepos: GitHubRepo[] = [];

    for (let page = 1; page <= maxPages; page++) {
      const repos = await this.fetch<GitHubRepo[]>(
        `/user/repos?sort=pushed&direction=desc&per_page=100&type=owner&page=${page}`
      );

      if (repos.length === 0) break;
      allRepos.push(...repos);
      if (repos.length < 100) break;
    }

    // Filter out forks, sort by stars
    return allRepos
      .filter((r) => !r.fork)
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .map((r) => ({
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        topics: r.topics ?? [],
        pushedAt: r.pushed_at,
      }));
  }

  /**
   * Fetches language breakdowns for the top repos and returns aggregated
   * language percentages.
   */
  async getLanguageBreakdown(repos: GitHubRepoData[], limit = 15): Promise<Record<string, number>> {
    const topRepos = repos.slice(0, limit);
    const totals: Record<string, number> = {};

    // Fetch language data for each repo in parallel (batched)
    const languageResults = await Promise.all(
      topRepos.map(async (repo) => {
        try {
          return await this.fetch<GitHubLanguageBreakdown>(
            `/repos/${repo.fullName}/languages`
          );
        } catch {
          logger.warn(`Failed to fetch languages for ${repo.fullName}`);
          return {} as GitHubLanguageBreakdown;
        }
      })
    );

    for (const langs of languageResults) {
      for (const [lang, bytes] of Object.entries(langs)) {
        totals[lang] = (totals[lang] ?? 0) + bytes;
      }
    }

    // Convert to percentages
    const totalBytes = Object.values(totals).reduce((s, v) => s + v, 0);
    if (totalBytes === 0) return {};

    const percentages: Record<string, number> = {};
    for (const [lang, bytes] of Object.entries(totals)) {
      const pct = Math.round((bytes / totalBytes) * 1000) / 10; // one decimal
      if (pct >= 0.5) {
        percentages[lang] = pct;
      }
    }

    // Sort by percentage descending
    return Object.fromEntries(
      Object.entries(percentages).sort(([, a], [, b]) => b - a)
    );
  }

  /**
   * Runs the full sync: fetches profile, repos, languages, and detects skills.
   */
  async syncAll(): Promise<GitHubSyncResult> {
    const profile = await this.getProfile();
    const repos = await this.getRepos();
    const topLanguages = await this.getLanguageBreakdown(repos);

    const totalStars = repos.reduce((sum, r) => sum + r.stars, 0);
    const topRepos = repos.slice(0, 10);

    // Detect skills from languages + topics
    const detectedSkills = this.detectSkills(repos, topLanguages);

    return {
      profile,
      topRepos,
      topLanguages,
      totalStars,
      detectedSkills,
    };
  }

  // ---------------------------------------------------------------------------
  // Helpers
  // ---------------------------------------------------------------------------

  /**
   * Extracts unique skills from repo languages + topics.
   */
  private detectSkills(
    repos: GitHubRepoData[],
    languages: Record<string, number>
  ): string[] {
    const skills = new Set<string>();

    // Add all detected languages
    for (const lang of Object.keys(languages)) {
      skills.add(lang);
    }

    // Add all topics across repos (common frameworks, tools, etc.)
    for (const repo of repos) {
      for (const topic of repo.topics) {
        const normalised = topic.toLowerCase().replace(/-/g, " ");
        skills.add(normalised);
      }
    }

    return Array.from(skills).sort();
  }

  /**
   * Generic fetch wrapper for GitHub API with error handling.
   */
  private async fetch<T>(path: string): Promise<T> {
    const url = `${GITHUB_API}${path}`;

    const response = await fetch(url, {
      headers: this.headers,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => "");
      logger.error(`GitHub API error: ${response.status} ${url}`, undefined, {
        status: String(response.status),
        body: errorBody.slice(0, 500),
      });

      if (response.status === 401) {
        throw new ExternalServiceError(
          "GitHub",
          new Error(
            "Your GitHub access token has expired. Please sign out and sign in again to re-authorize."
          )
        );
      }

      throw new ExternalServiceError(
        "GitHub",
        new Error(`GitHub API request failed with status ${response.status}`)
      );
    }

    return (await response.json()) as T;
  }
}

