"use client";

/**
 * Alert Preferences Card — configures Extension Auto-Scan, notification
 * channels (Desktop, SMS, WhatsApp), match threshold, and categories.
 */

import { useState, useCallback, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Bell,
  Smartphone,
  MessageCircle,
  Monitor,
  Loader2,
  Save,
  X,
  Plus,
  ScanSearch,
  TestTube,
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";
import { toast } from "sonner";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
  showLocalNotification,
} from "@/lib/push-subscription";

// ============================================================================
// Upwork Categories (commonly used)
// ============================================================================

const UPWORK_CATEGORIES = [
  "Web Development",
  "Mobile Development",
  "Frontend Development",
  "Backend Development",
  "Full Stack Development",
  "WordPress",
  "Shopify Development",
  "E-commerce Development",
  "UI/UX Design",
  "Graphic Design",
  "Data Science",
  "Machine Learning",
  "DevOps & Cloud",
  "QA & Testing",
  "Database Administration",
  "API Development",
  "Blockchain",
  "Game Development",
  "Desktop Software",
  "IT & Networking",
  "Technical Writing",
  "Project Management",
  "Virtual Assistant",
  "Data Entry",
  "Accounting",
  "Other",
];

// ============================================================================
// Component
// ============================================================================

export function AlertPreferencesCard() {
  // ---------------------------------------------------------------------------
  // Fetch current preferences
  // ---------------------------------------------------------------------------

  const {
    data: preferences,
    isLoading,
    refetch,
  } = trpc.notification.getPreferences.useQuery(undefined, {
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });

  const updateMutation = trpc.notification.updatePreferences.useMutation({
    onSuccess: () => {
      toast.success("Alert preferences saved!");
      refetch();
    },
    onError: (err) => {
      toast.error("Failed to save preferences", {
        description: err.message,
      });
    },
  });

  const testMutation = trpc.notification.testChannel.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        toast.success(`Test notification sent via ${data.channel}`);
      } else {
        toast.error(`Test failed for ${data.channel}`, {
          description: data.error ?? "Unknown error",
        });
      }
    },
    onError: (err) => {
      toast.error("Test notification failed", { description: err.message });
    },
  });

  // ---------------------------------------------------------------------------
  // Local state (mirrors preferences + pending edits)
  // ---------------------------------------------------------------------------

  const [isEnabled, setIsEnabled] = useState(false);
  const [autoScanEnabled, setAutoScanEnabled] = useState(false);
  const [scanInterval, setScanInterval] = useState(10);
  const [minMatchPercentage, setMinMatchPercentage] = useState(80);
  const [categories, setCategories] = useState<string[]>([]);
  const [targetSkills, setTargetSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState("");

  // Desktop
  const [desktopEnabled, setDesktopEnabled] = useState(false);
  const [pushSubscribed, setPushSubscribed] = useState(false);
  const [pushRegistering, setPushRegistering] = useState(false);

  // SMS
  const [smsEnabled, setSmsEnabled] = useState(false);
  const [smsCountryCode, setSmsCountryCode] = useState("+1");
  const [smsPhoneNumber, setSmsPhoneNumber] = useState("");

  // WhatsApp
  const [whatsappEnabled, setWhatsappEnabled] = useState(false);
  const [whatsappCountryCode, setWhatsappCountryCode] = useState("+1");
  const [whatsappPhoneNumber, setWhatsappPhoneNumber] = useState("");

  // ---------------------------------------------------------------------------
  // Sync from server → local state
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!preferences) return;
    setIsEnabled(preferences.isEnabled);
    setAutoScanEnabled(preferences.autoScanEnabled);
    setScanInterval(preferences.scanIntervalMinutes);
    setMinMatchPercentage(preferences.minMatchPercentage);
    setCategories(preferences.categories);
    setTargetSkills(preferences.targetSkills);
    setDesktopEnabled(preferences.desktopEnabled);
    setPushSubscribed(!!preferences.pushSubscription);
    setSmsEnabled(preferences.smsEnabled);
    setSmsCountryCode(preferences.smsCountryCode ?? "+1");
    setSmsPhoneNumber(preferences.smsPhoneNumber ?? "");
    setWhatsappEnabled(preferences.whatsappEnabled);
    setWhatsappCountryCode(preferences.whatsappCountryCode ?? "+1");
    setWhatsappPhoneNumber(preferences.whatsappPhoneNumber ?? "");
  }, [preferences]);

  // ---------------------------------------------------------------------------
  // Desktop push subscription management
  // ---------------------------------------------------------------------------

  const handleDesktopToggle = useCallback(
    async (checked: boolean) => {
      setDesktopEnabled(checked);

      if (!checked) {
        // Turning off — unsubscribe and clear the subscription on the server
        try {
          await unsubscribeFromPush();
          setPushSubscribed(false);
          // Save immediately so the server knows the subscription is gone
          updateMutation.mutate({
            desktopEnabled: false,
            pushSubscription: null,
          });
        } catch {
          // Non-critical
        }
        return;
      }

      // Turning on — check support, request permission, register SW, subscribe
      if (!isPushSupported()) {
        toast.error(
          "Push notifications are not supported in this browser. Try Chrome or Edge.",
        );
        setDesktopEnabled(false);
        return;
      }

      setPushRegistering(true);
      try {
        const subscription = await subscribeToPush();
        setPushSubscribed(true);
        setPushRegistering(false);

        // Save the subscription to the server immediately
        updateMutation.mutate({
          desktopEnabled: true,
          pushSubscription: subscription as Record<string, unknown>,
        });

        toast.success(
          "Desktop notifications enabled! Click Test to verify.",
        );
      } catch (err) {
        setPushRegistering(false);
        setDesktopEnabled(false);
        const msg = err instanceof Error ? err.message : "Unknown error";
        toast.error("Failed to enable desktop notifications", {
          description: msg,
        });
      }
    },
    [updateMutation],
  );

  // ---------------------------------------------------------------------------
  // Test handler — for DESKTOP, also fire a local notification as fallback
  // ---------------------------------------------------------------------------

  const handleTest = useCallback(
    (channel: "DESKTOP" | "SMS" | "WHATSAPP" | "IN_APP") => {
      if (channel === "DESKTOP") {
        // Fire a local browser notification for instant feedback
        showLocalNotification(
          "🔔 Bid Buddy — Test Notification",
          "If you see this, desktop notifications are working!",
          "/dashboard",
        );
      }

      // Also test the server-side pipeline (Web Push for DESKTOP, Twilio for SMS/WhatsApp)
      testMutation.mutate({ channel });
    },
    [testMutation],
  );

  // ---------------------------------------------------------------------------
  // Save handler
  // ---------------------------------------------------------------------------

  const handleSave = useCallback(() => {
    // Build channels list based on toggles
    const channels: Array<"DESKTOP" | "SMS" | "WHATSAPP" | "IN_APP"> = [
      "IN_APP",
    ];
    if (desktopEnabled) channels.push("DESKTOP");
    if (smsEnabled) channels.push("SMS");
    if (whatsappEnabled) channels.push("WHATSAPP");

    updateMutation.mutate({
      isEnabled,
      autoScanEnabled,
      scanIntervalMinutes: scanInterval,
      minMatchPercentage,
      categories,
      targetSkills,
      channels,
      desktopEnabled,
      smsEnabled,
      smsPhoneNumber: smsPhoneNumber || null,
      smsCountryCode: smsCountryCode || null,
      whatsappEnabled,
      whatsappPhoneNumber: whatsappPhoneNumber || null,
      whatsappCountryCode: whatsappCountryCode || null,
    });
  }, [
    isEnabled,
    autoScanEnabled,
    scanInterval,
    minMatchPercentage,
    categories,
    targetSkills,
    desktopEnabled,
    smsEnabled,
    smsPhoneNumber,
    smsCountryCode,
    whatsappEnabled,
    whatsappPhoneNumber,
    whatsappCountryCode,
    updateMutation,
  ]);

  // ---------------------------------------------------------------------------
  // Skill / Category helpers
  // ---------------------------------------------------------------------------

  const addSkill = useCallback(() => {
    const skill = skillInput.trim();
    if (skill && !targetSkills.includes(skill)) {
      setTargetSkills((prev) => [...prev, skill]);
      setSkillInput("");
    }
  }, [skillInput, targetSkills]);

  const removeSkill = useCallback((skill: string) => {
    setTargetSkills((prev) => prev.filter((s) => s !== skill));
  }, []);

  const addCategory = useCallback(
    (cat: string) => {
      if (!categories.includes(cat)) {
        setCategories((prev) => [...prev, cat]);
      }
    },
    [categories],
  );

  const removeCategory = useCallback((cat: string) => {
    setCategories((prev) => prev.filter((c) => c !== cat));
  }, []);

  // ---------------------------------------------------------------------------
  // Loading state
  // ---------------------------------------------------------------------------

  if (isLoading) {
    return (
      <Card className="rounded-2xl border">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          <span className="ml-2 text-sm text-muted-foreground">
            Loading notification settings...
          </span>
        </CardContent>
      </Card>
    );
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <Card className="rounded-2xl border transition-all hover:shadow-lg hover:shadow-black/5 col-span-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Bell className="h-4 w-4 text-primary" />
              Smart Job Alerts & Auto-Scan
            </CardTitle>
            <CardDescription>
              Configure auto-scan, match threshold, categories, and notification
              channels.
            </CardDescription>
          </div>
          <Switch checked={isEnabled} onCheckedChange={setIsEnabled} />
        </div>
      </CardHeader>

      {isEnabled && (
        <CardContent className="space-y-6">
          {/* ================================================================
              Section 1: Extension Auto-Scan
              ================================================================ */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <ScanSearch className="h-4 w-4 text-blue-500" />
              <h3 className="text-sm font-semibold">Extension Auto-Scan</h3>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm">Enable Auto-Scan</Label>
                <p className="text-xs text-muted-foreground">
                  Periodically scan Upwork for new jobs matching your criteria
                </p>
              </div>
              <Switch
                checked={autoScanEnabled}
                onCheckedChange={setAutoScanEnabled}
              />
            </div>

            {autoScanEnabled && (
              <div className="ml-4 space-y-3 border-l-2 border-blue-200 pl-4">
                <div>
                  <Label className="text-xs">
                    Scan Interval: {scanInterval} minute{scanInterval !== 1 ? "s" : ""}
                  </Label>
                  <Slider
                    value={[scanInterval]}
                    onValueChange={([v]) => setScanInterval(v)}
                    min={1}
                    max={60}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                    <span>1 min</span>
                    <span>30 min</span>
                    <span>60 min</span>
                  </div>
                </div>

                <div className="rounded-md bg-blue-50 dark:bg-blue-900/20 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5">
                    <RefreshCw className="h-3 w-3 text-blue-500" />
                    <span className="text-xs font-medium text-blue-700 dark:text-blue-300">
                      Extension Sync
                    </span>
                  </div>
                  <p className="text-[11px] text-blue-600 dark:text-blue-400">
                    The Bid Buddy browser extension syncs these settings
                    automatically every 5 minutes. After saving, the extension
                    will pick up your changes on the next sync cycle.
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Make sure the extension is installed and the web app is
                    running at{" "}
                    <code className="text-[10px]">localhost:3000</code>.
                  </p>
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* ================================================================
              Section 2: Match Threshold
              ================================================================ */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <RefreshCw className="h-4 w-4 text-amber-500" />
              Match Threshold
            </h3>

            <div>
              <Label className="text-xs">
                Minimum Match Score: {minMatchPercentage}%
              </Label>
              <p className="text-xs text-muted-foreground mb-2">
                Only notify when a job matches ≥ this percentage
              </p>
              <Slider
                value={[minMatchPercentage]}
                onValueChange={([v]) => setMinMatchPercentage(v)}
                min={50}
                max={100}
                step={5}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                <span>50%</span>
                <span>75%</span>
                <span>100%</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* ================================================================
              Section 3: Categories
              ================================================================ */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Categories to Watch</h3>
            <p className="text-xs text-muted-foreground">
              Select Upwork job categories you want to monitor
            </p>

            {categories.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {categories.map((cat) => (
                  <Badge
                    key={cat}
                    variant="secondary"
                    className="text-xs gap-1 pr-1"
                  >
                    {cat}
                    <button
                      type="button"
                      onClick={() => removeCategory(cat)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <Select onValueChange={addCategory}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Add a category..." />
              </SelectTrigger>
              <SelectContent>
                {UPWORK_CATEGORIES.filter(
                  (cat) => !categories.includes(cat),
                ).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Separator />

          {/* ================================================================
              Section 4: Target Skills
              ================================================================ */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold">Target Skills</h3>
            <p className="text-xs text-muted-foreground">
              Skills to match against job requirements
            </p>

            {targetSkills.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {targetSkills.map((skill) => (
                  <Badge
                    key={skill}
                    variant="outline"
                    className="text-xs gap-1 pr-1"
                  >
                    {skill}
                    <button
                      type="button"
                      onClick={() => removeSkill(skill)}
                      className="ml-0.5 hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}

            <div className="flex gap-2">
              <Input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addSkill();
                  }
                }}
                placeholder="Type a skill and press Enter..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addSkill}
                disabled={!skillInput.trim()}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
          </div>

          <Separator />

          {/* ================================================================
              Section 5: Notification Channels
              ================================================================ */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <Bell className="h-4 w-4 text-violet-500" />
              Notification Channels
            </h3>

            {/* ---- Desktop Push Notifications ---- */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-sky-500" />
                  <div>
                    <Label className="text-sm font-medium">
                      Desktop Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Browser push notifications (requires permission)
                    </p>
                  </div>
                </div>
                <Switch
                  checked={desktopEnabled}
                  onCheckedChange={handleDesktopToggle}
                  disabled={pushRegistering}
                />
              </div>

              {pushRegistering && (
                <div className="ml-6 flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin text-sky-500" />
                  <span className="text-xs text-muted-foreground">
                    Registering push subscription...
                  </span>
                </div>
              )}

              {desktopEnabled && !pushRegistering && (
                <div className="ml-6 space-y-2">
                  <div className="flex items-center gap-2">
                    {pushSubscribed ? (
                      <>
                        <CheckCircle className="h-3 w-3 text-emerald-500" />
                        <span className="text-xs text-emerald-600">
                          Push subscription active
                        </span>
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 text-amber-500" />
                        <span className="text-xs text-amber-600">
                          Push subscription not registered — toggle off and on
                          to retry
                        </span>
                      </>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 px-2 text-xs ml-auto"
                      onClick={() => handleTest("DESKTOP")}
                      disabled={testMutation.isPending}
                    >
                      <TestTube className="h-3 w-3 mr-1" />
                      Test
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* ---- SMS Notifications ---- */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-green-500" />
                  <div>
                    <Label className="text-sm font-medium">
                      SMS Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive text messages for job matches
                    </p>
                  </div>
                </div>
                <Switch
                  checked={smsEnabled}
                  onCheckedChange={setSmsEnabled}
                />
              </div>

              {smsEnabled && (
                <div className="ml-6 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-24">
                      <Label className="text-xs">Country Code</Label>
                      <Input
                        value={smsCountryCode}
                        onChange={(e) => setSmsCountryCode(e.target.value)}
                        placeholder="+1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">Phone Number</Label>
                      <Input
                        value={smsPhoneNumber}
                        onChange={(e) => setSmsPhoneNumber(e.target.value)}
                        placeholder="555-123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {smsPhoneNumber && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] text-muted-foreground">
                        Requires Twilio configuration (TWILIO_ACCOUNT_SID,
                        TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER env vars)
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs ml-auto"
                        onClick={() => handleTest("SMS")}
                        disabled={testMutation.isPending}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ---- WhatsApp Notifications ---- */}
            <div className="rounded-lg border p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 text-emerald-500" />
                  <div>
                    <Label className="text-sm font-medium">
                      WhatsApp Notifications
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Receive WhatsApp messages for job matches
                    </p>
                  </div>
                </div>
                <Switch
                  checked={whatsappEnabled}
                  onCheckedChange={setWhatsappEnabled}
                />
              </div>

              {whatsappEnabled && (
                <div className="ml-6 space-y-3">
                  <div className="flex gap-2">
                    <div className="w-24">
                      <Label className="text-xs">Country Code</Label>
                      <Input
                        value={whatsappCountryCode}
                        onChange={(e) =>
                          setWhatsappCountryCode(e.target.value)
                        }
                        placeholder="+1"
                        className="mt-1"
                      />
                    </div>
                    <div className="flex-1">
                      <Label className="text-xs">WhatsApp Number</Label>
                      <Input
                        value={whatsappPhoneNumber}
                        onChange={(e) =>
                          setWhatsappPhoneNumber(e.target.value)
                        }
                        placeholder="555-123-4567"
                        className="mt-1"
                      />
                    </div>
                  </div>

                  {whatsappPhoneNumber && (
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-3 w-3 text-amber-500" />
                      <span className="text-[10px] text-muted-foreground">
                        Requires Twilio WhatsApp setup
                        (TWILIO_WHATSAPP_NUMBER env var)
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 px-2 text-xs ml-auto"
                        onClick={() => handleTest("WHATSAPP")}
                        disabled={testMutation.isPending}
                      >
                        <TestTube className="h-3 w-3 mr-1" />
                        Test
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Separator />

          {/* ================================================================
              Diagnostics Panel
              ================================================================ */}
          <NotificationDiagnostics />

          <Separator />

          {/* ================================================================
              Save Button
              ================================================================ */}
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={updateMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Reset
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="h-3.5 w-3.5 mr-1 animate-spin" />
              ) : (
                <Save className="h-3.5 w-3.5 mr-1" />
              )}
              Save Preferences
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// ============================================================================
// Diagnostics Sub-Component
// ============================================================================

function NotificationDiagnostics() {
  const [expanded, setExpanded] = useState(false);
  const { data: diag, isLoading, refetch } = trpc.notification.diagnostics.useQuery(
    undefined,
    { enabled: expanded, staleTime: 10_000 },
  );

  return (
    <div className="space-y-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        <AlertTriangle className="h-3.5 w-3.5" />
        {expanded ? "▼" : "▶"} Notification Diagnostics
      </button>

      {expanded && (
        <div className="rounded-lg border bg-muted/30 p-3 space-y-3 text-xs">
          {isLoading ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-3 w-3 animate-spin" />
              Checking pipeline…
            </div>
          ) : diag ? (
            <>
              {/* Issues */}
              {diag.issues.length > 0 && (
                <div className="space-y-1.5">
                  <span className="font-semibold text-amber-600">Issues found:</span>
                  {diag.issues.map((issue, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <XCircle className="h-3 w-3 text-amber-500 mt-0.5 shrink-0" />
                      <span>{issue}</span>
                    </div>
                  ))}
                </div>
              )}
              {diag.issues.length === 0 && (
                <div className="flex gap-2 items-center text-green-600">
                  <CheckCircle className="h-3 w-3" />
                  Pipeline looks healthy — no issues detected.
                </div>
              )}

              {/* State */}
              {diag.preferences && (
                <div className="grid grid-cols-2 gap-1 text-[11px]">
                  <span className="text-muted-foreground">Alerts enabled:</span>
                  <span>{diag.preferences.isEnabled ? "✅ Yes" : "❌ No"}</span>
                  <span className="text-muted-foreground">Desktop push:</span>
                  <span>
                    {diag.preferences.desktopEnabled ? "✅ Enabled" : "❌ Off"}
                    {diag.preferences.desktopEnabled && (
                      <> · Sub: {diag.preferences.hasPushSubscription ? "✅" : "❌ Missing"}</>
                    )}
                  </span>
                  <span className="text-muted-foreground">Desktop provider:</span>
                  <span>{diag.desktopProviderHealthy ? "✅ Healthy" : "❌ Unhealthy"}</span>
                  <span className="text-muted-foreground">Min match %:</span>
                  <span>{diag.preferences.minMatchPercentage}%</span>
                </div>
              )}

              {/* Recent logs */}
              {diag.recentNotifications.length > 0 && (
                <div className="space-y-1">
                  <span className="font-semibold">Recent notification log:</span>
                  {diag.recentNotifications.map((log) => (
                    <div
                      key={log.id}
                      className="flex items-center gap-2 text-[10px]"
                    >
                      {log.status === "sent" ? (
                        <CheckCircle className="h-2.5 w-2.5 text-green-500 shrink-0" />
                      ) : (
                        <XCircle className="h-2.5 w-2.5 text-red-500 shrink-0" />
                      )}
                      <Badge variant="outline" className="text-[9px] px-1 py-0">
                        {log.channel}
                      </Badge>
                      <span className="truncate">{log.title}</span>
                      {log.errorMessage && (
                        <span className="text-red-500 truncate">
                          — {log.errorMessage}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
              {diag.recentNotifications.length === 0 && (
                <div className="text-muted-foreground">
                  No notification logs yet. Logs appear after auto-scan finds matching jobs.
                </div>
              )}

              <Button
                variant="ghost"
                size="sm"
                className="h-6 px-2 text-[10px]"
                onClick={() => refetch()}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Refresh
              </Button>
            </>
          ) : null}
        </div>
      )}
    </div>
  );
}
