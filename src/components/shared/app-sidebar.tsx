/**
 * App Sidebar — clean, collapsible navigation inspired by modern SaaS dashboards.
 *
 * Features:
 *   - Brand header with collapse toggle
 *   - Collapsible grouped sections with chevron indicators
 *   - Colored status dots and count badges on nav items
 *   - Bottom utility links (Help, Settings)
 *   - User profile footer with dropdown menu
 */

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard,
  Briefcase,
  FileText,
  FolderKanban,
  Users,
  GitBranch,
  Settings,
  Zap,
  TrendingUp,
  Shield,
  Route,
  ChevronDown,
  ChevronsLeft,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuBadge,
  SidebarHeader,
  SidebarFooter,
  SidebarRail,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { UserMenu } from "@/components/shared/user-menu";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  /** Colored dot indicator (CSS color class) */
  dotColor?: string;
  /** Static count badge */
  badge?: number;
  /** If true, shows a pulsing red notification badge */
  notificationBadge?: boolean;
  /** External link indicator */
  external?: boolean;
}

interface NavSection {
  label: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
  items: NavItem[];
}

// ---------------------------------------------------------------------------
// Navigation config
// ---------------------------------------------------------------------------

const OVERVIEW_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
];

const PIPELINE_SECTION: NavSection = {
  label: "Pipeline",
  collapsible: true,
  defaultOpen: true,
  items: [
    { label: "All Jobs", href: "/jobs", icon: Briefcase },
    { label: "Pipeline Board", href: "/pipeline", icon: Route, dotColor: "bg-blue-500" },
    { label: "Proposals", href: "/proposals", icon: FileText, dotColor: "bg-amber-500" },
    { label: "Projects", href: "/projects", icon: FolderKanban, dotColor: "bg-emerald-500" },
    { label: "Clients", href: "/clients", icon: Users, dotColor: "bg-violet-500" },
  ],
};

const TOOLS_SECTION: NavSection = {
  label: "Tools",
  collapsible: true,
  defaultOpen: true,
  items: [
    { label: "AI Analysis", href: "/ai-analysis", icon: Zap },
    { label: "Scope Shield", href: "/scope-shield", icon: Shield },
    { label: "GitHub Skills", href: "/github", icon: GitBranch },
  ],
};

const METRICS_SECTION: NavSection = {
  label: "Metrics",
  collapsible: true,
  defaultOpen: false,
  items: [
    { label: "Analytics", href: "/analytics", icon: TrendingUp },
  ],
};

