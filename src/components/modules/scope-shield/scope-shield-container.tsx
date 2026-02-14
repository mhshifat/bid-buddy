/**
 * Scope Shield Container – main orchestrator for the Scope Shield page.
 * Bento-grid layout: scope list on the left, analyzer on the right.
 */

"use client";

import { useState } from "react";
import { ScopeShieldStats } from "./scope-shield-stats";
import { ScopeList } from "./scope-list";
import { ScopeCreepAnalyzer } from "./scope-creep-analyzer";
import { ChangeRequestHistory } from "./change-request-history";
import { DefineScopeDialog } from "./define-scope-dialog";
import { Shield } from "lucide-react";
import { trpc } from "@/lib/trpc/client";

export function ScopeShieldContainer() {
  const utils = trpc.useUtils();
  const [selectedScopeId, setSelectedScopeId] = useState<string | null>(null);
  const [selectedScopeTitle, setSelectedScopeTitle] = useState<string>("");

  function handleSelect(scopeId: string, scopeTitle: string) {
    setSelectedScopeId(scopeId);
    setSelectedScopeTitle(scopeTitle);
  }

  function handleCreated() {
    utils.scope.list.invalidate();
    utils.scope.stats.invalidate();
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <ScopeShieldStats />

      {/* Actions */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Your Project Scopes</h2>
        <DefineScopeDialog onCreated={handleCreated} />
      </div>

      {/* Main Content */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Scope List */}
        <div className="lg:col-span-2 space-y-4 animate-fade-in-up stagger-1">
          <ScopeList onSelect={handleSelect} selectedScopeId={selectedScopeId ?? undefined} />
        </div>

        {/* Right: Analyzer + History */}
        <div className="lg:col-span-3 space-y-4 animate-fade-in-up stagger-2">
          {selectedScopeId ? (
            <>
              <ScopeCreepAnalyzer scopeId={selectedScopeId} scopeTitle={selectedScopeTitle} />
              <ChangeRequestHistory scopeId={selectedScopeId} />
            </>
          ) : (
            <div className="relative overflow-hidden rounded-2xl border bg-card">
              <div className="shimmer-bg pointer-events-none absolute inset-0 rounded-2xl" />
              <div className="relative z-10 flex flex-col items-center justify-center py-16 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mb-4 animate-float">
                  <Shield className="h-8 w-8 text-primary/40" />
                </div>
                <h3 className="text-lg font-semibold">Select a Scope</h3>
                <p className="text-sm text-muted-foreground max-w-md mt-1">
                  Choose a project scope from the left to start checking client
                  messages for scope creep, or define a new scope to get started.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
