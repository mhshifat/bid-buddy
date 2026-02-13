/**
 * GitHub tRPC router – handles GitHub profile connection and skill sync.
 *
 * Procedures:
 *   - status  → Returns the current GitHub connection state
 *   - sync    → Triggers a full sync (repos, languages, skills)
 *   - disconnect → Removes the GitHub profile data
 */

import { TRPCError } from "@trpc/server";
import type { PrismaClient } from "@prisma/client";
import { createRouter, protectedProcedure } from "../trpc";
import { GitHubService } from "@/server/github/github-service";
import { logger } from "@/server/lib/logger";

// -----------------------------------------------------------------------------
// Helpers
// -----------------------------------------------------------------------------

/**
 * Retrieves the GitHub access token for the current user from oauth_accounts.
 */
async function getGitHubToken(
  prisma: PrismaClient,
  userId: string
): Promise<string | null> {
  const account = await prisma.oAuthAccount.findFirst({
    where: {
      user_id: userId,
      provider: "github",
    },
    select: { access_token: true },
  });

  return account?.access_token ?? null;
}

// -----------------------------------------------------------------------------
// Router
// -----------------------------------------------------------------------------

export const githubRouter = createRouter({
  /**
   * Returns the current GitHub connection status and profile data.
   */
  status: protectedProcedure.query(async ({ ctx }) => {
    const profile = await ctx.prisma.githubProfile.findFirst({
      where: { tenant_id: ctx.tenantId },
    });

    if (!profile) {
      // Check if user has a GitHub OAuth token (from login)
      const token = await getGitHubToken(ctx.prisma, ctx.userId);
      return {
        connected: false,
        hasToken: !!token,
        profile: null,
      };
    }

    return {
      connected: true,
      hasToken: true,
      profile: {
        username: profile.github_username,
        avatarUrl: profile.avatar_url,
        bio: profile.bio,
        publicRepos: profile.public_repos,
        totalStars: profile.total_stars,
        topLanguages: profile.top_languages as Record<string, number> | null,
        topRepos: profile.top_repos as Array<{
          name: string;
          fullName: string;
          url: string;
          description: string | null;
          stars: number;
          forks: number;
          language: string | null;
          topics: string[];
          pushedAt: string;
        }> | null,
        lastSyncedAt: profile.last_synced_at,
      },
    };
  }),

  /**
   * Syncs the GitHub profile: fetches repos, languages, detects skills.
   * Uses the existing GitHub OAuth access token from login.
   */
  sync: protectedProcedure.mutation(async ({ ctx }) => {
    const token = await getGitHubToken(ctx.prisma, ctx.userId);

    if (!token) {
      throw new TRPCError({
        code: "PRECONDITION_FAILED",
        message:
          "No GitHub access token found. Please sign out and sign in again with GitHub to authorize.",
      });
    }

    logger.info("Starting GitHub skills sync", {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
    });

    try {
      const github = new GitHubService(token);
      const result = await github.syncAll();

      // Upsert the GithubProfile record
      await ctx.prisma.githubProfile.upsert({
        where: {
          tenant_id_github_username: {
            tenant_id: ctx.tenantId,
            github_username: result.profile.username,
          },
        },
        update: {
          avatar_url: result.profile.avatarUrl,
          bio: result.profile.bio,
          public_repos: result.profile.publicRepos,
          total_stars: result.totalStars,
          top_languages: result.topLanguages,
          top_repos: JSON.parse(JSON.stringify(result.topRepos)),
          last_synced_at: new Date(),
        },
        create: {
          tenant_id: ctx.tenantId,
          github_username: result.profile.username,
          access_token: token,
          avatar_url: result.profile.avatarUrl,
          bio: result.profile.bio,
          public_repos: result.profile.publicRepos,
          total_stars: result.totalStars,
          top_languages: result.topLanguages,
          top_repos: JSON.parse(JSON.stringify(result.topRepos)),
          last_synced_at: new Date(),
        },
      });

      // Upsert detected skills
      const skillPromises = result.detectedSkills.map((skillName) =>
        ctx.prisma.skill.upsert({
          where: {
            tenant_id_name: {
              tenant_id: ctx.tenantId,
              name: skillName,
            },
          },
          update: {
            source: "GITHUB",
            updated_at: new Date(),
          },
          create: {
            tenant_id: ctx.tenantId,
            name: skillName,
            source: "GITHUB",
            category: "language",
          },
        })
      );

      await Promise.all(skillPromises);

      logger.info(
        `GitHub sync complete: ${result.topRepos.length} repos, ${result.detectedSkills.length} skills detected`,
        { correlationId: ctx.correlationId }
      );

      return {
        success: true,
        reposCount: result.topRepos.length,
        languagesCount: Object.keys(result.topLanguages).length,
        skillsCount: result.detectedSkills.length,
        profile: {
          username: result.profile.username,
          avatarUrl: result.profile.avatarUrl,
          bio: result.profile.bio,
          publicRepos: result.profile.publicRepos,
          totalStars: result.totalStars,
          topLanguages: result.topLanguages,
          topRepos: result.topRepos,
          lastSyncedAt: new Date(),
        },
      };
    } catch (error) {
      logger.error(
        "GitHub sync failed",
        error instanceof Error ? error : undefined,
        { correlationId: ctx.correlationId }
      );

      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message:
          error instanceof Error
            ? error.message
            : "Failed to sync GitHub data. Please try again.",
        cause: error,
      });
    }
  }),

  /**
   * Disconnects GitHub integration by removing the profile + associated skills.
   */
  disconnect: protectedProcedure.mutation(async ({ ctx }) => {
    // Delete all GITHUB-sourced skills
    await ctx.prisma.skill.deleteMany({
      where: {
        tenant_id: ctx.tenantId,
        source: "GITHUB",
      },
    });

    // Delete the GitHub profile
    await ctx.prisma.githubProfile.deleteMany({
      where: {
        tenant_id: ctx.tenantId,
      },
    });

    logger.info("GitHub integration disconnected", {
      correlationId: ctx.correlationId,
      userId: ctx.userId,
    });

    return { success: true };
  }),
});

