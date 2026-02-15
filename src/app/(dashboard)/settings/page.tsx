import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { Settings } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ProfileOptimizerCard } from "@/components/modules/settings/profile-optimizer-card";
import { StyleTrainerCard } from "@/components/modules/settings/style-trainer-card";
import { AlertPreferencesCard } from "@/components/modules/settings/alert-preferences-card";

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
        icon={Settings}
        accentGradient="from-gray-400/40 via-slate-400/30 to-zinc-400/40"
      />
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Alert Preferences — full width, top of grid */}
        <div className="animate-fade-in-up stagger-1 col-span-full">
          <AlertPreferencesCard />
        </div>
        <div className="animate-fade-in-up stagger-2">
          <ProfileOptimizerCard />
        </div>
        <div className="animate-fade-in-up stagger-3">
          <StyleTrainerCard />
        </div>
        <div className="animate-fade-in-up stagger-4">
          <Card className="rounded-2xl border transition-all hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5">
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
        </div>
        <div className="animate-fade-in-up stagger-5">
          <Card className="rounded-2xl border transition-all hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5">
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
        </div>
      </div>
    </div>
  );
}
