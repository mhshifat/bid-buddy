/**
 * Dashboard Layout – wraps all authenticated pages with providers.
 *
 * Includes:
 *   - AuthProvider  (client-side auth state)
 *   - TrpcProvider  (tRPC + React Query)
 *   - Sidebar + TopBar chrome
 */

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
  // Pre-fetch session on the server so the AuthProvider has it immediately
  const sessionData = await getServerSession();

  const initialUser: AuthUser | null = sessionData
    ? sessionData.user
    : null;

  return (
    <AuthProvider initialUser={initialUser}>
      <TrpcProvider>
        <TooltipProvider>
          <RealtimeToastProvider />
          <SidebarProvider>
            <AppSidebar />
            <SidebarInset>
              <TopBar />
              <main className="flex-1 overflow-auto p-6">{children}</main>
            </SidebarInset>
          </SidebarProvider>
        </TooltipProvider>
      </TrpcProvider>
    </AuthProvider>
  );
}
