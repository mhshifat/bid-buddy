import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { ProposalList } from "@/components/modules/proposals/proposal-list";

export const metadata: Metadata = createPageMetadata(
  "Proposals",
  "Manage your Upwork proposals and track their status."
);

export default function ProposalsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Proposals"
        description="Track all your proposals. Let AI generate tailored cover letters for each job."
      />
      <ProposalList />
    </div>
  );
}

