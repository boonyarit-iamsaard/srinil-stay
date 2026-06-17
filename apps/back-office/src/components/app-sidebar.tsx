import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@srinil-stay/ui/components/sidebar";
import { Link, useRouterState } from "@tanstack/react-router";
import type { LucideIcon } from "lucide-react";
import { BedDouble, LayoutDashboard, Sparkles, UserPlus } from "lucide-react";

import NavUser from "./nav-user";

interface NavItem {
  icon: LucideIcon;
  title: string;
  to: "/dashboard" | "/invitations/create" | "/units";
}

const NAV_ITEMS: NavItem[] = [
  { title: "Dashboard", to: "/dashboard", icon: LayoutDashboard },
  { title: "Units", to: "/units", icon: BedDouble },
  { title: "Invitations", to: "/invitations/create", icon: UserPlus },
];

export function AppSidebar() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link to="/dashboard" />} size="lg">
              <div className="flex aspect-square size-8 items-center justify-center bg-primary text-primary-foreground">
                <Sparkles className="size-4" />
              </div>
              <div className="grid flex-1 text-left text-sm leading-tight">
                <span className="truncate font-semibold">Srinil Stay</span>
                <span className="truncate text-xs">Boutique stays</span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Platform</SidebarGroupLabel>
          <SidebarMenu>
            {NAV_ITEMS.map((item) => (
              <SidebarMenuItem key={item.to}>
                <SidebarMenuButton
                  isActive={pathname === item.to}
                  render={<Link to={item.to} />}
                  tooltip={item.title}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
