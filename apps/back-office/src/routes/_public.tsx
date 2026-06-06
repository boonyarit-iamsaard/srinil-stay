import { createFileRoute, Outlet } from "@tanstack/react-router";

import PublicFooter from "@/components/public-footer";
import PublicHeader from "@/components/public-header";

export const Route = createFileRoute("/_public")({
  component: PublicLayout,
});

function PublicLayout() {
  return (
    <div className="flex min-h-svh flex-col">
      <PublicHeader />
      <main className="flex-1">
        <Outlet />
      </main>
      <PublicFooter />
    </div>
  );
}
