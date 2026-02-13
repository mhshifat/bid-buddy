-- CreateEnum
CREATE TYPE "ScopeChangeStatus" AS ENUM ('DETECTED', 'ACCEPTED', 'DECLINED', 'NEGOTIATED');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "InsightType" ADD VALUE 'SCOPE_CREEP_DETECTION';
ALTER TYPE "InsightType" ADD VALUE 'SCOPE_CREEP_RESPONSE';
ALTER TYPE "InsightType" ADD VALUE 'CHANGE_ORDER';

-- CreateTable
CREATE TABLE "project_scopes" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "project_id" TEXT,
    "job_id" TEXT,
    "title" TEXT NOT NULL,
    "original_description" TEXT NOT NULL,
    "deliverables" TEXT[],
    "exclusions" TEXT[],
    "milestones" TEXT[],
    "agreed_budget" DECIMAL(12,2),
    "agreed_timeline" TEXT,
    "revision_limit" INTEGER,
    "notes" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "project_scopes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scope_change_requests" (
    "id" TEXT NOT NULL,
    "scope_id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "client_message" TEXT NOT NULL,
    "is_out_of_scope" BOOLEAN NOT NULL DEFAULT false,
    "ai_analysis" JSONB,
    "ai_response" JSONB,
    "change_order" JSONB,
    "status" "ScopeChangeStatus" NOT NULL DEFAULT 'DETECTED',
    "estimated_cost" DECIMAL(12,2),
    "estimated_hours" DECIMAL(8,2),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scope_change_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "project_scopes_tenant_id_idx" ON "project_scopes"("tenant_id");

-- CreateIndex
CREATE INDEX "project_scopes_project_id_idx" ON "project_scopes"("project_id");

-- CreateIndex
CREATE INDEX "project_scopes_job_id_idx" ON "project_scopes"("job_id");

-- CreateIndex
CREATE INDEX "scope_change_requests_scope_id_idx" ON "scope_change_requests"("scope_id");

-- CreateIndex
CREATE INDEX "scope_change_requests_tenant_id_idx" ON "scope_change_requests"("tenant_id");

-- AddForeignKey
ALTER TABLE "project_scopes" ADD CONSTRAINT "project_scopes_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scopes" ADD CONSTRAINT "project_scopes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_scopes" ADD CONSTRAINT "project_scopes_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scope_change_requests" ADD CONSTRAINT "scope_change_requests_scope_id_fkey" FOREIGN KEY ("scope_id") REFERENCES "project_scopes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scope_change_requests" ADD CONSTRAINT "scope_change_requests_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
