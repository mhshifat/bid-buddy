import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PipelineHeader } from "@/components/modules/pipeline/pipeline-header";
import { PipelineStats } from "@/components/modules/pipeline/pipeline-stats";
import { PipelineBoard } from "@/components/modules/pipeline/pipeline-board";

export const metadata: Metadata = createPageMetadata(
  "Pipeline",
  "Track your freelancing journey from job discovery to project delivery."
);

export default function PipelinePage() {
  return (
    <div className="space-y-6">
      {/* Hero header with animated SVG background */}
      <PipelineHeader />

      {/* Bento-grid funnel stats */}
      <PipelineStats />

      {/* Kanban / List board */}
      <PipelineBoard />
    </div>
  );
}
