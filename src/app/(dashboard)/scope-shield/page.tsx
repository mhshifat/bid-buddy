/**
 * Scope Shield Page – protect yourself from scope creep.
 */

import type { Metadata } from "next";
import { Shield } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ScopeShieldContainer } from "@/components/modules/scope-shield/scope-shield-container";

export const metadata: Metadata = {
  title: "Scope Shield",
  description: "Protect yourself from scope creep with AI-powered detection and diplomatic response tools.",
};

export default function ScopeShieldPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Scope Shield"
        description="Define your project scope, detect scope creep from client messages, generate diplomatic responses, and create change orders."
        icon={Shield}
        accentGradient="from-red-500/50 via-orange-500/30 to-amber-500/50"
      />
      <ScopeShieldContainer />
    </div>
  );
}
