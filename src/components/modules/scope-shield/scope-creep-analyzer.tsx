/**
 * Scope Creep Analyzer – paste a client message and the AI tells you
 * if it's in-scope or out-of-scope, with actionable next steps.
 */

"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldQuestion,
  AlertTriangle,
  Clock,
  DollarSign,
  Loader2,
  Copy,
  MessageSquareReply,
  FileText,
} from "lucide-react";
import { trpc } from "@/lib/trpc/client";

interface ScopeCreepAnalyzerProps {
  scopeId: string;
  scopeTitle: string;
}

type DetectionResult = {
  changeRequestId: string;
  isOutOfScope: boolean;
  confidence: number;
  verdict: "IN_SCOPE" | "OUT_OF_SCOPE" | "GRAY_AREA";
  reasoning: string;
  originalScopeItems: string[];
  requestedItems: string[];
  overlappingItems: string[];
  newItems: string[];
  riskLevel: "low" | "medium" | "high";
  impactAssessment: {
    timeImpact: string;
    costImpact: string;
    qualityImpact: string;
  };
  suggestedAction: "accept" | "negotiate" | "decline";
  quickSummary: string;
};

type DiplomaticResult = {
  response: string;
  tone: string;
  keyPoints: string[];
  whatToAvoidSaying: string[];
  followUpSuggestions: string[];
  alternativeOffers: string[];
  escalationPath: string;
};

type ChangeOrderResult = {
  summary: string;
  lineItems: { description: string; hours: number; rate: number; total: number }[];
  totalAdditionalCost: number;
  totalAdditionalHours: number;
  newTimeline: string;
  justification: string;
  termsAndConditions: string[];
  clientMessage: string;
  paymentTerms: string;
  notes: string[];
};

