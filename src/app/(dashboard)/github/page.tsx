import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { GitHubSkillsContainer } from "@/components/modules/github/github-skills-container";

export const metadata: Metadata = createPageMetadata(
  "GitHub Skills",
  "Connect your GitHub account to automatically detect skills and enhance AI analysis."
);

export default function GithubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub Skills"
        description="Connect your GitHub account to automatically detect skills and enhance AI analysis."
      />
      <GitHubSkillsContainer />
    </div>
  );
}
