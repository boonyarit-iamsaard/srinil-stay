import { Separator } from "@srinil-stay/ui/components/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@srinil-stay/ui/components/sidebar";
import {
  createFileRoute,
  Outlet,
  redirect,
  useRouterState,
} from "@tanstack/react-router";

import AppSidebar from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/ai": "AI Chat",
};

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session.data) {
      redirect({
        to: "/login",
        throw: true,
      });
    }
    return { session };
  },
});

function ProtectedLayout() {
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const title = TITLES[pathname] ?? "";

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="h-svh overflow-hidden">
        <header className="flex h-14 shrink-0 items-center gap-2 border-b px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator className="mr-2" orientation="vertical" />
          <h1 className="font-medium text-sm">{title}</h1>
          <div className="ml-auto">
            <ModeToggle />
          </div>
        </header>
        <div className="min-h-0 flex-1 overflow-hidden">
          <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
