import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { Brain } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { AiAnalysisPageContent } from "./page-content";

export const metadata: Metadata = createPageMetadata(
  "AI Analysis",
  "AI-powered job analysis and recommendations."
);

export default function AiAnalysisPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="AI Analysis"
        description="AI-powered job analysis — detect fake jobs, score fit, and get bidding recommendations."
        icon={Brain}
        accentGradient="from-fuchsia-500/50 via-purple-500/30 to-violet-500/50"
      />
      <AiAnalysisPageContent />
    </div>
  );
}
