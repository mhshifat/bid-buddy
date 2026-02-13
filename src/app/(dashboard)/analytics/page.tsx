import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { WinPatternsCard } from "@/components/modules/analytics/win-patterns-card";
import { ConnectsRoiCard } from "@/components/modules/analytics/connects-roi-card";

export const metadata: Metadata = createPageMetadata(
  "Analytics",
  "Track your Upwork freelancing performance metrics."
);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="AI-powered insights into your bidding success, connects efficiency, and win patterns."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <WinPatternsCard />
        <ConnectsRoiCard />
      </div>
    </div>
  );
}
