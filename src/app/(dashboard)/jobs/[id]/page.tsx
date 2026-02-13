import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { JobDetailView } from "@/components/modules/jobs/job-detail-view";

export const metadata: Metadata = createPageMetadata(
  "Job Details",
  "View detailed information about this Upwork job."
);

interface JobDetailPageProps {
  params: Promise<{ id: string }>;
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const { id } = await params;

  return <JobDetailView jobId={id} />;
}

