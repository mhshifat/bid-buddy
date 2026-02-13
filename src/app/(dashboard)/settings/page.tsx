import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileOptimizerCard } from "@/components/modules/settings/profile-optimizer-card";
import { StyleTrainerCard } from "@/components/modules/settings/style-trainer-card";

export const metadata: Metadata = createPageMetadata(
  "Settings",
  "Configure your Bid Buddy preferences."
);

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Settings"
        description="Configure your profile, integrations, and preferences."
      />
      <div className="grid gap-6 lg:grid-cols-2">
        <ProfileOptimizerCard />
        <StyleTrainerCard />
        <Card>
          <CardHeader>
            <CardTitle className="text-base">GitHub Integration</CardTitle>
            <CardDescription>Connect GitHub for AI skill analysis.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Visit the <a href="/github" className="text-primary hover:underline">GitHub Skills</a> page to connect your account.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">AI Configuration</CardTitle>
            <CardDescription>Configure AI analysis and proposal generation.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              AI configuration coming soon.
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notifications</CardTitle>
            <CardDescription>Configure how you receive alerts.</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Notification settings coming soon.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