const BOTTOM_ITEMS: NavItem[] = [
  { label: "Settings", href: "/settings", icon: Settings },
];

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export function AppSidebar() {
  const pathname = usePathname();
  const { toggleSidebar } = useSidebar();

  return (
    <Sidebar>
      {/* ----------------------------------------------------------------- */}
      {/* Header — Brand + Collapse toggle                                  */}
      {/* ----------------------------------------------------------------- */}
      <SidebarHeader className="px-4 py-4">
        <div className="flex items-center justify-between">
          <Link
            href="/dashboard"
            className="group flex items-center gap-2.5 transition-opacity hover:opacity-80"
          >
            <BrandLogo />
            <div className="group-data-[collapsible=icon]:hidden">
              <h2 className="text-sm font-bold tracking-tight leading-none">
                Bid<span className="text-primary">Buddy</span>
              </h2>
              <p className="mt-0.5 text-[10px] leading-none text-muted-foreground">
                Upwork AI Assistant
              </p>
            </div>
          </Link>
          <button
            onClick={toggleSidebar}
            className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground/60 transition-colors hover:text-foreground hover:bg-muted group-data-[collapsible=icon]:hidden"
            title="Collapse sidebar (⌘B)"
          >
            <ChevronsLeft className="h-4 w-4" />
          </button>
        </div>
      </SidebarHeader>

      {/* ----------------------------------------------------------------- */}
      {/* Content                                                           */}
      {/* ----------------------------------------------------------------- */}
      <SidebarContent className="px-2">
        {/* Overview — non-collapsible */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-3">
            Overview
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {OVERVIEW_ITEMS.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Pipeline — collapsible */}
        <CollapsibleNavSection
          section={PIPELINE_SECTION}
          pathname={pathname}
        />

        {/* Tools — collapsible */}
        <CollapsibleNavSection
          section={TOOLS_SECTION}
          pathname={pathname}
        />

        {/* Metrics — collapsible */}
        <CollapsibleNavSection
          section={METRICS_SECTION}
          pathname={pathname}
        />
      </SidebarContent>

      {/* ----------------------------------------------------------------- */}
      {/* Bottom utility links                                              */}
      {/* ----------------------------------------------------------------- */}
      <div className="mt-auto border-t px-2 py-2">
        <SidebarMenu>
          {BOTTOM_ITEMS.map((item) => (
            <NavLink key={item.href} item={item} pathname={pathname} />
          ))}
        </SidebarMenu>
      </div>

      {/* ----------------------------------------------------------------- */}
      {/* Footer — User profile                                             */}
      {/* ----------------------------------------------------------------- */}
      <SidebarFooter className="border-t px-3 py-3">
        <UserMenu />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}

// ---------------------------------------------------------------------------
// Brand Logo SVG
// ---------------------------------------------------------------------------

function BrandLogo() {
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
      <svg
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
      </svg>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Collapsible Nav Section
// ---------------------------------------------------------------------------

function CollapsibleNavSection({
  section,
  pathname,
  extraItems,
}: {
  section: NavSection;
  pathname: string;
  extraItems?: NavItem[];
}) {
  const allItems = extraItems
    ? [...extraItems, ...section.items]
    : section.items;

  // Auto-open if any child is active
  const hasActiveChild = allItems.some((item) =>
    pathname.startsWith(item.href)
  );

  const [isOpen, setIsOpen] = useState(
    section.defaultOpen ?? hasActiveChild
  );

  return (
    <Collapsible open={isOpen || hasActiveChild} onOpenChange={setIsOpen}>
      <SidebarGroup>
        <CollapsibleTrigger asChild>
          <SidebarGroupLabel className="group/label cursor-pointer select-none text-[10px] uppercase tracking-widest text-muted-foreground/60 font-semibold px-3 hover:text-muted-foreground transition-colors">
            <span className="flex-1">{section.label}</span>
            <ChevronDown
              className={`
                ml-auto h-3 w-3 text-muted-foreground/40
                transition-transform duration-200
                ${isOpen || hasActiveChild ? "rotate-0" : "-rotate-90"}
              `}
            />
          </SidebarGroupLabel>
        </CollapsibleTrigger>

        <CollapsibleContent>
          <SidebarGroupContent>
            <SidebarMenu>
              {allItems.map((item) => (
                <NavLink key={item.href} item={item} pathname={pathname} />
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </CollapsibleContent>
      </SidebarGroup>
    </Collapsible>
  );
}

// ---------------------------------------------------------------------------
// Nav Link — individual menu item with dot, badge, notification support
// ---------------------------------------------------------------------------

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const isActive = pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <SidebarMenuItem>
      <SidebarMenuButton
        asChild
        isActive={isActive}
        tooltip={item.label}
        className="group/navlink relative"
      >
        <Link href={item.href}>
          {/* Colored dot indicator */}
          {item.dotColor && (
            <span
              className={`h-1.5 w-1.5 shrink-0 rounded-full ${item.dotColor} ${
                isActive ? "ring-2 ring-offset-1 ring-offset-sidebar ring-current opacity-100" : "opacity-60"
              } transition-opacity group-hover/navlink:opacity-100`}
            />
          )}
          {!item.dotColor && <Icon className="h-4 w-4 shrink-0" />}
          <span className="flex-1 truncate">{item.label}</span>
        </Link>
      </SidebarMenuButton>

      {/* Count badge */}
      {item.badge !== undefined && item.badge > 0 && (
        <SidebarMenuBadge
          className={
            item.notificationBadge
              ? "bg-destructive text-destructive-foreground rounded-full text-[10px] min-w-[18px] h-[18px] px-1 flex items-center justify-center font-semibold"
              : "text-muted-foreground text-[11px] font-medium"
          }
        >
          {item.badge}
        </SidebarMenuBadge>
      )}

      {/* Notification pulse (no count) */}
      {item.notificationBadge && !item.badge && (
        <SidebarMenuBadge>
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-destructive opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-destructive" />
          </span>
        </SidebarMenuBadge>
      )}
    </SidebarMenuItem>
  );
}
