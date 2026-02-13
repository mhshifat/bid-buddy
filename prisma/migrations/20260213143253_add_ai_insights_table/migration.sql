-- CreateEnum
CREATE TYPE "InsightType" AS ENUM ('BID_STRATEGY', 'INTERVIEW_PREP', 'SKILL_GAP', 'SCOPE_ESTIMATE', 'DISCOVERY_QUESTIONS', 'CONTRACT_ADVISOR', 'PROPOSAL_VARIATIONS', 'CLIENT_INTELLIGENCE', 'FOLLOW_UP_MESSAGE', 'SMART_ALERTS', 'STYLE_TRAINER', 'WEEKLY_DIGEST', 'WIN_PATTERNS', 'PROFILE_OPTIMIZER');

-- CreateTable
CREATE TABLE "ai_insights" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_id" TEXT,
    "proposal_id" TEXT,
    "insight_type" "InsightType" NOT NULL,
    "result" JSONB NOT NULL,
    "model_used" TEXT,
    "tokens_used" INTEGER,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_insights_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ai_insights_tenant_id_insight_type_idx" ON "ai_insights"("tenant_id", "insight_type");

-- CreateIndex
CREATE INDEX "ai_insights_job_id_insight_type_idx" ON "ai_insights"("job_id", "insight_type");

-- CreateIndex
CREATE INDEX "ai_insights_proposal_id_insight_type_idx" ON "ai_insights"("proposal_id", "insight_type");

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_insights" ADD CONSTRAINT "ai_insights_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE CASCADE ON UPDATE CASCADE;
