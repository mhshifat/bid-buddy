import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { JobList } from "@/components/modules/jobs/job-list";

export const metadata: Metadata = createPageMetadata(
  "Jobs",
  "Browse and manage captured Upwork jobs."
);

export default function JobsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jobs"
        description="Browse captured Upwork jobs. Use the AI analysis to determine which jobs are worth bidding on."
      />
      <JobList />
    </div>
  );
}

