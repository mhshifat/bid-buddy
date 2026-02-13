import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { PipelineStats } from "@/components/modules/pipeline/pipeline-stats";
import { PipelineBoard } from "@/components/modules/pipeline/pipeline-board";

export const metadata: Metadata = createPageMetadata(
  "Pipeline",
  "Track your freelancing journey from job discovery to project delivery."
);

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Pipeline"
        description="Track every job's journey — from discovery through bidding, winning, delivering, and getting paid."
      />
      <PipelineStats />
      <PipelineBoard />
    </div>
  );
}

