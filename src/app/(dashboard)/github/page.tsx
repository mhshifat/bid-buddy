import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GitBranch } from "lucide-react";

export const metadata: Metadata = createPageMetadata(
  "GitHub Skills",
  "Sync your GitHub profile for AI-powered skill detection."
);

export default function GithubPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="GitHub Skills"
        description="Connect your GitHub account to automatically detect skills and enhance AI analysis."
      />
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-20">
          <GitBranch className="h-12 w-12 text-muted-foreground" />
          <h2 className="mt-4 text-lg font-semibold">Connect GitHub</h2>
          <p className="mt-2 max-w-md text-center text-sm text-muted-foreground">
            Link your GitHub profile to automatically extract your tech stack,
            top languages, and project experience. This data powers more accurate
            AI job matching and proposal generation.
          </p>
          <Button className="mt-6">
            <GitBranch className="mr-2 h-4 w-4" />
            Connect GitHub Account
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

