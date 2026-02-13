"use client";

/**
 * GitHub Languages Card – displays the top languages from synced repos
 * as a horizontal bar chart with percentage labels.
 */

import { Code2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

// Map of language → tailwind colour class
const LANGUAGE_COLORS: Record<string, string> = {
  TypeScript: "bg-blue-500",
  JavaScript: "bg-yellow-400",
  Python: "bg-green-500",
  Rust: "bg-orange-600",
  Go: "bg-cyan-500",
  Java: "bg-red-500",
  "C#": "bg-purple-600",
  "C++": "bg-pink-500",
  C: "bg-gray-500",
  Ruby: "bg-red-600",
  PHP: "bg-indigo-400",
  Swift: "bg-orange-500",
  Kotlin: "bg-violet-500",
  Dart: "bg-teal-500",
  Shell: "bg-emerald-600",
  HTML: "bg-orange-400",
  CSS: "bg-blue-400",
  SCSS: "bg-pink-400",
  Vue: "bg-green-400",
  Svelte: "bg-red-400",
};

function getColor(language: string): string {
  return LANGUAGE_COLORS[language] ?? "bg-gray-400";
}

interface GitHubLanguagesCardProps {
  topLanguages: Record<string, number> | null;
}

export function GitHubLanguagesCard({
  topLanguages,
}: GitHubLanguagesCardProps) {
  if (!topLanguages || Object.keys(topLanguages).length === 0) {
    return null;
  }

  const entries = Object.entries(topLanguages).slice(0, 12);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Code2 className="h-4 w-4" />
          Top Languages
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {entries.map(([lang, pct]) => (
          <div key={lang} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">{lang}</span>
              <span className="text-muted-foreground">{pct}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${getColor(lang)} transition-all`}
                style={{ width: `${Math.min(pct, 100)}%` }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

