import type { Metadata } from "next";
import { createPageMetadata } from "@/lib/seo/config";
import { Users } from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { ClientList } from "@/components/modules/clients/client-list";

export const metadata: Metadata = createPageMetadata(
  "Clients",
  "Manage your Upwork client relationships."
);

export default function ClientsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Clients"
        description="Track your client relationships and communication history."
        icon={Users}
        accentGradient="from-amber-500/50 via-orange-500/30 to-red-500/50"
      />
      <ClientList />
    </div>
  );
}
