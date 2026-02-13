/**
 * Root tRPC router - aggregates all sub-routers.
 */

import { createRouter, createCallerFactory } from "./trpc";
import { authRouter } from "./routers/auth-router";
import { jobRouter } from "./routers/job-router";
import { proposalRouter } from "./routers/proposal-router";
import { projectRouter } from "./routers/project-router";
import { clientRouter } from "./routers/client-router";
import { dashboardRouter } from "./routers/dashboard-router";
import { skillRouter } from "./routers/skill-router";
import { aiRouter } from "./routers/ai-router";
import { githubRouter } from "./routers/github-router";
import { scopeRouter } from "./routers/scope-router";
import { pipelineRouter } from "./routers/pipeline-router";

export const appRouter = createRouter({
  auth: authRouter,
  job: jobRouter,
  proposal: proposalRouter,
  project: projectRouter,
  clientManagement: clientRouter,
  dashboard: dashboardRouter,
  skill: skillRouter,
  ai: aiRouter,
  github: githubRouter,
  scope: scopeRouter,
  pipeline: pipelineRouter,
});

export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);

