import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export const metadata: Metadata = createPageMetadata(
  "Analytics",
  "Track your Upwork freelancing performance metrics."
);

export default function AnalyticsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Analytics"
        description="Track your bidding success rate, earnings trends, and productivity metrics."
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <TrendingUp className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Analytics Dashboard</h2>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            Visualize your Upwork performance — bid-to-win ratio, earnings
            over time, connects efficiency, and more. Coming soon.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

