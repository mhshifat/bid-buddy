"use client";

/**
 * Portfolio Websites Card — manage live sites to include in AI proposal footer.
 */

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Globe, Plus, Trash2, Loader2, Save } from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";

export function PortfolioWebsitesCard() {
  const { data: websites, isLoading, refetch } = trpc.portfolio.list.useQuery();
  const setMutation = trpc.portfolio.set.useMutation({
    onSuccess: () => {
      refetch();
      toast.success("Portfolio websites saved. They will appear in the proposal footer.");
    },
    onError: (err) => {
      toast.error(err.message ?? "Failed to save");
    },
  });

  const [rows, setRows] = useState<{ url: string; label: string }[]>([]);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    if (websites) {
      setRows(
        websites.length > 0
          ? websites.map((w) => ({ url: w.url, label: w.label ?? "" }))
          : [{ url: "", label: "" }]
      );
      setHasChanges(false);
    }
  }, [websites]);

  const addRow = () => {
    setRows((prev) => [...prev, { url: "", label: "" }]);
    setHasChanges(true);
  };

  const removeRow = (index: number) => {
    setRows((prev) => {
      const next = prev.filter((_, i) => i !== index);
      return next.length === 0 ? [{ url: "", label: "" }] : next;
    });
    setHasChanges(true);
  };

  const updateRow = (index: number, field: "url" | "label", value: string) => {
    setRows((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: value } : r))
    );
    setHasChanges(true);
  };

  const handleSave = () => {
    const valid = rows.filter((r) => r.url.trim() !== "");
    const invalid = valid.some((r) => {
      try {
        new URL(r.url);
        return false;
      } catch {
        return true;
      }
    });
    if (valid.length > 0 && invalid) {
      toast.error("All URLs must be valid (e.g. https://example.com).");
      return;
    }
    setMutation.mutate({
      websites: valid.map((r) => ({
        url: r.url.trim(),
        label: r.label.trim() || undefined,
      })),
    });
    setHasChanges(false);
  };

  if (isLoading) {
    return (
      <Card className="rounded-2xl border">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Globe className="h-4 w-4" />
            Portfolio Websites
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading…
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="rounded-2xl border transition-all hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5">
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Portfolio Websites
        </CardTitle>
        <CardDescription>
          Add your live websites or demos. They will be included as a footer at the end of AI-generated proposals (e.g. &quot;Portfolio: My App | Demo&quot;).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {rows.map((row, index) => (
          <div key={index} className="flex flex-col sm:flex-row gap-2">
            <div className="flex-1 space-y-2">
              <Label className="text-xs">URL</Label>
              <Input
                placeholder="https://myapp.com"
                value={row.url}
                onChange={(e) => updateRow(index, "url", e.target.value)}
                className="font-mono text-sm"
              />
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-xs">Label (optional)</Label>
              <Input
                placeholder="My SaaS App"
                value={row.label}
                onChange={(e) => updateRow(index, "label", e.target.value)}
                className="text-sm"
              />
            </div>
            <div className="flex items-end gap-1">
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeRow(index)}
                title="Remove"
                className="text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" size="sm" onClick={addRow}>
            <Plus className="h-4 w-4 mr-1" />
            Add website
          </Button>
          {hasChanges && (
            <Button
              type="button"
              size="sm"
              onClick={handleSave}
              disabled={setMutation.isPending}
            >
              {setMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
