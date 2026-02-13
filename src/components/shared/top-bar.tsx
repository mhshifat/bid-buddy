/**
 * TopBar – header bar with sidebar trigger, notifications, and quick actions.
 */

"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth/auth-context";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { NotificationBell } from "@/components/shared/notification-bell";

interface TopBarProps {
  title?: string;
}

export function TopBar({ title }: TopBarProps) {
  const { logout, isAuthenticated } = useAuth();

  return (
    <header className="flex h-14 items-center gap-4 border-b bg-background px-6">
      <SidebarTrigger className="-ml-2" />
      <Separator orientation="vertical" className="h-6" />
      {title && (
        <h1 className="text-sm font-medium text-muted-foreground">{title}</h1>
      )}

      <div className="ml-auto flex items-center gap-2">
        <NotificationBell />

        {isAuthenticated && (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" onClick={logout}>
                <LogOut className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Sign out</TooltipContent>
          </Tooltip>
        )}
      </div>
    </header>
  );
}
