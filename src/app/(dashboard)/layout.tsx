/**
 * Dashboard Layout – wraps all authenticated pages with providers.
 *
 * Includes:
 *   - AuthProvider  (client-side auth state)
 *   - TrpcProvider  (tRPC + React Query)
 *   - Sidebar + TopBar chrome
 */

import { redirect } from "next/navigation";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/shared/app-sidebar";
import { TopBar } from "@/components/shared/top-bar";
import { TrpcProvider } from "@/lib/trpc/provider";
import { AuthProvider } from "@/lib/auth/auth-context";
import { RealtimeToastProvider } from "@/components/shared/realtime-toast-provider";
import { getServerSession } from "@/server/auth/get-session";
import type { AuthUser } from "@/lib/auth/auth-context";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Validate session server-side – redirect to login immediately if invalid.
  const sessionData = await getServerSession();

  if (!sessionData) {
    redirect("/login");
  }

  const initialUser: AuthUser = sessionData.user;

  return (
    <AuthProvider initialUser={initialUser}>
      <TrpcProvider>
        <TooltipProvider>
          <RealtimeToastProvider />
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset className="overflow-hidden">
              <TopBar />
              <div className="flex-1 overflow-y-auto overflow-x-hidden p-6">{children}</div>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </TrpcProvider>
    </AuthProvider>
  );
}
