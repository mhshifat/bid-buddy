/**
 * UserMenu – Inline user profile displayed in the sidebar footer.
 *
 * Shows avatar, name, and email. Click opens a dropdown with
 * profile, settings, and sign-out options.
 *
 * Displays a skeleton loader while auth state is loading.
 */

"use client";

import { useAuth } from "@/lib/auth/auth-context";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Settings, User, ChevronUp } from "lucide-react";
import Link from "next/link";
import { Skeleton } from "@/components/ui/skeleton";

export function UserMenu() {
  const { user, isLoading, logout } = useAuth();

  // Skeleton state
  if (isLoading) {
    return (
      <div className="flex items-center gap-3 rounded-lg p-1.5">
        <Skeleton className="h-8 w-8 rounded-full shrink-0" />
        <div className="flex-1 space-y-1 min-w-0">
          <Skeleton className="h-3.5 w-24" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    );
  }

  if (!user) return null;

  const initials = user.name
    .split(" ")
    .map((word) => word[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className="
            flex w-full items-center gap-3 rounded-lg p-1.5 text-left
            transition-colors hover:bg-sidebar-accent
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-ring
            group/user
          "
        >
          <Avatar className="h-8 w-8 shrink-0 ring-1 ring-border/50">
            {user.avatarUrl && (
              <AvatarImage src={user.avatarUrl} alt={user.name} />
            )}
            <AvatarFallback className="text-[10px] font-semibold bg-primary/10 text-primary">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium leading-tight">
              {user.name}
            </p>
            <p className="truncate text-[11px] text-muted-foreground leading-tight">
              {user.email}
            </p>
          </div>
          <ChevronUp className="h-3.5 w-3.5 shrink-0 text-muted-foreground/40 transition-transform group-hover/user:text-muted-foreground" />
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent
        align="start"
        side="top"
        sideOffset={8}
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56 rounded-xl"
      >
        <DropdownMenuLabel className="py-2">
          <div className="flex items-center gap-3">
            <Avatar className="h-9 w-9 shrink-0">
              {user.avatarUrl && (
                <AvatarImage src={user.avatarUrl} alt={user.name} />
              )}
              <AvatarFallback className="text-xs font-semibold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs font-normal text-muted-foreground">
                {user.email}
              </p>
            </div>
          </div>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        <DropdownMenuItem asChild className="gap-2.5 py-2">
          <Link href="/settings">
            <User className="h-4 w-4 text-muted-foreground" />
            Profile
          </Link>
        </DropdownMenuItem>

        <DropdownMenuItem asChild className="gap-2.5 py-2">
          <Link href="/settings">
            <Settings className="h-4 w-4 text-muted-foreground" />
            Settings
          </Link>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        <DropdownMenuItem
          onClick={logout}
          className="gap-2.5 py-2 text-destructive focus:text-destructive focus:bg-destructive/10"
        >
          <LogOut className="h-4 w-4" />
          Sign Out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