export function ScopeCreepAnalyzer({ scopeId, scopeTitle }: ScopeCreepAnalyzerProps) {
  const [clientMessage, setClientMessage] = useState("");
  const [detection, setDetection] = useState<DetectionResult | null>(null);
  const [diplomaticResponse, setDiplomaticResponse] = useState<DiplomaticResult | null>(null);
  const [changeOrder, setChangeOrder] = useState<ChangeOrderResult | null>(null);
  const [copiedField, setCopiedField] = useState<string | null>(null);

  const detectMutation = trpc.scope.detectCreep.useMutation({
    onSuccess: (data) => {
      setDetection(data as unknown as DetectionResult);
      setDiplomaticResponse(null);
      setChangeOrder(null);
    },
  });

  const responseMutation = trpc.scope.generateResponse.useMutation({
    onSuccess: (data) => setDiplomaticResponse(data as DiplomaticResult),
  });

  const changeOrderMutation = trpc.scope.generateChangeOrder.useMutation({
    onSuccess: (data) => setChangeOrder(data as ChangeOrderResult),
  });

  function handleDetect() {
    detectMutation.mutate({ scopeId, clientMessage });
  }

  function handleGenerateResponse(tone: "firm" | "friendly" | "neutral") {
    if (!detection) return;
    responseMutation.mutate({ changeRequestId: detection.changeRequestId, tone });
  }

  function handleGenerateChangeOrder() {
    if (!detection) return;
    changeOrderMutation.mutate({ changeRequestId: detection.changeRequestId });
  }

  async function copyToClipboard(text: string, field: string) {
    await navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  }

  const verdictConfig = {
    IN_SCOPE: { icon: ShieldCheck, color: "text-green-600", bg: "bg-green-50", badge: "default" as const, label: "In Scope" },
    OUT_OF_SCOPE: { icon: ShieldAlert, color: "text-red-600", bg: "bg-red-50", badge: "destructive" as const, label: "Out of Scope" },
    GRAY_AREA: { icon: ShieldQuestion, color: "text-yellow-600", bg: "bg-yellow-50", badge: "secondary" as const, label: "Gray Area" },
  };

  return (
    <div className="space-y-4">
      {/* Message Input */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Shield className="h-4 w-4" />
            Analyse Client Message
          </CardTitle>
          <CardDescription>
            Paste the client&apos;s message and the AI will check it against &ldquo;{scopeTitle}&rdquo;
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <Textarea
            placeholder="Paste the client's message here... e.g. 'Hey, can you also add a login page and user dashboard? That would be great!'"
            rows={4}
            value={clientMessage}
            onChange={(e) => setClientMessage(e.target.value)}
          />
          <Button
            onClick={handleDetect}
            disabled={!clientMessage.trim() || detectMutation.isPending}
            className="w-full"
          >
            {detectMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Analysing...
              </>
            ) : (
              <>
                <Shield className="mr-2 h-4 w-4" />
                Check for Scope Creep
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Detection Result */}
      {detection && (
        <Card>
          <CardHeader className={`${verdictConfig[detection.verdict].bg} rounded-t-lg`}>
            <div className="flex items-center justify-between">
              <CardTitle className={`flex items-center gap-2 text-lg ${verdictConfig[detection.verdict].color}`}>
                {(() => { const Icon = verdictConfig[detection.verdict].icon; return <Icon className="h-5 w-5" />; })()}
                {verdictConfig[detection.verdict].label}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant={verdictConfig[detection.verdict].badge}>
                  {detection.confidence}% confident
                </Badge>
                <Badge variant={detection.riskLevel === "high" ? "destructive" : detection.riskLevel === "medium" ? "secondary" : "default"}>
                  {detection.riskLevel} risk
                </Badge>
              </div>
            </div>
            <p className="text-sm mt-1 font-medium">{detection.quickSummary}</p>
          </CardHeader>

          <CardContent className="space-y-4 pt-4">
            {/* Reasoning */}
            <div>
              <h4 className="text-sm font-semibold mb-1">Analysis</h4>
              <p className="text-sm text-muted-foreground">{detection.reasoning}</p>
            </div>

            {/* Impact Assessment */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <Clock className="h-3 w-3" />
                  Time Impact
                </div>
                <p className="text-sm">{detection.impactAssessment.timeImpact}</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <DollarSign className="h-3 w-3" />
                  Cost Impact
                </div>
                <p className="text-sm">{detection.impactAssessment.costImpact}</p>
              </div>
              <div className="rounded-lg border p-3">
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground mb-1">
                  <AlertTriangle className="h-3 w-3" />
                  Quality Impact
                </div>
                <p className="text-sm">{detection.impactAssessment.qualityImpact}</p>
              </div>
            </div>

            {/* New Items vs Overlapping */}
            {detection.newItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1 text-red-600">New (Out-of-Scope) Items</h4>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {detection.newItems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

            {detection.overlappingItems.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1 text-green-600">Overlapping (In-Scope) Items</h4>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {detection.overlappingItems.map((item, i) => <li key={i}>{item}</li>)}
                </ul>
              </div>
            )}

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Suggested Action: <span className="capitalize">{detection.suggestedAction}</span></h4>
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateResponse("friendly")}
                  disabled={responseMutation.isPending}
                >
                  {responseMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquareReply className="mr-1 h-3 w-3" />}
                  Friendly Response
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateResponse("neutral")}
                  disabled={responseMutation.isPending}
                >
                  {responseMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquareReply className="mr-1 h-3 w-3" />}
                  Neutral Response
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateResponse("firm")}
                  disabled={responseMutation.isPending}
                >
                  {responseMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <MessageSquareReply className="mr-1 h-3 w-3" />}
                  Firm Response
                </Button>
                {detection.isOutOfScope && (
                  <Button
                    size="sm"
                    onClick={handleGenerateChangeOrder}
                    disabled={changeOrderMutation.isPending}
                  >
                    {changeOrderMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : <FileText className="mr-1 h-3 w-3" />}
                    Generate Change Order
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Diplomatic Response */}
      {diplomaticResponse && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <MessageSquareReply className="h-4 w-4" />
              Diplomatic Response ({diplomaticResponse.tone})
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="relative rounded-lg border bg-muted/30 p-4">
              <pre className="whitespace-pre-wrap text-sm font-sans">{diplomaticResponse.response}</pre>
              <Button
                variant="ghost"
                size="icon"
                className="absolute top-2 right-2"
                onClick={() => copyToClipboard(diplomaticResponse.response, "response")}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              {copiedField === "response" && (
                <span className="absolute top-2.5 right-10 text-xs text-green-600">Copied!</span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="text-sm font-semibold mb-1 text-green-600">Key Points</h4>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {diplomaticResponse.keyPoints.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1 text-red-600">What NOT to Say</h4>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {diplomaticResponse.whatToAvoidSaying.map((p, i) => <li key={i}>{p}</li>)}
                </ul>
              </div>
            </div>

            {diplomaticResponse.alternativeOffers.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold mb-1">Alternative Offers</h4>
                <ul className="list-disc list-inside text-sm space-y-0.5">
                  {diplomaticResponse.alternativeOffers.map((o, i) => <li key={i}>{o}</li>)}
                </ul>
              </div>
            )}

            <div>
              <h4 className="text-sm font-semibold mb-1">If Client Pushes Back</h4>
              <p className="text-sm text-muted-foreground">{diplomaticResponse.escalationPath}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Change Order */}
      {changeOrder && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText className="h-4 w-4" />
              Change Order
            </CardTitle>
            <CardDescription>{changeOrder.summary}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Line Items Table */}
            <div className="rounded-lg border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Description</th>
                    <th className="text-right px-3 py-2 font-medium">Hours</th>
                    <th className="text-right px-3 py-2 font-medium">Rate</th>
                    <th className="text-right px-3 py-2 font-medium">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {changeOrder.lineItems.map((item, i) => (
                    <tr key={i} className="border-t">
                      <td className="px-3 py-2">{item.description}</td>
                      <td className="text-right px-3 py-2">{item.hours}h</td>
                      <td className="text-right px-3 py-2">${item.rate}</td>
                      <td className="text-right px-3 py-2 font-medium">${item.total}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-muted/30 font-semibold">
                  <tr className="border-t">
                    <td className="px-3 py-2">Total Additional</td>
                    <td className="text-right px-3 py-2">{changeOrder.totalAdditionalHours}h</td>
                    <td className="px-3 py-2"></td>
                    <td className="text-right px-3 py-2">${changeOrder.totalAdditionalCost}</td>
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* New Timeline & Payment */}
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">New Timeline</h4>
                <p className="text-sm">{changeOrder.newTimeline}</p>
              </div>
              <div className="rounded-lg border p-3">
                <h4 className="text-xs font-medium text-muted-foreground mb-1">Payment Terms</h4>
                <p className="text-sm">{changeOrder.paymentTerms}</p>
              </div>
            </div>

            {/* Client Message */}
            <div>
              <h4 className="text-sm font-semibold mb-1">Message to Send to Client</h4>
              <div className="relative rounded-lg border bg-muted/30 p-4">
                <pre className="whitespace-pre-wrap text-sm font-sans">{changeOrder.clientMessage}</pre>
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={() => copyToClipboard(changeOrder.clientMessage, "changeOrderMsg")}
                >
                  <Copy className="h-3.5 w-3.5" />
                </Button>
                {copiedField === "changeOrderMsg" && (
                  <span className="absolute top-2.5 right-10 text-xs text-green-600">Copied!</span>
                )}
              </div>
            </div>

            {/* Terms */}
            <div>
              <h4 className="text-sm font-semibold mb-1">Terms & Conditions</h4>
              <ul className="list-disc list-inside text-sm space-y-0.5">
                {changeOrder.termsAndConditions.map((t, i) => <li key={i}>{t}</li>)}
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

