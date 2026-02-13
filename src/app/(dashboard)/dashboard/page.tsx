import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { DashboardStats } from "@/components/modules/dashboard/dashboard-stats";
import { RecentJobsList } from "@/components/modules/dashboard/recent-jobs-list";

export const metadata: Metadata = createPageMetadata(
  "Dashboard",
  "Overview of your Upwork freelancing activity."
);

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Dashboard"
        description="Welcome back! Here's an overview of your Upwork activity."
      />
      <DashboardStats />
      <div className="grid gap-6 lg:grid-cols-2">
        <RecentJobsList />
        <div className="space-y-6">
          {/* Placeholder for future widgets like connects tracker, analytics charts */}
          <div className="flex h-[300px] items-center justify-center rounded-lg border border-dashed">
            <p className="text-sm text-muted-foreground">
              Analytics & Connects Tracker (Coming Soon)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

