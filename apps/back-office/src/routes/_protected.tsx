import { Button } from "@srinil-stay/ui/components/button";
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
  useNavigate,
  useRouterState,
} from "@tanstack/react-router";
import { z } from "zod";

import { AppSidebar } from "@/components/app-sidebar";
import { ModeToggle } from "@/components/mode-toggle";
import { authClient } from "@/lib/auth-client";

const TITLES: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/invitations/create": "Invitations",
};
// TODO: Move role literals to a shared non-database package; do not import
// @srinil-stay/drizzle/schema/roles into frontend code.
const STAFF_ROLE = "staff";
const staffUserSchema = z.object({
  role: z.literal(STAFF_ROLE),
});

export const Route = createFileRoute("/_protected")({
  component: ProtectedLayout,
  beforeLoad: async () => {
    const session = await authClient.getSession();
    const sessionData = session.data;
    if (!sessionData) {
      throw redirect({
        to: "/login",
      });
    }
    return {
      session,
      access: staffUserSchema.safeParse(sessionData.user).success
        ? "allowed"
        : "forbidden",
    };
  },
});

function ProtectedLayout() {
  const { access } = Route.useRouteContext();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });
  const title = TITLES[pathname] ?? "";

  if (access === "forbidden") {
    return <ForbiddenAccess />;
  }

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

function ForbiddenAccess() {
  const navigate = useNavigate();

  return (
    <main className="flex min-h-svh items-center justify-center px-6">
      <section className="w-full max-w-sm space-y-5 text-center">
        <div className="space-y-2">
          <h1 className="font-semibold text-2xl">Staff access required</h1>
          <p className="text-muted-foreground text-sm">
            This area is only available to invited Srinil Stay staff.
          </p>
        </div>
        <Button
          onClick={() => {
            authClient.signOut({
              fetchOptions: {
                onSuccess: () => {
                  navigate({ to: "/login" });
                },
              },
            });
          }}
        >
          Sign out
        </Button>
      </section>
    </main>
  );
}
