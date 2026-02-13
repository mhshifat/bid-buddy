-- CreateEnum
CREATE TYPE "JourneyPhase" AS ENUM ('DISCOVERED', 'ANALYZED', 'SHORTLISTED', 'PROPOSAL_DRAFTED', 'PROPOSAL_SENT', 'INTERVIEWING', 'OFFER_RECEIVED', 'WON', 'PROJECT_STARTED', 'MILESTONE_COMPLETED', 'PROJECT_DELIVERED', 'PAYMENT_RECEIVED', 'FEEDBACK_RECEIVED', 'LOST', 'SKIPPED', 'EXPIRED');

-- AlterTable
ALTER TABLE "projects" ADD COLUMN     "job_id" TEXT,
ADD COLUMN     "proposal_id" TEXT;

-- CreateTable
CREATE TABLE "job_activities" (
    "id" TEXT NOT NULL,
    "tenant_id" TEXT NOT NULL,
    "job_id" TEXT NOT NULL,
    "proposal_id" TEXT,
    "project_id" TEXT,
    "phase" "JourneyPhase" NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "job_activities_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "job_activities_tenant_id_idx" ON "job_activities"("tenant_id");

-- CreateIndex
CREATE INDEX "job_activities_job_id_idx" ON "job_activities"("job_id");

-- CreateIndex
CREATE INDEX "job_activities_tenant_id_phase_idx" ON "job_activities"("tenant_id", "phase");

-- CreateIndex
CREATE INDEX "job_activities_created_at_idx" ON "job_activities"("created_at");

-- CreateIndex
CREATE INDEX "projects_job_id_idx" ON "projects"("job_id");

-- CreateIndex
CREATE INDEX "projects_proposal_id_idx" ON "projects"("proposal_id");

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_proposal_id_fkey" FOREIGN KEY ("proposal_id") REFERENCES "proposals"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_activities" ADD CONSTRAINT "job_activities_tenant_id_fkey" FOREIGN KEY ("tenant_id") REFERENCES "tenants"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "job_activities" ADD CONSTRAINT "job_activities_job_id_fkey" FOREIGN KEY ("job_id") REFERENCES "jobs"("id") ON DELETE CASCADE ON UPDATE CASCADE;
