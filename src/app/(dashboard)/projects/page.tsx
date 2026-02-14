import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { FolderKanban } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ProjectList } from "@/components/modules/projects/project-list";

export const metadata: Metadata = createPageMetadata(
  "Projects",
  "Manage your active and completed Upwork projects."
);

export default function ProjectsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Projects"
        description="Manage your active projects, track milestones, and log time."
        icon={FolderKanban}
        accentGradient="from-emerald-500/50 via-teal-500/30 to-cyan-500/50"
      />
      <ProjectList />
    </div>
  );
}
