"use client";

/**
 * Notification Bell — shows real-time notification count and dropdown.
 *
 * Displays a bell icon in the top bar with unread count badge.
 * Click to open a popover with recent notifications.
 */

import { useState } from "react";
import Link from "next/link";
import {
  Bell,
  BellRing,
  Check,
  CheckCheck,
  Trash2,
  Briefcase,
  Brain,
  FileText,
  FolderKanban,
  Settings,
  Wifi,
  WifiOff,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useRealtimeEvents } from "@/hooks/use-realtime-events";
import type { NotificationItem, EventCategory } from "@/server/events/types";

// ============================================================================
// Category icon / color mapping
// ============================================================================

const CATEGORY_CONFIG: Record<
  EventCategory,
  { icon: typeof Bell; color: string; bg: string }
> = {
  job: {
    icon: Briefcase,
    color: "text-blue-600",
    bg: "bg-blue-100 dark:bg-blue-900/30",
  },
  ai: {
    icon: Brain,
    color: "text-purple-600",
    bg: "bg-purple-100 dark:bg-purple-900/30",
  },
  proposal: {
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-100 dark:bg-emerald-900/30",
  },
  project: {
    icon: FolderKanban,
    color: "text-amber-600",
    bg: "bg-amber-100 dark:bg-amber-900/30",
  },
  system: {
    icon: Settings,
    color: "text-gray-500",
    bg: "bg-gray-100 dark:bg-gray-800",
  },
};

// ============================================================================
// Component
// ============================================================================

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);

  const {
    status,
    notifications,
    unreadCount,
    markAllRead,
    markRead,
    clearNotifications,
  } = useRealtimeEvents({ autoConnect: true });

  const isConnected = status === "connected";

  // Filter out system events from the notification list display
  const displayNotifications = notifications.filter(
    (n) => n.category !== "system",
  );

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ""}`}
        >
          {unreadCount > 0 ? (
            <BellRing className="h-5 w-5 animate-[wiggle_0.5s_ease-in-out]" />
          ) : (
            <Bell className="h-5 w-5" />
          )}
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>

      <PopoverContent
        className="w-[380px] p-0"
        align="end"
        sideOffset={8}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold">Notifications</h3>
            <ConnectionIndicator isConnected={isConnected} status={status} />
          </div>
          <div className="flex items-center gap-1">
            {unreadCount > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={markAllRead}
                    aria-label="Mark all as read"
                  >
                    <CheckCheck className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Mark all as read</TooltipContent>
              </Tooltip>
            )}
            {displayNotifications.length > 0 && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7"
                    onClick={clearNotifications}
                    aria-label="Clear all notifications"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Clear all</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Notification List */}
        {displayNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Bell className="mb-2 h-8 w-8 text-muted-foreground/40" />
            <p className="text-sm text-muted-foreground">No notifications yet</p>
            <p className="text-xs text-muted-foreground/60">
              {isConnected
                ? "New events will appear here in real-time."
                : "Connect to start receiving notifications."}
            </p>
          </div>
        ) : (
          <ScrollArea className="max-h-[400px]">
            <div className="divide-y">
              {displayNotifications.map((notification) => (
                <NotificationRow
                  key={notification.id}
                  notification={notification}
                  onRead={() => markRead(notification.id)}
                  onClose={() => setIsOpen(false)}
                />
              ))}
            </div>
          </ScrollArea>
        )}

        {/* Footer */}
        {displayNotifications.length > 0 && (
          <>
            <Separator />
            <div className="p-2 text-center">
              <span className="text-xs text-muted-foreground">
                {displayNotifications.length} notification{displayNotifications.length !== 1 ? "s" : ""}
              </span>
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}

// ============================================================================
// Sub-components
// ============================================================================

function NotificationRow({
  notification,
  onRead,
  onClose,
}: {
  notification: NotificationItem;
  onRead: () => void;
  onClose: () => void;
}) {
  const config = CATEGORY_CONFIG[notification.category];
  const Icon = config.icon;

  const content = (
    <div
      className={`flex items-start gap-3 px-4 py-3 transition-colors hover:bg-muted/50 ${
        !notification.read ? "bg-muted/20" : ""
      }`}
      onClick={onRead}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") onRead();
      }}
    >
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.bg}`}
      >
        <Icon className={`h-4 w-4 ${config.color}`} />
      </div>
      <div className="flex-1 space-y-0.5">
        <div className="flex items-center justify-between gap-2">
          <p className="text-sm font-medium leading-tight">{notification.title}</p>
          {!notification.read && (
            <Badge
              variant="secondary"
              className="h-2 w-2 shrink-0 rounded-full bg-blue-500 p-0"
            />
          )}
        </div>
        <p className="text-xs text-muted-foreground leading-snug">
          {notification.description}
        </p>
        <p className="text-[10px] text-muted-foreground/60">
          {formatTimeAgo(notification.timestamp)}
        </p>
      </div>
    </div>
  );

  if (notification.href) {
    return (
      <Link href={notification.href} onClick={onClose}>
        {content}
      </Link>
    );
  }

  return content;
}

function ConnectionIndicator({
  isConnected,
  status,
}: {
  isConnected: boolean;
  status: string;
}) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="flex items-center gap-1">
          {isConnected ? (
            <Wifi className="h-3 w-3 text-emerald-500" />
          ) : (
            <WifiOff className="h-3 w-3 text-muted-foreground" />
          )}
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              isConnected ? "bg-emerald-500" : "bg-muted-foreground"
            }`}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent>
        {status === "connected"
          ? "Live updates active"
          : status === "connecting"
            ? "Connecting…"
            : "Disconnected — reconnecting…"}
      </TooltipContent>
    </Tooltip>
  );
}

// ============================================================================
// Helpers
// ============================================================================

function formatTimeAgo(timestamp: string): string {
  const now = Date.now();
  const diff = now - new Date(timestamp).getTime();

  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return "Just now";

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

