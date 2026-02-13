import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
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
      />
      <ProjectList />
    </div>
  );
}

