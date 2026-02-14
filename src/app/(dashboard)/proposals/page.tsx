import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { FileText } from "lucide-react";
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
        icon={FileText}
        accentGradient="from-violet-500/50 via-purple-500/30 to-pink-500/50"
      />
      <ProposalList />
    </div>
  );
}
