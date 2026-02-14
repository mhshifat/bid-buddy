import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { Github } from "lucide-react";
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
        icon={Github}
        accentGradient="from-gray-600/50 via-gray-500/30 to-gray-400/50"
      />
      <GitHubSkillsContainer />
    </div>
  );
}
